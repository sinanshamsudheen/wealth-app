# 09 — Routing & Navigation

## Frontend URL Structure

### Route Hierarchy

```
/login                              # Guest-only login page
/home                               # Authenticated root (module hub)
/home/                              # ModulesHomePage (module selector)
/home/engage/*                      # Engage module routes
/home/plan/*                        # Plan module routes
/home/tools/*                       # Tools & Communication routes
/home/deals/*                       # Deals module routes
/home/insights/*                    # Insights module routes
/home/admin/*                       # Administration module routes
/home/chat                          # Global AI chat (platform-level)
/home/agents/*                      # Agent management (platform-level)
/home/runs/*                        # Agent run history (platform-level)
```

### Per-Module Route Examples

```
# Engage
/home/engage/                       # Engage dashboard
/home/engage/clients                # Client list
/home/engage/clients/:id            # Client detail
/home/engage/prospects              # Prospect list
/home/engage/prospects/:id          # Prospect detail
/home/engage/pipelines              # Pipeline management

# Plan
/home/plan/                         # Plan dashboard
/home/plan/clients/:id              # Client's plans overview
/home/plan/plans/:id                # Plan detail / builder
/home/plan/risk-profiles/:id        # Risk profile questionnaire
/home/plan/ips/:id                  # IPS document editor

# Deals
/home/deals/                        # Deal pipeline board
/home/deals/:id                     # Deal detail
/home/deals/:id/evaluation          # Deal evaluation form
/home/deals/:id/allocations         # Allocation management

# Tools
/home/tools/                        # Tools dashboard
/home/tools/tasks                   # Task list
/home/tools/meetings                # Meeting calendar
/home/tools/communications          # Communication inbox

# Insights
/home/insights/                     # Insights dashboard
/home/insights/reports              # Report list
/home/insights/reports/:id          # Report viewer
/home/insights/alerts               # Alert management
/home/insights/data-sources         # Data source configuration

# Administration (Tenant-Level)
/home/admin/                        # Admin dashboard
/home/admin/users                   # User management
/home/admin/roles                   # Role management
/home/admin/org-settings            # Organization settings
/home/admin/audit-log               # Audit log viewer
```

### Super Admin Panel (Separate App at `admin.invictus.ai`)

The Super Admin Panel is a **completely separate SPA** with its own URL, auth, and routing. It is never accessible from the tenant app.

```
# Super Admin routes (admin.invictus.ai)
/login                              # Super Admin login
/                                   # Platform metrics dashboard
/organizations                      # List all organizations
/organizations/:id                  # Org detail (users, modules, subscription)
/users                              # Cross-tenant user search
/subscriptions                      # Billing & subscription management
/feature-flags                      # Feature flag management
/audit-logs                         # Cross-tenant audit log search
/system-health                      # Server status, DB, queues, errors
/announcements                      # Platform announcements management
```

### Super Admin Backend Routes

```
/api/v1/superadmin/auth/*           # Separate auth (platform_admins table)
/api/v1/superadmin/organizations/*  # Org CRUD, provisioning, suspension
/api/v1/superadmin/subscriptions/*  # Billing and licensing
/api/v1/superadmin/feature-flags/*  # Feature flag management
/api/v1/superadmin/metrics/*        # Platform and per-org metrics
/api/v1/superadmin/audit-logs       # Cross-tenant audit search
/api/v1/superadmin/system/*         # System health, status
/api/v1/superadmin/announcements/*  # Announcements CRUD
```

**Key:** Super Admin routes require a `type=platform_admin` JWT. Tenant JWTs are rejected on all `/superadmin/*` routes, and vice versa.

## Route Guard Layering

Guards are nested, checked in order:

```
1. GuestGuard (login page only)
   └── Redirects to /home if already authenticated

2. AuthGuard (all /home/* routes)
   └── Redirects to /login if not authenticated

3. ModuleGuard (per-module routes)
   └── Checks: is module licensed? Does user have module:*:access permission?
   └── Shows "Module Not Available" or "Access Denied" if checks fail

4. FeatureGuard (optional, within modules)
   └── Checks specific permissions for destructive or sensitive actions
   └── Hides or disables UI elements
```

### Implementation

```typescript
// AuthGuard — exists today
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ModuleGuard — new
function ModuleGuard({ module, children }: { module: string; children: React.ReactNode }) {
  const { user } = useAuthStore()
  const hasAccess = user?.moduleAccess?.includes(module)
  const hasPermission = user?.permissions?.includes(`module:${module}:access`)

  if (!hasAccess) return <ModuleNotAvailable module={module} />
  if (!hasPermission) return <AccessDenied />
  return <>{children}</>
}
```

## Backend Route Structure

```
/api/v1/auth/*                      # Auth endpoints (no token required)
/api/v1/admin/*                     # Administration API
/api/v1/engage/*                    # Engage API
/api/v1/plan/*                      # Plan API
/api/v1/tools/*                     # Tools API
/api/v1/deals/*                     # Deals API
/api/v1/insights/*                  # Insights API
/api/v1/platform/*                  # Platform-level APIs (chat, agents, notifications)
/api/v1/superadmin/*                # Super Admin APIs (separate auth, platform_admin JWT only)
/api/health                         # Health check (no auth)
/api/ready                          # Readiness check (no auth)
```

## Sidebar Navigation

The sidebar is **module-aware** — it changes navigation items based on the active module.

### Behavior

1. **Module Hub** (`/home/`) — sidebar shows global navigation (module list, chat, agents)
2. **Inside a Module** (`/home/engage/*`) — sidebar shows module-specific navigation items
3. **Module Switcher** — dialog to jump between modules (reads from module registry, filtered by access)

### Sidebar Structure

```typescript
interface SidebarNavItem {
  label: string
  path: string
  icon: LucideIcon
  permission?: string  // optional permission check
}

// Each module defines its sidebar items
const ENGAGE_NAV: SidebarNavItem[] = [
  { label: 'Dashboard', path: '/home/engage', icon: LayoutDashboard },
  { label: 'Clients', path: '/home/engage/clients', icon: Users },
  { label: 'Prospects', path: '/home/engage/prospects', icon: UserPlus },
  { label: 'Pipelines', path: '/home/engage/pipelines', icon: Kanban },
]
```

### Active Module Detection

The active module is derived from the current URL path:

```typescript
function useActiveModule(): ModuleDefinition | null {
  const { pathname } = useLocation()
  const match = pathname.match(/^\/home\/([^/]+)/)
  if (!match) return null
  return MODULE_REGISTRY.find(m => m.slug === match[1]) ?? null
}
```

## Migration from Current Routes

Current flat routes need to be migrated into the module structure:

| Current Route | Target Route | Module |
|--------------|-------------|--------|
| `/home/dashboard` | `/home/insights/` | Insights |
| `/home/meetings/:id` | `/home/tools/meetings/:id` | Tools |
| `/home/agents` | `/home/agents` | Platform (unchanged) |
| `/home/agents/:workflow` | `/home/agents/:workflow` | Platform (unchanged) |
| `/home/runs` | `/home/runs` | Platform (unchanged) |
| `/home/chat` | `/home/chat` | Platform (unchanged) |

Redirects should be added for backward compatibility during the transition:

```typescript
<Route path="dashboard" element={<Navigate to="/home/insights" replace />} />
<Route path="meetings/:id" element={<Navigate to="/home/tools/meetings/:id" replace />} />
```
