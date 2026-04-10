---
name: git-workflow
description: Git workflow conventions for the invictus-ai-agents project. Covers branch naming, PR conventions, and changelog format. Use when performing any git operations, branch management, or changelog generation.
---

## Project Git Conventions

**Repository:** git@github.com:Asbi-Tech/invictus-ai-agents.git
**Primary development branch:** `dev`
**Production branch:** `main`

### Branch Naming

- Feature branches: `feat-{user-slug}/{feature-name}`
- User slug: derived from `git config user.name`, lowercased, spaces replaced with hyphens
- Feature name: lowercase, kebab-case, descriptive

### PR Conventions

- All PRs target `dev` unless explicitly stated otherwise
- PR titles: imperative mood, under 70 characters
- PR descriptions include Summary, Changes, and Test plan sections

### Changelog Format

- Location: `changelog/changelog_YYYY-MM-DD.md` at repo root
- Two sections: **Business** (non-technical stakeholders) and **Developer** (API consumers and engineers)
- Business section: bold feature titles with plain-language descriptions
- Developer section: precise technical details with before/after comparisons, tables for schema changes
- If a changelog for today already exists, append to it rather than overwriting

### Changelog Template

```markdown
# Changelog — YYYY-MM-DD

## Business

- **Feature Title** — Plain-language description of what changed from the user's perspective.

---

## Developer

### SSE Endpoint — Input Changes

Detail any new/changed input fields or parameters.

---

### SSE Endpoint — Output Changes

Detail any new/changed output fields or response schemas.

---

### Internal / Non-Breaking Changes

**Change Title**

Description of internal changes, refactoring, or infrastructure updates. Use tables for structured data like new enum values, configuration options, or API fields.

---
```

### Project Context

This is a Python backend (FastAPI + LangGraph + Celery) for AI financial agents. The platform runs long-running agentic workflows for deal research, document analysis, financial calculations, and similar operations. Currently has 6 registered workflows (1 production, 5 sample), 8 tools, full observability (structlog, audit log, LangSmith, OpenTelemetry), and 65 tests. Phases 0–4 complete; building toward 8 production workflows in Phases 5–7.
