---
description: Analyze code changes and update project documentation in DOCS/
argument-hint: "(optional) specific docs to focus on or description of changes"
---

You are executing the **update documentation** workflow. This will analyze code changes on the current branch vs `dev` and make minimal, targeted updates to project documentation in `DOCS/`.

**User hint (optional):** $ARGUMENTS

## Pre-flight Checks

1. **Fetch latest dev:** `git fetch origin dev`
2. **Check for diff:** Run `git diff origin/dev..HEAD --name-only -- ':!client/'`. If there's no diff, report "No changes vs dev — nothing to update." and stop.
3. **Check if only docs/changelog/client changed:** If the only changed files are in `DOCS/`, `changelog/`, or `client/`, skip — no documentation updates needed.

## Execute the update-docs Skill

Invoke the `update-docs` skill to:

1. Gather the diff (excluding `client/` directory)
2. Discover all docs in `DOCS/`
3. Map changes to doc sections
4. Read affected sections
5. Draft minimal updates
6. Present changes for user review
7. Apply and commit if approved

The skill handles all the logic — this command is the entry point for running it standalone (outside of the `/push-pr` workflow).

## Final Output

After the skill completes, print a summary:
- Which docs were updated (or "No updates needed")
- Commit hash if changes were made
- Reminder: "Run `/push-pr` when ready to create a PR"
