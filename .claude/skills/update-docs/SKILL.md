---
name: update-docs
description: Analyze code changes against dev branch and make minimal, targeted updates to CLAUDE.md and README.md. Use during PR creation (invoked by push-pr) or manually when significant code changes affect documented structure, conventions, or tech stack.
---

## Update Documentation Skill

This skill ensures project documentation stays in sync with code changes by making **minimal, surgical edits** — only touching sections directly affected by what changed.

### When to Trigger

- **Automatically** during the `/push-pr` workflow (Phase 2.5, after code commit, before push)
- **Manually** when the user says "update docs", "sync documentation", or similar
- After significant refactoring, new page/component creation, or dependency changes

---

### Step 1 — Gather the Diff

Run these commands to understand what changed on this branch vs `dev`:

```bash
git diff origin/dev..HEAD --name-only
git diff origin/dev..HEAD --stat
git diff origin/dev..HEAD
```

---

### Step 2 — Discover Target Docs

The documentation files to potentially update are:

1. **`CLAUDE.md`** (repo root) — project overview, tech stack, directory structure, conventions
2. **`client/README.md`** — client-specific setup and configuration notes

Read the current content of both files to understand their structure.

---

### Step 3 — Map Changes to Doc Sections

Use this mapping table to determine which documentation sections are affected:

| Changed path pattern | Doc(s) affected | Section(s) to check |
|---|---|---|
| `client/src/pages/*` (new page) | CLAUDE.md | Directory Structure (pages list) |
| `client/src/components/*/` (new feature dir) | CLAUDE.md | Directory Structure (components tree) |
| `client/src/store/*` (new store) | CLAUDE.md | Directory Structure (store list), State Management |
| `client/src/api/*` (new API client) | CLAUDE.md | Directory Structure (api tree), Important Notes |
| `client/src/hooks/*` (new hook) | CLAUDE.md | Directory Structure (hooks list) |
| `client/src/api/mock/*` (new mock handler) | CLAUDE.md | Important Notes (MSW section) |
| `client/package.json` (new dependency) | CLAUDE.md | Tech Stack (only if significant new dep added) |
| `client/vite.config.ts` | CLAUDE.md | Tech Stack, Commands |
| `client/tsconfig*.json` | CLAUDE.md | Conventions (Path Alias) |
| `client/eslint.config.js` | CLAUDE.md | Tech Stack (linting info) |
| `client/components.json` | CLAUDE.md | Tech Stack (shadcn config) |
| `.claude/*` | — | Do not update docs for .claude config changes |
| `changelog/*` | — | Do not update docs for changelog changes |

**Catch-all rule:** If a changed file does not match any pattern above, it likely does not require a documentation update. Only flag it if the change introduces a new architectural pattern or convention.

**Build the change manifest:** a list of `(doc_file, section_header, reason_for_update)` entries. If the manifest is empty, report "No documentation updates needed" and stop.

---

### Step 4 — Read Only Affected Sections

For each entry in the change manifest:

1. Open the target doc file
2. Navigate to the specific section identified (using headers as boundaries)
3. Read that section's content

Do **NOT** read entire docs unless the change is broad.

---

### Step 5 — Draft Minimal Updates

For each affected section, draft the **smallest possible edit** that reflects the code change.

#### What "Minimal" Means

- **New page added?** → Add to the pages comment in CLAUDE.md Directory Structure
- **New component feature directory?** → Add one line to the components tree in CLAUDE.md
- **New Zustand store?** → Add to the store list in CLAUDE.md
- **New API client?** → Add to the api tree in CLAUDE.md
- **New dependency?** → Add one line to Tech Stack in CLAUDE.md (only for significant deps)
- **New custom hook?** → Add to the hooks list in CLAUDE.md

#### What NOT to Do

- **Never** rewrite a section from scratch
- **Never** change prose style, tone, or voice
- **Never** restructure sections or change heading levels
- **Never** modify sections unrelated to the code change
- **Never** add commentary beyond what the existing doc style uses

---

### Step 6 — Present Changes for User Review

Before applying any edits, show the user a summary:

```
Documentation updates needed:

CLAUDE.md:
  → Directory Structure: add new PortfolioPage to pages list
  → Tech Stack: add react-hook-form dependency

client/README.md:
  → No changes needed
```

Ask: **"Apply these documentation updates? (yes / skip specific docs / no)"**

---

### Step 7 — Apply and Commit

1. Apply the approved edits using targeted edits (not full file rewrites)
2. Stage the modified doc files:
   ```bash
   git add CLAUDE.md client/README.md
   ```
3. Create a separate commit:
   ```bash
   git commit -m "docs: update project documentation to reflect <brief description>"
   ```
4. Do **NOT** push — the `/push-pr` workflow handles pushing after this phase

---

### Edge Cases

| Scenario | Behavior |
|---|---|
| No diff vs `origin/dev` | Skip entirely — nothing changed |
| Only `CLAUDE.md` or `README.md` changed | Skip — avoid circular doc-updating-docs loop |
| Only `changelog/` files changed | Skip — changelog is not project documentation |
| Only `.claude/` files changed | Skip — config changes don't need doc updates |
| Large PR touching many areas | Group summary by doc file, one line per section, let user approve per doc |
| Ambiguous change (unclear if docs need updating) | Ask the user rather than guessing |
| Branch not based on `dev` | Use the appropriate base branch for the diff |
