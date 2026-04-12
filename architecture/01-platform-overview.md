# 01 — Platform Overview

## Vision

**Invictus AI** is an AI-native wealth management platform built for financial advisors, wealth managers, and investment firms. It combines traditional wealth management workflows with AI-powered automation, giving professionals a unified workspace to manage clients, build financial plans, source deals, generate insights, and communicate — all with intelligent assistance woven into every interaction.

The platform is built as a **modular suite**: each module can operate independently as a standalone product, or modules can be combined into a full-suite deployment where they share authentication, data, and cross-module integrations.

## Module Catalog

| Module | Slug | Purpose | Status |
|--------|------|---------|--------|
| **Invictus Engage** | `engage` | CRM for managing prospects, clients, relationships, and engagement pipelines | Planned |
| **Invictus Plan** | `plan` | Risk profiling, financial planning, IPS/IPQ creation, goal-based planning | Planned |
| **Invictus Tools & Communication** | `tools` | Task management, meeting scheduling, client communication, notifications | Planned |
| **Invictus Deals** | `deals` | Deal sourcing, evaluation, pipeline management, allocation tracking | Planned |
| **Invictus Insights** | `insights` | Data aggregation, portfolio monitoring, reporting, alerts | Planned |
| **Invictus Administration** | `admin` | Authentication, RBAC, org management, member management, security, customization | Core/Shared |

### Super Admin Panel (Platform-Level)

In addition to the 6 tenant-facing modules, there is a **Super Admin Panel** — a separate, internal-only application used by the Invictus team to manage the entire platform. It is hosted at a different URL and is **never accessible to tenant users**.

| Capability | Description |
|-----------|-------------|
| **Organization Management** | Create, suspend, delete organizations; manage subscriptions and billing |
| **Module Licensing** | Enable/disable modules per organization; manage license terms |
| **User Oversight** | View all users across tenants; impersonate for support; force password resets |
| **Platform Metrics** | Dashboard showing total orgs, users, AUM, API usage, AI token consumption |
| **System Health** | Server status, database metrics, queue depths, error rates |
| **Feature Flags** | Toggle features globally or per-organization |
| **Audit & Compliance** | Cross-tenant audit log search; data export for compliance |
| **Billing & Usage** | Track usage per org for billing; manage subscription tiers |
| **Announcements** | Push platform-wide announcements or maintenance notices to tenant users |

The Super Admin Panel has its own frontend SPA, its own auth (platform-level credentials, not tenant credentials), and its own set of backend API routes (`/api/v1/superadmin/*`). See [07-administration-and-rbac.md](07-administration-and-rbac.md) for the auth model distinction.

### Module Relationships

```
┌──────────────────────────────────────────────────────────────┐
│              Invictus Super Admin Panel                       │
│  (Platform-level: org provisioning, licensing, metrics)      │
│  Hosted at: admin.invictus.ai (separate from tenant app)     │
└──────────────────────────┬───────────────────────────────────┘
                           │ manages organizations & licensing
                    ┌──────▼──────────────────┐
                    │   Invictus Administration │
                    │  (Auth, RBAC, Org Mgmt)   │
                    └────────────┬─────────────┘
                                 │ provides auth & permissions to all
         ┌───────────┬───────────┼───────────┬───────────┐
         │           │           │           │           │
    ┌────▼───┐  ┌────▼───┐  ┌───▼────┐  ┌───▼────┐  ┌──▼─────┐
    │ Engage │  │  Plan  │  │ Tools  │  │ Deals  │  │Insights│
    └────┬───┘  └────┬───┘  └───┬────┘  └───┬────┘  └──┬─────┘
         │           │          │            │          │
         └───────────┴──────────┴──────┬─────┴──────────┘
                                       │
                              Cross-module integration
                              (events, shared entities,
                               navigation links)
```

- **Administration** is the foundational module — all other modules depend on it for auth and permissions.
- **All modules are interconnected** — every module both consumes and produces data for other modules. There is no single "richest" integration; the platform is designed as a cohesive mesh where Engage, Plan, Tools, Deals, and Insights all exchange data bidirectionally.
- Each non-admin module can be deployed and sold independently.

## Standalone vs. Suite Mode

| Aspect | Standalone | Suite |
|--------|-----------|-------|
| **Deployment** | Single module + Administration | All modules + Administration |
| **Frontend** | Same SPA, module visibility restricted by license | Full SPA with all modules accessible |
| **Backend** | Only relevant module APIs deployed | All module APIs available |
| **Database** | Module-specific schemas + admin schema | All schemas in shared database |
| **Auth** | Administration always included | Shared auth across all modules |
| **Cross-module features** | Disabled or degraded gracefully | Full integration |

## Tech Stack Overview

### Frontend (Current — `client/`)
- **React 19** + **TypeScript 5.9** — UI framework
- **Vite 8** — build tool and dev server
- **pnpm 10.15** — package manager
- **Zustand 5** — state management
- **shadcn/ui** (base-nova style) + **Tailwind CSS 4.2** — styling
- **React Router 7** — client-side routing
- **MSW 2** — Mock Service Worker for API mocking
- **Recharts** — data visualization
- **Lucide React** — icons

### Backend (Target)
- **Python 3.12+** — runtime
- **FastAPI** — async HTTP framework
- **SQLAlchemy 2.0** + **Alembic** — ORM and database migrations
- **Pydantic v2** — data validation and serialization
- **Celery** + **Redis** — background task processing
- **WebSocket** (FastAPI native) — real-time communication
- **uvicorn** — ASGI server

### Database (Target)
- **PostgreSQL** — primary relational database
- **Redis** — caching, sessions, pub/sub, job queues

### Infrastructure (Target)
- **Vercel** — frontend hosting
- **Docker** — backend containerization
- **Cloud provider** (AWS/GCP/Azure) — backend hosting, managed database

### AI Layer (External Service)
- AI capabilities are provided by an **external AI service** — separate from this repo
- The frontend and core backend do **not** call LLM providers directly
- The backend proxies AI requests and stores results
- See [12-ai-integration.md](12-ai-integration.md) for the full architecture

## Company

**Asbi Tech Ltd.** — the company behind Invictus AI.
