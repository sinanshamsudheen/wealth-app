---
name: git-workflow
description: Git workflow conventions for the wealth-app frontend project. Covers branch naming, PR conventions, and changelog format. Use when performing any git operations, branch management, or changelog generation.
---

## Project Git Conventions

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
- Two sections: **Business** (non-technical stakeholders) and **Developer** (engineers and API consumers)
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

### UI Changes

Detail any user-facing UI additions, modifications, or removals. Include new pages, components, layout changes, or interaction updates.

---

### API / Integration Changes

Detail any changes to API clients, endpoint definitions, mock handlers, or LLM provider integrations. Write "No changes." if none.

---

### Internal / Non-Breaking Changes

**Change Title**

Description of internal changes, refactoring, or infrastructure updates. Use tables for structured data like new type definitions, store changes, or configuration options.

---
```

### Project Context

This is a React 19 + TypeScript frontend SPA for the Invictus AI Copilot wealth management platform. It uses Vite 8 for bundling, pnpm as the package manager, Zustand for state management, shadcn/ui + Tailwind CSS 4.2 for styling, React Router 7 for routing, and MSW for API mocking. The app provides agent management, run monitoring, insights dashboards, and AI chat interfaces for wealth advisors. Multi-LLM support routes to Anthropic, Azure OpenAI, or OpenRouter based on model prefix.
