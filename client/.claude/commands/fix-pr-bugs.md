---
description: Fetch Cursor Bugbot findings from the current PR and fix them
argument-hint: "(optional) all | high | medium | low | comma-separated issue numbers"
---

You are executing the **fix Bugbot findings** workflow. This fetches bug reports posted by Cursor Bugbot on the current branch's open PR, triages them, and fixes the selected issues.

**User filter (optional):** $ARGUMENTS

---

## Phase 1: Discover PR & Fetch Findings

1. **Verify `gh` CLI:** Run `gh --version`. If it fails, tell the user: "Install the GitHub CLI first: `brew install gh` then `gh auth login`."

2. **Get current branch and repo info:**
   ```bash
   git branch --show-current
   gh repo view --json owner,name --jq '"\(.owner.login)/\(.name)"'
   ```

3. **Find open PR for this branch:**
   ```bash
   gh pr list --head $(git branch --show-current) --state open --json number,url
   ```
   - If no open PR → tell the user: "No open PR found for this branch. Push your changes and create a PR first." and stop.

4. **Fetch all Bugbot comments:**
   ```bash
   gh api repos/{owner}/{repo}/pulls/{number}/comments \
     --jq '[.[] | select(.user.login == "cursor[bot]") | {
       path: .path,
       line: .line,
       body: .body,
       diff_hunk: .diff_hunk
     }]'
   ```
   - If no comments from `cursor[bot]` → "No Bugbot findings on this PR. It may still be running — check PR checks." and stop.

5. **Parse each comment** to extract:
   - **Title:** First line of `.body`, strip leading `### `
   - **Severity:** Extract from `**High Severity**`, `**Medium Severity**`, or `**Low Severity**` in the body
   - **Description:** Text between `<!-- DESCRIPTION START -->` and `<!-- DESCRIPTION END -->` HTML comments
   - **File path:** The `.path` field
   - **Line number:** The `.line` field (may be null)
   - **Additional locations:** Text between `<!-- LOCATIONS START` and `LOCATIONS END -->`, parse as `file#Lstart-Lend` entries

---

## Phase 2: Triage & Present

6. **Check for already-fixed issues:** For each finding, read the current file at the reported path and line. If the code at that location has changed significantly from the `diff_hunk` in the comment (e.g., the problematic pattern is no longer present), mark it as "ALREADY FIXED".

7. **Group and filter findings:**
   - Group by severity: High → Medium → Low
   - Mark findings in `client/` as "SKIPPED (frontend POC)"
   - Mark already-fixed findings as "ALREADY FIXED"

8. **Present summary to user:**
   ```
   Cursor Bugbot found N issues on PR #X:

   HIGH:
     1. [file:line] Title
     2. [file:line] Title

   MEDIUM:
     3. [file:line] Title

   LOW:
     4. [file] Title

   SKIPPED (client/):
     - [file] Title

   ALREADY FIXED:
     - [file:line] Title ← code has changed since Bugbot reviewed
   ```

9. **Determine which issues to fix:**
   - If `$ARGUMENTS` is `all` → fix all non-skipped, non-fixed issues
   - If `$ARGUMENTS` is `high`, `medium`, or `low` → fix only that severity level
   - If `$ARGUMENTS` is comma-separated numbers (e.g., `1,3,5`) → fix those specific issues
   - If `$ARGUMENTS` is empty → ask the user: "Fix all? Fix by severity (high/medium/low)? Pick specific numbers? Or skip?"

---

## Phase 3: Fix

10. **For each selected finding**, in severity order (High first):
    a. Read the file at the path and line indicated
    b. Read the Bugbot description to understand the exact issue
    c. Read any additional locations referenced
    d. Determine and apply the minimal fix — do NOT refactor surrounding code
    e. Print a one-line summary of what was changed

11. **After all fixes, run the full quality gate:**
    ```bash
    uv run ruff check .
    uv run mypy core/
    uv run pytest tests/ -v
    ```
    - If ruff or mypy fails → fix the issue, re-run
    - If tests fail → diagnose and fix, re-run
    - Do NOT proceed until all three pass

---

## Phase 4: Commit & Push

12. **Stage the changed files** (only files that were actually modified as fixes):
    ```bash
    git add <list of fixed files>
    ```

13. **Show the user** the staged diff summary and ask: "Commit and push these fixes?"

14. **If confirmed**, commit and push:
    ```bash
    git commit -m "fix: address Cursor Bugbot findings on PR #N

    - <one-line summary per fix>
    "
    git push origin HEAD
    ```

15. **Print final summary:**
    - Number of issues fixed
    - Files modified
    - Test results (all passing)
    - PR URL

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No open PR for this branch | Stop with message, suggest creating a PR first |
| No Bugbot comments found | Stop — Bugbot may not have run yet |
| All findings already fixed | Report "All Bugbot findings appear to be already addressed" and stop |
| Finding in `client/` directory | Skip by default (frontend POC), note as skipped |
| Fix introduces a test failure | Fix the regression before proceeding |
| Finding is a false positive | Skip it — note to user that they can dismiss it on GitHub |
| Multiple findings in same file | Fix all findings in the file together to avoid conflicts |
| Bugbot comment references deleted file | Skip with note "file no longer exists" |
| `gh api` rate limited | Tell user to wait and retry |
