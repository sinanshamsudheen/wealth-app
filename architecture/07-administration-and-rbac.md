# 07 — Administration & RBAC

## Overview

There are **two distinct admin layers** in Invictus AI:

1. **Super Admin Panel** — Platform-level administration used by the Invictus team. Manages organizations, licensing, platform metrics, feature flags. Hosted at a **separate URL** (`admin.invictus.ai`), completely isolated from tenant users.
2. **Tenant Administration Module** — Per-organization administration used by org admins (customers). Manages users, roles, permissions, and org settings within their own tenant.

These two layers have **separate auth systems**, separate databases tables, and separate frontend applications.

## Super Admin Panel (Platform-Level)

### Purpose
The Super Admin Panel is the Invictus team's internal tool for managing the entire platform. No tenant user can ever access it.

### Capabilities

| Capability | Description |
|-----------|-------------|
| **Organization CRUD** | Create new organizations, suspend/reactivate, delete |
| **Subscription Management** | Assign plans (starter/professional/enterprise), manage billing cycles, trials |
| **Module Licensing** | Enable/disable specific modules per organization |
| **Cross-Tenant User Oversight** | Search users across all tenants, impersonate for support, force resets |
| **Platform Metrics Dashboard** | Total orgs, total users, aggregate AUM, API call volume, AI token usage |
| **System Health** | Server status, database connection pools, Redis queue depths, error rates |
| **Feature Flags** | Toggle features globally or per-organization |
| **Cross-Tenant Audit Logs** | Search audit logs across all tenants for compliance/investigations |
| **Billing & Usage Tracking** | Per-org usage metrics for billing purposes |
| **Platform Announcements** | Push maintenance notices or announcements to all or specific orgs |

### Super Admin Auth

Super Admin uses a **completely separate auth system** from tenant auth:

```
1. Super Admin logs in at admin.invictus.ai/login
   POST /api/v1/superadmin/auth/login { email, password }

2. Server validates against superadmin.platform_admins table (NOT admin.users)

3. JWT issued with different claims:
   {
     "sub": "platform-admin-uuid",
     "type": "platform_admin",       ← distinguishes from tenant JWTs
     "role": "super_admin",
     "iat": ..., "exp": ...
   }

4. All /api/v1/superadmin/* routes require type=platform_admin JWT
```

**Key isolation rules:**
- Super Admin JWTs **cannot** access `/api/v1/engage/*`, `/api/v1/deals/*`, etc.
- Tenant JWTs **cannot** access `/api/v1/superadmin/*`
- The Super Admin frontend is a separate SPA at a different URL
- Super Admin credentials are stored in `superadmin.platform_admins`, not `admin.users`
- Impersonation generates a time-limited tenant JWT with an `impersonated_by` claim for audit trailing

### Super Admin Roles

| Role | Access |
|------|--------|
| **super_admin** | Full platform access — can do everything |
| **support** | Read-only org/user data, impersonation for debugging, no billing/licensing changes |
| **billing** | Subscription management, usage reports, no user data access |

### Super Admin API Routes

```
POST   /api/v1/superadmin/auth/login              # Super Admin login
POST   /api/v1/superadmin/auth/logout

GET    /api/v1/superadmin/organizations            # List all orgs with metrics
POST   /api/v1/superadmin/organizations            # Create new org + provision modules
GET    /api/v1/superadmin/organizations/:id         # Org detail
PUT    /api/v1/superadmin/organizations/:id         # Update org settings
POST   /api/v1/superadmin/organizations/:id/suspend
POST   /api/v1/superadmin/organizations/:id/reactivate

GET    /api/v1/superadmin/organizations/:id/users   # Users in an org
POST   /api/v1/superadmin/organizations/:id/impersonate  # Get tenant JWT for support

GET    /api/v1/superadmin/subscriptions             # All subscriptions
PUT    /api/v1/superadmin/subscriptions/:id          # Update subscription

GET    /api/v1/superadmin/feature-flags             # List feature flags
PUT    /api/v1/superadmin/feature-flags/:key         # Toggle flag

GET    /api/v1/superadmin/metrics/dashboard         # Platform metrics
GET    /api/v1/superadmin/metrics/usage/:orgId       # Per-org usage

GET    /api/v1/superadmin/audit-logs                # Cross-tenant audit search
GET    /api/v1/superadmin/system/health              # System health dashboard

POST   /api/v1/superadmin/announcements             # Create announcement
GET    /api/v1/superadmin/announcements             # List announcements
DELETE /api/v1/superadmin/announcements/:id
```

---

## Tenant Administration Module (Per-Organization)

### Purpose
The Tenant Administration module is what **customers** use to manage their own organization. It is part of the main tenant app at `app.invictus.ai/home/admin/`.

### Core Capabilities

| Capability | Description |
|-----------|-------------|
| **Authentication** | Email/password login, JWT tokens, refresh token rotation, password reset |
| **Authorization (RBAC)** | Role-based access control with granular permissions per module and resource |
| **User Management** | Invite users, assign roles, suspend/activate accounts within the org |
| **Organization Settings** | Branding, preferences, integrations within the org's scope |
| **Audit Logging** | Track actions within the organization for compliance |
| **Customization** | Org-level settings, branding, preferences |

Note: Organization creation, module licensing, and subscription management are **NOT** available here — those are Super Admin functions.

## Tenant Authentication Flow

### Login Flow

```
1. User submits email + password
   POST /api/v1/auth/login { email, password }

2. Server validates credentials against admin.users
   - Hash comparison (bcrypt/argon2)
   - Check user status is 'active'

3. Server generates tokens:
   - Access token (JWT, 1 hour expiry)
   - Refresh token (opaque, 30 day expiry, stored in DB)

4. Response:
   { accessToken, refreshToken, user: { id, name, email, roles, permissions, moduleAccess } }

5. Client stores tokens:
   - Access token: in-memory (Zustand store)
   - Refresh token: httpOnly cookie or secure storage
```

### Token Refresh

```
1. Access token expires (detected by 401 response or preemptive check)

2. Client sends refresh token:
   POST /api/v1/auth/refresh { refreshToken }

3. Server validates refresh token:
   - Exists in DB
   - Not expired
   - Not revoked

4. Server issues new token pair (rotation):
   - New access token
   - New refresh token (old one invalidated)

5. Client updates stored tokens
```

### Logout

```
POST /api/v1/auth/logout { refreshToken }
→ Server revokes refresh token in DB
→ Client clears stored tokens and redirects to /login
```

## RBAC Model

### Entity Hierarchy

```
Organization
  └── Users
       └── Roles (many-to-many)
            └── Permissions (many-to-many)

Organization
  └── Module Access (which modules are licensed)
```

### Permission Format

```
module:<module-slug>:<resource>:<action>
```

Examples:
```
module:engage:access              # Can access the Engage module
module:engage:clients:read        # Can view clients
module:engage:clients:write       # Can create/edit clients
module:engage:clients:delete      # Can delete clients
module:deals:deals:write          # Can create/edit deals
module:deals:evaluations:write    # Can submit deal evaluations
module:admin:users:write          # Can manage users (admin only)
module:admin:roles:write          # Can manage roles (admin only)
module:insights:reports:run       # Can execute reports
module:plan:plans:write           # Can create financial plans
```

### Default Roles

| Role | Description | Typical Permissions |
|------|-------------|-------------------|
| **Owner** | Organization owner | All permissions for all licensed modules |
| **Admin** | Organization administrator | All permissions except billing/ownership |
| **Advisor** | Financial advisor / Wealth manager | Read/write on client-facing modules (Engage, Plan, Deals) |
| **Analyst** | Research / Analysis role | Read on most modules, write on Insights and Deals evaluations |
| **Viewer** | Read-only access | Read-only on licensed modules |

Organizations can also create **custom roles** with specific permission combinations.

### Permission Checking

#### Backend (Middleware)

```typescript
// Route-level permission check
app.get('/api/v1/engage/clients',
  requirePermission('module:engage:clients:read'),
  clientController.list
)

// Service-level check
function requirePermission(permission: string) {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      throw new ForbiddenError(`Missing permission: ${permission}`)
    }
    next()
  }
}
```

#### Frontend (Components & Hooks)

```typescript
// Hook
const canEditClients = usePermission('module:engage:clients:write')

// Component
<CanAccess permission="module:engage:clients:write">
  <Button onClick={handleEdit}>Edit Client</Button>
</CanAccess>

// Module-level guard
<ModuleGuard module="engage">
  <EngageRoutes />
</ModuleGuard>
```

### `ModuleGuard` Component

Wraps each module's route tree. Checks two things:
1. **Module licensed** — is the module in the user's `moduleAccess` array?
2. **Module permission** — does the user have `module:<slug>:access`?

If either check fails, renders a "Module Not Available" or "Access Denied" page.

## Multi-Tenancy

### Tenant Context

Every authenticated request carries tenant context from the JWT:

```typescript
interface RequestUser {
  id: string
  tenantId: string        // organization ID
  email: string
  roles: string[]
  permissions: string[]
  moduleAccess: string[]  // licensed module slugs
}
```

The `tenantMiddleware` extracts `tenantId` and sets it as the PostgreSQL session variable for RLS:

```typescript
async function tenantMiddleware(req, res, next) {
  const tenantId = req.user.tenantId
  await db.raw(`SET LOCAL app.current_tenant = '${tenantId}'`)
  next()
}
```

This ensures every database query is automatically scoped to the correct tenant.

### Tenant Isolation Guarantees

- **Database**: RLS policies prevent cross-tenant data access
- **API**: Tenant context set per request, not cached
- **File storage**: Files namespaced by `tenant_id` prefix
- **Cache**: Redis keys prefixed with `tenant:<id>:`
- **Logs**: Every log entry includes `tenantId` for filtering

## Organization Onboarding

```
1. Admin creates organization:
   POST /api/v1/admin/organizations
   { name, slug, plan, modules: ['engage', 'deals'] }

2. System provisions:
   - Organization record
   - Module access records for selected modules
   - Default roles (Owner, Admin, Advisor, Viewer)
   - Owner user account (from signup data)

3. Owner invites team members:
   POST /api/v1/admin/users/invite
   { email, roleId }

4. Invited user sets password and activates account
```

## Audit Logging

All significant actions are logged to `admin.audit_logs`:

```typescript
await auditLog({
  tenantId: req.user.tenantId,
  userId: req.user.id,
  action: 'client.create',
  resourceType: 'engage.client',
  resourceId: newClient.id,
  metadata: {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    changes: { name: 'John Doe', email: 'john@example.com' }
  }
})
```

### Audited Actions

- User login/logout
- User CRUD (create, invite, suspend, delete)
- Role and permission changes
- Module access changes
- Client/prospect CRUD (Engage)
- Deal CRUD and stage changes (Deals)
- Report generation (Insights)
- Financial plan creation/modification (Plan)
- AI agent runs (Platform)
