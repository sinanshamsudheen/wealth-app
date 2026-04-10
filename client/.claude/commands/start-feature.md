---
description: Create a new feature branch from the latest dev branch
argument-hint: "feature-name (e.g., auth-flow, celery-retry-logic)"
---

You are executing the **start feature branch** workflow. The user wants to create a clean feature branch from the latest `dev`.

**Feature name argument:** $ARGUMENTS

## Steps

### 1. Validate Argument

If `$ARGUMENTS` is empty or missing, ask the user for a feature name. Do not proceed without one. The feature name should be descriptive and kebab-case (e.g., `auth-flow`, `celery-retry-logic`).

### 2. Derive User Slug

Run `git config user.name` to get the git username. Convert it to a lowercase kebab-case slug:
- "Raoof Naushad" → "raoof-naushad"
- "John Smith" → "john-smith"

### 3. Sanitize Feature Name

Take the provided feature name and sanitize it:
- Convert to lowercase
- Replace spaces with hyphens
- Remove any characters that aren't alphanumeric or hyphens
- Trim leading/trailing hyphens

### 4. Fetch Latest Dev

Run `git fetch origin dev`.

**If this fails because `dev` does not exist on origin:**
- Inform the user that the `dev` branch doesn't exist on the remote.
- Ask if they want to create `dev` from `main` (or current branch) and push it to origin.
- If yes: `git checkout -b dev && git push -u origin dev`
- Then continue with the workflow.

### 5. Check for Uncommitted Work

Run `git status --porcelain`.

If there are ANY uncommitted or unstaged changes:
- **WARN the user explicitly** that all local changes will be permanently discarded.
- List the files that will be lost.
- Ask for explicit confirmation ("yes" / "no") before proceeding.
- Do **NOT** proceed silently — this is a destructive operation.

### 6. Reset Local to Match origin/dev

```bash
git checkout dev 2>/dev/null || git checkout -b dev origin/dev
git reset --hard origin/dev
```

This ensures the local `dev` branch exactly matches what's on origin, discarding all local state.

### 7. Create Feature Branch

The branch name format is: `feat-{user-slug}/{feature-name}`

Check if this branch already exists locally:
```bash
git branch --list "feat-{user-slug}/{feature-name}"
```

- If it exists, ask the user if they want to delete the old branch and recreate it.
  - If yes: `git branch -D feat-{user-slug}/{feature-name}`
  - If no: stop and let the user decide.

Create the branch:
```bash
git checkout -b feat-{user-slug}/{feature-name}
```

### 8. Confirm Success

Print a clear summary:
- Branch name created (e.g., `feat-raoof-naushad/auth-flow`)
- Based on commit: show `git log --oneline -1` (short hash + message)
- Remind the user they can now start coding and use `/push-pr` when ready to create a PR.

## Edge Cases

- If `origin` remote doesn't exist, error out with: "No 'origin' remote configured. Please add a remote first."
- If the user is already on the target feature branch, inform them and ask if they want to reset it to latest dev.
- If there are stashed changes, mention them but do not touch them.
