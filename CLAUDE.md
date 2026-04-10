# Invictus AI Copilot — Frontend

Wealth management frontend SPA for the Invictus AI Copilot platform. This repo contains **only the frontend client** — no backend, no database, no server code.

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
│   ├── anthropic.ts    # Anthropic Claude API integration
│   ├── azure-openai.ts # Azure OpenAI integration
│   ├── openrouter.ts   # OpenRouter multi-model routing
│   ├── tavily.ts       # Tavily web search API
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

- **No backend in this repo.** All API interactions are mocked via MSW at `src/api/mock/`. The MSW worker starts before the app mounts (see `src/main.tsx`).
- **Multi-LLM routing:** The chat store routes to Anthropic (default), Azure OpenAI (`azure:` prefix), or OpenRouter (`openrouter:` prefix) based on model name.
- **No test framework installed yet.** When adding tests, use Vitest + React Testing Library.
- **No CI/CD pipeline** exists yet.
- **No Docker** — this is a pure frontend project.
