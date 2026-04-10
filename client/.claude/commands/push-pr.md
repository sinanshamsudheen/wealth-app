---
description: Push changes, create a PR to dev, and generate a changelog
argument-hint: "(optional) brief description of what changed"
---

You are executing the **push and create PR** workflow. This will stage and commit changes, push to origin, create a PR targeting `dev`, and generate a changelog file.

**User hint (optional):** $ARGUMENTS

## Pre-flight Checks

Before starting, verify:

1. **Current branch is a feature branch:** Run `git branch --show-current`. If the branch is `main` or `dev`, refuse to proceed and tell the user: "You're on `{branch}`. Switch to a feature branch first. Use `/start-feature` to create one."

2. **`gh` CLI is available:** Run `gh --version`. If it fails, tell the user to install it: `brew install gh` then `gh auth login`.

3. **No existing open PR for this branch:** Run `gh pr list --head $(git branch --show-current) --state open --json number,url`. If a PR already exists, show the user the existing PR URL and ask if they want to update it instead of creating a new one.

---

## Phase 1: Analyze Changes

1. Run `git status` to see all changed, staged, and untracked files.
2. Run `git diff` (unstaged changes) and `git diff --cached` (staged changes).
3. Run `git fetch origin dev` then `git log origin/dev..HEAD --oneline` to see all commits on this branch not yet in dev.

If there are no changes to commit AND no unpushed commits, inform the user: "Nothing to push — working tree is clean and branch is up to date." and stop.

---

## Phase 2: Stage and Commit

4. **Check for sensitive files:** Before staging, scan for files matching these patterns: `.env*`, `credentials*`, `*secret*`, `*.key`, `*.pem`, `*.p12`, `*.pfx`. If any are found in the changes, **warn the user** and exclude them from staging.

5. **Stage changes:** `git add -A` (excluding any sensitive files identified above — use `git reset HEAD <file>` to unstage them if needed).

6. **Generate commit message:** Analyze the full diff of all staged changes. Write a commit message:
   - **First line:** Imperative mood, under 72 characters (e.g., "Add Celery retry logic for failed agent runs")
   - Use conventional commit prefixes where appropriate: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
   - **Body (if non-trivial):** Blank line, then bullet points explaining key changes.
   - If `$ARGUMENTS` was provided, use it as context for the message.

7. **Confirm with user:** Show the proposed commit message and ask for confirmation before committing. Let them edit if they want.

8. **Create the commit.**

---

## Phase 2.5: Update Project Documentation

9. **Invoke the `update-docs` skill** to analyze the committed changes and determine if any documentation in `DOCS/` needs updating.

   - The skill will diff `origin/dev..HEAD`, map changed files to documentation sections, and propose minimal targeted updates.
   - If documentation updates are needed, the skill will show proposed changes and ask for confirmation.
   - If confirmed, it creates a separate `docs:` commit for the documentation changes.
   - If no documentation is affected, it reports "No documentation updates needed" and continues.

   **Skip this phase if:**
   - The only changes are in `DOCS/` itself (manual doc edits — avoid circular updates)
   - The only changes are in `changelog/` (changelog-only updates)
   - The only changes are in `client/` (frontend POC — not part of core platform docs)
   - The branch has no diff vs `origin/dev`

---

## Phase 2.75: Run Tests

10. **Run the full test suite** to catch failures before pushing:

```bash
uv run pytest tests/ -v
```

- If **all tests pass** → continue to Phase 3.
- If **any tests fail** → stop and fix the failures. Re-run until all tests pass. Do NOT proceed to push or PR creation with failing tests.
- After fixing test failures, stage and commit the fixes (follow Phase 2 commit conventions), then re-run the test suite.

**Also run code quality checks** (matching what CI runs):

```bash
uv run ruff check .
uv run mypy core/
```

Fix any ruff or mypy errors before proceeding.

---

## Phase 3: Push

11. Push to origin: `git push -u origin HEAD`

If the push fails due to upstream changes:
- Inform the user.
- Suggest: `git pull --rebase origin dev` then retry the push.
- Do NOT force push unless the user explicitly asks.

---

## Phase 4: Create PR

12. Generate a PR title and description by analyzing ALL commits on the branch (`git log origin/dev..HEAD`) and the cumulative diff (`git diff origin/dev..HEAD`).

13. Create the PR:
```bash
gh pr create --base dev --title "<title>" --body "<body>"
```

**PR title:** Short, imperative mood, under 70 characters. Use `$ARGUMENTS` as a hint if provided.

**PR body format:**
```markdown
## Summary
- Bullet points of what changed and why (2-4 bullets)

## Changes
- List of key files/modules modified with brief explanations

## Test plan
- [ ] Relevant testing steps or verification checklist

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Use a HEREDOC to pass the body for correct formatting.

14. **Print the PR URL** so the user can review it.

---

## Phase 5: Generate Changelog

15. **Determine today's date** in `YYYY-MM-DD` format.

16. **Ensure changelog directory exists:** `mkdir -p changelog/`

17. **Check if today's changelog exists:** Look for `changelog/changelog_YYYY-MM-DD.md`.

**If the file does NOT exist — create a new one:**

Analyze the diff (`git diff origin/dev..HEAD`) and all commit messages to generate changelog content for two audiences:

- **Business section:** Non-technical stakeholders. Describe user-facing impact in plain language. Bold the feature/change title. Focus on "what this means for users" not "what code changed."

- **Developer section:** Technical consumers. Include:
  - **SSE Endpoint — Input Changes:** New/changed request fields or parameters. Write "No new fields." if none.
  - **SSE Endpoint — Output Changes:** New/changed response fields. Write "No output changes." if none.
  - **Internal / Non-Breaking Changes:** Internal refactoring, new utilities, architecture changes. Use bold titles for each change, descriptive paragraphs, and tables where structured data is involved (e.g., new enum values, config options).

Use this template:
```markdown
# Changelog — YYYY-MM-DD

## Business

- **Feature Title** — Plain-language description of user-facing impact.

---

## Developer

### SSE Endpoint — Input Changes

No new fields.

---

### SSE Endpoint — Output Changes

No output changes.

---

### Internal / Non-Breaking Changes

**Change Title**

Description of internal changes.

---
```

**If the file ALREADY exists — append to it:**

Read the existing file. Add new bullet points under `## Business` and new subsections under `### Internal / Non-Breaking Changes`. Do not duplicate the file header or section headers. Preserve all existing content.

18. **Commit and push the changelog:**
```bash
git add changelog/changelog_YYYY-MM-DD.md
git commit -m "docs: add changelog for YYYY-MM-DD"
git push origin HEAD
```

---

## Final Output

Print a summary:
- Commit hash and message
- PR URL
- Changelog file path
- Branch name

---

## Edge Cases

- If `dev` doesn't exist on origin, ask if the PR should target `main` instead.
- If the diff is trivial (only whitespace, formatting, or comments), note this in both the PR description and changelog.
- If there are merge conflicts when pushing, guide the user through resolution rather than force-pushing.
- If `gh pr create` fails due to auth issues, provide the manual PR creation URL as a fallback.
