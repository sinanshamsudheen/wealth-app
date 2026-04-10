---
name: update-docs
description: Analyze code changes against dev branch and make minimal, targeted updates to project documentation in DOCS/. Use during PR creation (invoked by push-pr) or manually when significant code changes affect documented architecture, APIs, workflows, or infrastructure.
---

## Update Documentation Skill

This skill ensures project documentation stays in sync with code changes by making **minimal, surgical edits** — only touching sections directly affected by what changed.

### When to Trigger

- **Automatically** during the `/push-pr` workflow (Phase 2.5, after code commit, before push)
- **Manually** when the user says "update docs", "sync documentation", or similar
- After significant refactoring, new workflow creation, or API changes

---

### Step 1 — Gather the Diff

Run these commands to understand what changed on this branch vs `dev`:

```bash
# List of changed files (excluding client/ POC directory)
git diff origin/dev..HEAD --name-only -- ':!client/'

# Summary stats
git diff origin/dev..HEAD --stat -- ':!client/'

# Full diff (needed to understand what actually changed)
git diff origin/dev..HEAD -- ':!client/'
```

> **Important:** Always exclude the `client/` directory from all diffs and analysis. The `client/` folder contains a frontend POC and is not part of the core platform documentation.

---

### Step 2 — Discover All Docs

List all `*.md` files in the `DOCS/` directory. Do not hardcode the list — new docs may be added over time.

For each doc file found, scan and extract the H2 (`##`) and H3 (`###`) section headers to build a section index. This index is used in the next step to identify which sections to update.

---

### Step 3 — Map Changes to Doc Sections

Use this mapping table to determine which documentation sections are affected by each changed file. Match changed file paths against the patterns below:

| Changed path pattern | Doc(s) affected | Section(s) to check |
|---|---|---|
| `agents/*/` (new workflow folder) | architecture.md, phased-build.md | Workflows table, Repository Structure tree, Phase 6 P1 Workflows |
| `agents/*/schemas.py` | architecture.md | Data Models (if new shared state patterns) |
| `core/tools/*` | architecture.md | Data Sources, Tools table, Repository Structure |
| `core/schemas/*` | architecture.md | Data Models section |
| `core/llm/*` | architecture.md | LLM Providers section, Technology Stack > Core Platform table |
| `core/memory/*` | architecture.md | Repository Structure |
| `core/middleware/*` | architecture.md | Security Model, Multi-Tenancy, Repository Structure |
| `core/config.py` | architecture.md, dev-guide.md | Environment Configuration, Local setup |
| `core/logging.py` or `core/telemetry.py` | dev-guide.md | Observability sections |
| `api/routers/*` | architecture.md, dev-guide.md | API Contracts, Running a Workflow Locally |
| `api/main.py` | architecture.md | Repository Structure |
| `api/dependencies.py` | architecture.md | Repository Structure |
| `worker/*` | architecture.md | Service Interaction Diagram, Repository Structure |
| `db/models.py` | architecture.md | Data Models (AgentRun, AuditLog, RunStatus) |
| `db/migrations/*` | dev-guide.md | Database setup steps |
| `infra/docker/*` | dev-guide.md | Docker Images section |
| `infra/terraform/*` | dev-guide.md | Azure Container Apps, Infra Provisioning |
| `docker-compose.yml` | dev-guide.md | "Start local infrastructure" table |
| `pyproject.toml` | architecture.md | Technology Stack tables (only if new dependencies added) |
| `.github/workflows/*` | dev-guide.md | CI Pipeline, Deploy sections |
| `evaluations/*` | dev-guide.md | Testing > Layer 3 (DeepEval) |
| `scripts/*` | dev-guide.md | Dev helper scripts, setup sections |

**Catch-all rule:** If a changed file does not match any pattern above, flag it to the user: *"The file `<path>` doesn't match a known doc mapping. Does this change affect any documentation?"* Let the user decide.

**Build the change manifest:** a list of `(doc_file, section_header, reason_for_update)` entries. If the manifest is empty, report "No documentation updates needed" and stop.

---

### Step 4 — Read Only Affected Sections

For each entry in the change manifest:

1. Open the target doc file
2. Navigate to the specific section identified (using H2/H3 headers as boundaries)
3. Read that section's content

Do **NOT** read entire docs unless the change is broad (e.g., a new workflow that affects the repo structure diagram spanning many lines).

---

### Step 5 — Draft Minimal Updates

For each affected section, draft the **smallest possible edit** that reflects the code change. Follow these strict rules:

#### What "Minimal" Means

- **New workflow folder added?** → Add one line to the repo structure tree in architecture.md. Add a row to the Workflows table. Add one entry in phased-build.md Phase 6 if applicable.
- **New API route added?** → Add the endpoint contract block (method, path, request/response) to architecture.md API Contracts section.
- **New tool added?** → Add one row to the Tools table in architecture.md. Add one line to the repo structure tree. Create a doc in `DOCS/tools/` if it's a significant tool.
- **Schema field added/changed?** → Update the relevant model code block in architecture.md Data Models.
- **New dependency added?** → Add one row to the appropriate Technology Stack table in architecture.md.
- **Infrastructure changed?** → Update the relevant Terraform/Docker section in dev-guide.md.
- **New CI step?** → Update the relevant workflow YAML block in dev-guide.md.
- **Docker compose service added?** → Add one row to the local infrastructure services table in dev-guide.md.

#### What NOT to Do

- **Never** rewrite a section from scratch
- **Never** change prose style, tone, or voice
- **Never** restructure sections or change heading levels
- **Never** modify sections unrelated to the code change
- **Never** add commentary, opinions, or explanations beyond what the existing doc style uses
- **Never** change formatting conventions (if the doc uses `|` tables, use `|` tables)

#### Formatting Rules for the Repo Structure Tree (architecture.md)

The repository structure is an ASCII tree diagram. When inserting lines:
- Match the exact indentation and tree-drawing characters (`├──`, `│`, `└──`)
- Insert in alphabetical order within the parent directory
- Include a comment with `#` matching the existing style (e.g., `# Workflow #N`)

---

### Step 6 — Present Changes for User Review

Before applying any edits, show the user a summary:

```
📄 Documentation updates needed:

architecture.md:
  → Repository Structure: add agents/risk_scoring/ to tree
  → Data Models: add risk_score field to AgentRun

dev-guide.md:
  → No changes needed

phased-build.md:
  → Phase 6: add Risk Scoring to P1 workflow list
```

Ask: **"Apply these documentation updates? (yes / skip specific docs / no)"**

- If **yes** → apply all
- If **skip** → ask which docs to skip, apply the rest
- If **no** → skip entirely, continue with push-pr workflow

---

### Step 7 — Apply and Commit

1. Apply the approved edits to the doc files using targeted edits (not full file rewrites)
2. Stage only files in `DOCS/`:
   ```bash
   git add DOCS/
   ```
3. Create a separate commit:
   ```bash
   git commit -m "docs: update project documentation to reflect <brief description of changes>"
   ```
4. Do **NOT** push — the `/push-pr` workflow handles pushing after this phase

---

### Edge Cases

| Scenario | Behavior |
|---|---|
| No diff vs `origin/dev` | Skip entirely — nothing changed |
| Only `DOCS/` files changed | Skip — avoid circular doc-updating-docs loop |
| Only `changelog/` files changed | Skip — changelog is not project documentation |
| Only `client/` files changed | Skip — `client/` is a frontend POC, not part of core platform docs |
| Doc file in mapping doesn't exist yet | Skip that doc — project may not have created it yet |
| New unknown `.md` file appears in `DOCS/` | Note it to the user ("New doc detected: `<file>`. Not modifying it.") but don't touch it |
| Large PR touching many areas | Group the summary by doc file, show one line per affected section, let user approve per doc |
| Ambiguous change (unclear if docs need updating) | Ask the user rather than guessing |
| Branch not based on `dev` | Use the appropriate base branch for the diff |
