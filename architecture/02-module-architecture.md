# 02 — Module Architecture

## What Is a Module?

A module is a **self-contained vertical slice** of the platform that owns its own UI, API endpoints, business logic, database schema, and state. Each module is independently developable, testable, and deployable.

### Module Boundary Rules

1. A module **MUST NOT** import directly from another module's internal code (neither frontend nor backend).
2. Cross-module communication happens through **defined integration patterns** (see [08-cross-module-integration.md](08-cross-module-integration.md)).
3. Each module exports a **public API** via barrel files (`index.ts`) — only what's exported is available to other modules.
4. All modules depend on **Administration** for auth/RBAC (one-directional dependency).
5. Shared utilities, types, and UI components live in dedicated **shared** directories, accessible to all modules.

## Module Registry

A single source of truth defines all modules — their metadata, entry points, permissions, and status. This replaces the current duplicated `MODULES` arrays in `ModulesHomePage.tsx` and `ModuleSwitcher.tsx`.

```typescript
// client/src/modules/registry.ts
export interface ModuleDefinition {
  id: string
  name: string
  slug: string
  description: string
  icon: LucideIcon
  color: ModuleColor
  basePath: string
  requiredPermissions: string[]
  lazyRoot: () => Promise<{ default: React.ComponentType }>
  status: 'active' | 'planned' | 'beta'
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    id: 'engage',
    name: 'Invictus Engage',
    slug: 'engage',
    description: 'Manage your Prospects and Clients',
    icon: Handshake,
    basePath: '/home/engage',
    requiredPermissions: ['module:engage:access'],
    lazyRoot: () => import('./engage/routes'),
    status: 'planned',
    // ...color config
  },
  // ... other modules
]
```

The registry is consumed by:
- **Router** (`App.tsx`) — mounts module routes dynamically
- **ModulesHomePage** — renders module cards
- **ModuleSwitcher** — renders module navigation dialog
- **Sidebar** — renders module-specific navigation
- **ModuleGuard** — checks permissions for module access

## Target Directory Structure

### Frontend (`client/src/`)

```
client/src/
├── modules/                    # Feature modules
│   ├── registry.ts             # Module registry (single source of truth)
│   ├── engage/
│   │   ├── pages/              # EngageDashboard, ClientDetail, ProspectList, etc.
│   │   ├── components/         # CRM-specific components
│   │   ├── store/              # useEngageStore.ts
│   │   ├── api/                # Engage API endpoints + MSW handlers
│   │   ├── types/              # Engage-specific TypeScript types
│   │   ├── routes.tsx           # Lazy-loaded route definitions
│   │   └── index.ts            # Public barrel export
│   ├── plan/
│   │   ├── pages/              # PlanDashboard, RiskProfile, IPSBuilder, etc.
│   │   ├── components/
│   │   ├── store/
│   │   ├── api/
│   │   ├── types/
│   │   ├── routes.tsx
│   │   └── index.ts
│   ├── tools/
│   │   ├── pages/              # TaskList, MeetingScheduler, Inbox, etc.
│   │   ├── components/
│   │   ├── store/
│   │   ├── api/
│   │   ├── types/
│   │   ├── routes.tsx
│   │   └── index.ts
│   ├── deals/
│   │   ├── pages/              # DealPipeline, DealDetail, Evaluation, etc.
│   │   ├── components/
│   │   ├── store/
│   │   ├── api/
│   │   ├── types/
│   │   ├── routes.tsx
│   │   └── index.ts
│   ├── insights/
│   │   ├── pages/              # InsightsDashboard, Reports, Alerts, etc.
│   │   ├── components/         # (migrate existing insights/ components)
│   │   ├── store/
│   │   ├── api/
│   │   ├── types/
│   │   ├── routes.tsx
│   │   └── index.ts
│   └── admin/
│       ├── pages/              # OrgSettings, UserManagement, RoleEditor, etc.
│       ├── components/
│       ├── store/
│       ├── api/
│       ├── types/
│       ├── routes.tsx
│       └── index.ts
├── platform/                   # Cross-cutting platform features
│   ├── chat/                   # AI chat (components, store, api)
│   ├── agents/                 # Agent runtime (components, store, api)
│   └── notifications/          # Notification system
├── shared/                     # Shared code (available to all modules)
│   ├── components/             # ErrorBoundary, EmptyState, LoadingScreen
│   ├── ui/                     # shadcn/ui primitives
│   ├── hooks/                  # usePolling, usePermission, useModuleContext
│   ├── lib/                    # cn(), constants
│   ├── types/                  # Cross-module shared types
│   └── api/                    # Shared API client (client.ts)
├── store/                      # Global stores (auth, theme)
├── App.tsx                     # Router with dynamic module mounting
├── main.tsx                    # Entry point
└── index.css                   # Theme variables
```

### Super Admin Frontend (`superadmin/`)

A separate SPA for platform-level administration, hosted at a different URL (`admin.invictus.ai`). Never accessible to tenant users.

```
superadmin/src/
├── pages/
│   ├── LoginPage.tsx           # Super Admin login (separate auth)
│   ├── DashboardPage.tsx       # Platform metrics overview
│   ├── OrganizationsPage.tsx   # List/create/manage organizations
│   ├── OrgDetailPage.tsx       # Single org detail, licensing, users
│   ├── UsersPage.tsx           # Cross-tenant user search
│   ├── SystemHealthPage.tsx    # Server status, DB metrics, queues
│   ├── FeatureFlagsPage.tsx    # Toggle features globally or per-org
│   ├── AuditLogPage.tsx        # Cross-tenant audit log search
│   ├── BillingPage.tsx         # Usage tracking, subscription management
│   └── AnnouncementsPage.tsx   # Platform-wide announcements
├── components/                 # Super Admin specific components
├── store/                      # useSuperAdminAuthStore, etc.
├── api/                        # API client pointing to /api/v1/superadmin/*
├── App.tsx
├── main.tsx
└── index.css
```

### Backend (`server/`)

```
server/
├── app/                        # Main application package
│   ├── modules/                # Feature modules (mirrors frontend)
│   │   ├── engage/
│   │   │   ├── router.py       # FastAPI router (endpoint definitions)
│   │   │   ├── service.py      # Business logic
│   │   │   ├── repository.py   # Database queries (SQLAlchemy)
│   │   │   ├── models.py       # SQLAlchemy ORM models
│   │   │   ├── schemas.py      # Pydantic request/response schemas
│   │   │   ├── events.py       # Module-specific event definitions
│   │   │   └── __init__.py
│   │   ├── plan/
│   │   │   └── ... (same structure)
│   │   ├── tools/
│   │   │   └── ...
│   │   ├── deals/
│   │   │   └── ...
│   │   ├── insights/
│   │   │   └── ...
│   │   └── admin/
│   │       ├── router.py
│   │       ├── service.py
│   │       │   # auth, rbac, org, user logic
│   │       ├── repository.py
│   │       ├── models.py
│   │       ├── schemas.py
│   │       ├── middleware.py    # Auth middleware, tenant middleware
│   │       └── __init__.py
│   ├── superadmin/             # Super Admin API (platform-level)
│   │   ├── router.py           # /api/v1/superadmin/* endpoints
│   │   ├── service.py          # Org provisioning, licensing, metrics
│   │   ├── repository.py       # Platform-level DB queries
│   │   ├── models.py           # platform_admins, feature_flags, etc.
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── auth.py             # Separate JWT auth for super admins
│   │   └── __init__.py
│   ├── platform/               # Cross-cutting platform services
│   │   ├── ai/                 # LLM orchestration, agent runtime
│   │   ├── events/             # Event bus for cross-module communication
│   │   ├── notifications/      # Email, push, in-app notifications
│   │   └── websocket/          # WebSocket handlers
│   ├── shared/                 # Shared utilities
│   │   ├── middleware/          # Common middleware (logging, error handling, CORS)
│   │   ├── dependencies.py     # FastAPI dependency injection (auth, tenant, db session)
│   │   ├── exceptions.py       # Custom exception classes
│   │   ├── schemas.py          # Shared Pydantic schemas (pagination, API envelope)
│   │   └── utils.py            # Helper functions
│   ├── database/               # Database setup
│   │   ├── session.py          # SQLAlchemy async session factory
│   │   ├── base.py             # Base model class
│   │   └── migrations/         # Alembic migrations
│   ├── config.py               # Pydantic Settings (environment config)
│   └── main.py                 # FastAPI app setup, router registration
├── alembic.ini                 # Alembic configuration
├── pyproject.toml              # Python project config (dependencies, tooling)
├── requirements.txt            # Pinned dependencies
└── Dockerfile
```

### Database (Managed via Alembic in `server/`)

```
server/app/database/
├── session.py                  # SQLAlchemy async engine + session factory
├── base.py                     # Declarative base with common columns (id, tenant_id, timestamps)
└── migrations/                 # Alembic migration versions
    ├── env.py                  # Alembic environment config
    └── versions/               # Auto-generated migration files

# Models live inside each module:
server/app/modules/admin/models.py
server/app/modules/engage/models.py
server/app/modules/plan/models.py
server/app/modules/tools/models.py
server/app/modules/deals/models.py
server/app/modules/insights/models.py

# Seed scripts:
server/scripts/
├── seed_admin.py
├── seed_engage.py
└── ...
```

## Module Composition: Standalone vs. Suite

### Standalone Mode
When a customer purchases only one module (e.g., Deals):
- **Frontend**: Only `admin/` and `deals/` module folders are loaded; other modules are hidden from the UI
- **Backend**: Only `admin/` and `deals/` API routes are registered
- **Database**: Only `admin` and `deals` schemas are migrated
- Cross-module features gracefully degrade (e.g., "View in Engage" button hidden if Engage not licensed)

### Suite Mode
When all modules are active:
- All module routes, APIs, and schemas are active
- Cross-module integrations fully enabled
- Shared navigation allows seamless switching between modules

### License Enforcement
Module access is controlled via the `module_access` table in the Administration schema:

```
organization.id → module_access → [engage, deals, insights]
```

The frontend reads the user's module access from their auth token/profile and conditionally renders modules in the registry.
