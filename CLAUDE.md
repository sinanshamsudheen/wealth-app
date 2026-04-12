# Invictus AI — Wealth Management Platform

AI-native wealth management platform with 6 modules: **Engage** (CRM), **Plan** (financial planning), **Tools & Communication**, **Deals** (deal sourcing), **Insights** (reporting), and **Administration** (auth/RBAC). Each module can be used standalone or as part of the full suite. Administration is the shared backbone for auth and permissions across all modules.

## Architecture Documentation

Full-stack architecture docs live in `architecture/` at the repo root. **Always consult these when building features** — they define module boundaries, API conventions, database schemas, RBAC patterns, and cross-module integration rules. See [architecture/README.md](architecture/README.md) for the table of contents.

## Current State

Currently this repo contains **only the frontend client** (`client/`). Backend and database are planned — see `architecture/04-backend-architecture.md` and `architecture/05-database-architecture.md` for the target design.

## Tech Stack

- **React 19** + **TypeScript 5.9** — UI framework
- **Vite 8** — build tool and dev server
- **pnpm 10.15** — package manager
- **Zustand 5** — state management
- **shadcn/ui** (base-nova style) + **Tailwind CSS 4.2** — styling and component library
- **React Router 7** — client-side routing
- **MSW 2** — Mock Service Worker for API mocking (always enabled in dev)
- **Recharts** — data visualization / charting
- **Lucide React** — icons
- **ESLint** (flat config) — linting (no Prettier)

## Directory Structure

All source code lives under `client/`:

```
client/src/
├── pages/              # Route-level page components (HomePage, LoginPage, DashboardPage, etc.)
├── components/         # Organized by feature domain
│   ├── ui/             # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── agents/         # Agent management components
│   ├── chat/           # Chat interface components
│   ├── hitl/           # Human-in-the-loop approval UI
│   ├── insights/       # Insights and portfolio monitoring
│   ├── layout/         # AppShell, sidebar, navigation
│   ├── runs/           # Agent run status and detail views
│   └── shared/         # Logo, common utilities
├── store/              # Zustand stores (useAuthStore, useChatStore, useAgentStore, useRunStore, useThemeStore)
├── api/                # API clients and mock layer
│   ├── client.ts       # Fetch wrapper with auth token injection
│   ├── endpoints.ts    # API route definitions
│   ├── types.ts        # TypeScript interfaces for API data
│   └── mock/           # MSW handlers and mock data
├── hooks/              # Custom hooks (usePolling, useRunStatus)
├── lib/                # Utilities (cn() helper, constants)
├── types/              # Shared TypeScript type definitions
└── knowledge-base/     # Domain knowledge docs (deals, insights, risk, engage)
```

## Conventions

### Components
- **Named exports** using function declarations: `export function AgentCard({ ... }: AgentCardProps) {}`
- Props defined as interfaces above the component: `interface AgentCardProps { ... }`
- PascalCase filenames matching the component name

### Styling
- Tailwind utility classes composed via `cn()` from `@/lib/utils`
- shadcn/ui primitives live in `components/ui/` — import from there
- CSS variables for theming (oklch color space) defined in `index.css`

### State Management
- Each domain gets its own Zustand store: `use<Domain>Store` (e.g., `useAuthStore`, `useChatStore`)
- Stores live in `src/store/`

### Path Alias
- `@` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`)

### Environment Variables
- Must use `VITE_` prefix (Vite convention) to be exposed to the browser
- `.env.development` contains API keys — **never commit this file**

## Commands

All commands run from the `client/` directory:

```bash
pnpm dev          # Start Vite dev server (http://localhost:5173)
pnpm build        # Type-check (tsc -b) then production build
pnpm lint         # Run ESLint
pnpm preview      # Preview the production build locally
```

### Adding shadcn/ui components
```bash
pnpm dlx shadcn@latest add <component-name>
```

## Important Notes

- **No backend in this repo yet.** All API interactions are mocked via MSW at `src/api/mock/`. The MSW worker starts before the app mounts (see `src/main.tsx`).
- **AI is an external service.** The frontend does NOT call LLM providers directly. Chat and agent features call backend API endpoints (`/api/v1/platform/chat/*`, `/api/v1/platform/agents/*`) which proxy to an external AI service. No LLM API keys in the frontend. Legacy files (`anthropic.ts`, `azure-openai.ts`, `openrouter.ts`, `tavily.ts`) in `src/api/` are from early prototyping and will be removed.
- **No test framework installed yet.** When adding tests, use Vitest + React Testing Library.
- **No CI/CD pipeline** exists yet.
- **No Docker** — this is a pure frontend project.
