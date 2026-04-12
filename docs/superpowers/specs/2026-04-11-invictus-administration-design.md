# Invictus Administration Module — Design Spec

## Context

Invictus AI is a modular wealth management platform with 6 modules (Engage, Plan, Tools, Deals, Insights, Administration). Each module can be sold standalone or as part of a full suite. The Administration module is the shared backbone — it provides auth, RBAC, organization management, and user management for all other modules.

This spec defines the **Invictus Administration module** (tenant-facing) and the **My Account** area (every user). It also defines the **contextual sidebar navigation** pattern that all modules will follow.

**This is NOT the Super Admin Panel** (`admin.invictus.ai`), which is a separate internal app for the Invictus team to manage organizations, licensing, and billing. That is already documented in the architecture docs.

---

## 1. Navigation — Contextual Sidebar

### Problem

Each module has its own set of sub-pages (e.g., Deals has Pipeline, Opportunities, Allocations). The global sidebar (Home, Your Daily, Chat, Agents, modules list) competes with module-specific navigation. Two sidebars is confusing; one sidebar holding everything is cluttered.

### Solution: Contextual Sidebar

The sidebar **morphs based on context**. When the user is at the top level, it shows global navigation. When they enter a module, it transforms into that module's navigation with a "Back to Home" link.

#### Global View (no module selected)

```
┌──────────────────────┐
│ Invictus (logo)      │
├──────────────────────┤
│ 🏠 Home              │  ← Active
│ 📅 Your Daily        │
│ 💬 Chat              │
│ 🤖 Agents            │
├──────────────────────┤
│ MODULES              │
│ 💼 Deals             │
│ 👥 Engage            │
│ 📋 Plan              │
│ 📊 Insights          │
│ 🔧 Tools             │
├──────────────────────┤
│ ⚙️ Administration    │  ← Only visible to Org Admins
└──────────────────────┘
```

#### Module View (inside a module, e.g., Deals)

```
┌──────────────────────┐
│ ← Back to Home       │
├──────────────────────┤
│ 💼 DEALS             │  ← Module name + icon
│ Dashboard            │
│ Pipeline             │  ← Active
│ Opportunities        │
│ Allocations          │
│ Reports              │
│                      │
│                      │
├──────────────────────┤
│ 📅 Your Daily        │  ← Pinned global item
└──────────────────────┘
```

#### Administration View

```
┌──────────────────────┐
│ ← Back to Home       │
├──────────────────────┤
│ ⚙️ ADMINISTRATION    │
│ Company Profile      │  ← Active
│ Branding             │
│ Roles & Access       │
│ Preferences          │
│                      │
├──────────────────────┤
│ 📅 Your Daily        │  ← Pinned global item
└──────────────────────┘
```

### Rules

- **Back to Home**: Always visible at top when inside any module. Returns to global view.
- **Module name + icon**: Displayed as a section header (uppercase, module accent color).
- **Pinned items**: "Your Daily" is always pinned at the bottom of the sidebar, regardless of context.
- **Module switcher**: The existing top bar module switcher remains available for quick module-to-module jumps without going back to Home first.
- **Administration visibility**: The "Administration" item in the global sidebar is only visible to users who have a role in the Administration module (Owner or Manager).
- **Collapsed sidebar**: In collapsed mode (icon-only, 64px), show module icon at top and sub-page icons below. Back arrow collapses to a left-arrow icon.

---

## 2. RBAC Model — 3 System-Defined Roles per Module

### Roles

Every module (including Administration) uses the same 3 system-defined roles:

| Role | Description | Capabilities |
|------|-------------|-------------|
| **Owner** | Full control | Read, write, delete, configure module settings, export, share, manage users within module, view all records |
| **Manager** | Manage work & team | Read, write, assign work, approve/review, view team records, export (no critical deletes, no module configuration) |
| **Analyst** | Execute & view | Read, create own records, edit own work, submit for review, view assigned records, limited exports |

### Assignment Model

- Each user is assigned a role **per module** independently
- No access = user doesn't see that module at all
- Roles are **system-defined** — org admins cannot create custom roles (v1)
- No groups — individual user-to-module-role assignment (v1)

### Role Matrix Example

| User | Admin | Deals | Engage | Plan | Insights | Tools |
|------|-------|-------|--------|------|----------|-------|
| Usman A. (Org Admin) | Owner | Owner | Owner | Owner | Owner | Owner |
| Pine L. | — | Manager | Manager | — | Manager | — |
| John S. | — | Analyst | Analyst | — | Analyst | — |

### Administration Module Access = Org Admin

- Administration is treated as a module in the RBAC matrix, just like Deals or Engage
- Users with `Administration: Owner` have full admin capabilities (company settings, branding, user management, preferences)
- Users with `Administration: Manager` can view company settings (read-only), manage users (invite, edit roles, suspend), but cannot edit company profile, branding, or preferences
- Users with `Administration: Analyst` can view the user list and company info (read-only) but cannot make changes — useful for transparency without control
- Users with no Administration role cannot see or access the Administration sidebar item
- The first user is assigned `Administration: Owner` automatically when the organization is created via the Super Admin Panel

### Permission Format

Permissions follow the pattern: `module:<module-slug>:<resource>:<action>`

For the simplified 3-role model, permissions are bundled into roles rather than individually assigned:

```
# Owner permissions (all of the below)
module:deals:*:*

# Manager permissions
module:deals:pipeline:read
module:deals:pipeline:write
module:deals:opportunities:read
module:deals:opportunities:write
module:deals:allocations:read
module:deals:allocations:write
module:deals:reports:read
module:deals:reports:export

# Analyst permissions
module:deals:pipeline:read
module:deals:opportunities:read
module:deals:opportunities:write_own
module:deals:allocations:read
module:deals:reports:read
```

---

## 3. Administration Module — Pages

### 3.1 Company Profile

**Route:** `/home/admin/company`

**Fields (all editable by Admin Owner):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Company Name | Text (255) | Yes | Organization display name |
| Company Number | Text (50) | No | Registration or internal ID |
| Website URL | URL | No | Company website |
| Default Currency | Select | Yes | ISO 4217 currency code (USD, AED, GBP, EUR, etc.) |
| Timezone | Select | Yes | IANA timezone (e.g., Asia/Dubai) |
| Company Address | Composite | No | Address line, city, state, country, ZIP code |
| Active Status | Toggle | Yes | Active / Inactive (set by Super Admin, read-only for org admin) |
| Customer Support Email | Email | No | Org-specific support contact |

**Behavior:**
- Form with inline editing (click field to edit, save button per section)
- Active status is **read-only** for org admins (only Super Admin Panel can deactivate an org)
- Changes saved via `PUT /api/v1/admin/organization`

### 3.2 Branding

**Route:** `/home/admin/branding`

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Small Logo | Image upload | Max 512KB, PNG/SVG, displayed at 48x48px (favicon, collapsed sidebar) |
| Large Logo | Image upload | Max 2MB, PNG/SVG, displayed at ~200x48px (expanded sidebar, login) |
| App Header Logo | Radio (Small / Large) | Which logo to use in the app header/sidebar |
| Brand Color | Color picker | Hex value, applied as accent color across the tenant's app |
| Email Footer Message | Textarea | Appended to all outgoing emails from the platform |

**Behavior:**
- Logo upload with preview and crop
- Brand color shows a live preview swatch
- Email footer supports plain text (no HTML in v1)
- Changes saved via `PUT /api/v1/admin/branding`
- Brand color and logos are loaded at app startup and applied to CSS variables

### 3.3 Roles & Access (User Management)

**Route:** `/home/admin/users`

**User List View:**
- Table with columns: User (name + email), Status (Active/Invited/Suspended), and one column per licensed module showing role badge (Owner/Manager/Analyst) or "—"
- Member count header (e.g., "8 members")
- "Invite User" button (primary action)
- Click a user row to open user detail/edit panel
- Search/filter by name or email
- Only shows modules the org has licensed (from Super Admin provisioning)

**User Detail Panel (slide-over or page):**
- View/edit user info: name, email, status
- Module role assignment: dropdown per module (Owner / Manager / Analyst / No access)
- Suspend / reactivate user
- Remove user from organization

**Invite User Flow (3 steps):**

1. **Enter Details**: Email address (required), First Name (required), Last Name (required)
2. **Assign Module Roles**: For each licensed module, select role from dropdown (Owner / Manager / Analyst / No access). Default: No access for all modules.
3. **Send Invitation**: Confirmation screen, sends email with setup link. User status = "Invited" until they complete setup.

**Invited User Setup:**
- User receives email with unique setup link (time-limited, e.g., 72 hours)
- Setup flow: set password → complete profile (title, phone, etc.) → enable 2FA (optional) → done
- Status changes from "Invited" to "Active" on completion

### 3.4 Preferences

**Route:** `/home/admin/preferences`

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Default Currency | Select | Same as Company Profile (linked) — single source of truth |
| Date Format | Select | DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD |
| Number Format | Select | 1,000.00 vs 1.000,00 |

**Note:** This page is lightweight in v1. It may expand to include notification settings, integration preferences, etc.

---

## 4. My Account (Every User)

### Location

Accessed via **avatar dropdown** in the top navigation bar → "My Account" link. This is NOT inside the Administration module — every user can access it regardless of their role.

**Route:** `/home/account`

### 4.1 Personal Profile

**Route:** `/home/account/profile`

**Fields (all editable by the user):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Profile Picture | Image upload | No | Avatar, displayed at various sizes (24px–64px) |
| First Name | Text | Yes | |
| Last Name | Text | Yes | |
| Email (Username) | Email | Yes | Also serves as username. Changing requires re-verification. |
| Title | Text | No | Job title (e.g., "Senior Analyst") |
| Phone Number | Phone | No | With country code |
| Manager's Name | Text | No | Reporting manager (free text in v1, user picker in v2) |
| Address Line | Text | No | Street address |
| City | Text | No | |
| State / Region | Text | No | |
| Country | Select | No | Country dropdown |
| ZIP / Postal Code | Text | No | |

### 4.2 Security Settings

**Route:** `/home/account/security`

| Setting | Action | Notes |
|---------|--------|-------|
| Username (Email) | Change | Requires current password + verification email to new address |
| Password | Change | Current password + new password + confirm |
| Two-Factor Authentication | Enable/Disable | TOTP via authenticator app (Google Authenticator, Authy, etc.). Setup shows QR code + recovery codes |

### 4.3 Appearance

**Route:** `/home/account/appearance`

| Setting | Action | Notes |
|---------|--------|-------|
| Theme | Toggle | Light / Dark mode. Persisted to localStorage and user profile. |

---

## 5. Data Model

### Database Tables (admin schema)

```sql
-- Organizations (managed by Super Admin, read-mostly for org admins)
admin.organizations (
  id              UUID PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100) UNIQUE NOT NULL,
  plan            VARCHAR(50) DEFAULT 'starter',  -- starter, professional, enterprise
  settings        JSONB DEFAULT '{}',             -- currency, timezone, date_format, number_format
  branding        JSONB DEFAULT '{}',             -- small_logo_url, large_logo_url, header_logo, brand_color, email_footer
  support_email   VARCHAR(255),
  is_active       BOOLEAN DEFAULT true,           -- controlled by Super Admin
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
)

-- Users
admin.users (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES admin.organizations(id),
  email           VARCHAR(255) NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  avatar_url      VARCHAR(500),
  title           VARCHAR(100),
  phone           VARCHAR(50),
  manager_name    VARCHAR(255),
  address         JSONB DEFAULT '{}',             -- { line, city, state, country, zip }
  status          VARCHAR(20) DEFAULT 'invited',  -- invited, active, suspended
  totp_secret     VARCHAR(255),                   -- encrypted TOTP secret (null = 2FA disabled)
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, email)
)

-- Module roles (per user, per module)
admin.user_module_roles (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES admin.organizations(id),
  user_id         UUID REFERENCES admin.users(id) ON DELETE CASCADE,
  module_slug     VARCHAR(50) NOT NULL,           -- 'admin', 'deals', 'engage', 'plan', 'insights', 'tools'
  role            VARCHAR(20) NOT NULL,           -- 'owner', 'manager', 'analyst'
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id, module_slug)
)

-- Module access (which modules the org has licensed — managed by Super Admin)
admin.module_access (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES admin.organizations(id),
  module_slug     VARCHAR(50) NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  licensed_until  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, module_slug)
)

-- Invitations (pending user invites)
admin.invitations (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES admin.organizations(id),
  email           VARCHAR(255) NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  invited_by      UUID REFERENCES admin.users(id),
  module_roles    JSONB NOT NULL,                 -- [{ module_slug, role }]
  token           VARCHAR(255) UNIQUE NOT NULL,   -- unique invite token
  expires_at      TIMESTAMPTZ NOT NULL,           -- 72 hours from creation
  accepted_at     TIMESTAMPTZ,                    -- null until accepted
  created_at      TIMESTAMPTZ DEFAULT now()
)

-- Refresh tokens
admin.refresh_tokens (
  id              UUID PRIMARY KEY,
  user_id         UUID REFERENCES admin.users(id) ON DELETE CASCADE,
  token_hash      VARCHAR(255) NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
)
```

### Key Indexes

```sql
CREATE INDEX idx_users_tenant ON admin.users(tenant_id);
CREATE INDEX idx_users_email ON admin.users(email);
CREATE INDEX idx_user_module_roles_user ON admin.user_module_roles(user_id);
CREATE INDEX idx_user_module_roles_tenant_module ON admin.user_module_roles(tenant_id, module_slug);
CREATE INDEX idx_invitations_token ON admin.invitations(token);
CREATE INDEX idx_invitations_tenant ON admin.invitations(tenant_id);
CREATE INDEX idx_refresh_tokens_user ON admin.refresh_tokens(user_id);
```

### RLS Policies

All tenant-scoped tables have RLS enabled with policies that enforce `tenant_id = current_setting('app.current_tenant')::uuid`. This is set per-request by the backend middleware.

---

## 6. API Endpoints

### Authentication

```
POST /api/v1/auth/login            — { email, password } → { accessToken, refreshToken, user }
POST /api/v1/auth/refresh           — { refreshToken } → { accessToken, refreshToken }
POST /api/v1/auth/logout            — { refreshToken } → 204
```

### Organization Settings (Admin Owner/Manager)

```
GET  /api/v1/admin/organization     — Get org profile + settings
PUT  /api/v1/admin/organization     — Update org profile (name, settings, support_email)
PUT  /api/v1/admin/branding         — Update branding (logos, color, email footer)
```

### User Management (Admin Owner/Manager)

```
GET    /api/v1/admin/users          — List all users in org (with module roles)
GET    /api/v1/admin/users/:id      — Get single user detail
PUT    /api/v1/admin/users/:id      — Update user (status, module roles)
DELETE /api/v1/admin/users/:id      — Remove user from org
POST   /api/v1/admin/invitations    — Send invite { email, firstName, lastName, moduleRoles }
GET    /api/v1/admin/invitations    — List pending invitations
DELETE /api/v1/admin/invitations/:id — Cancel invitation
```

### Invitation Acceptance (Public)

```
GET  /api/v1/auth/invite/:token     — Validate invite token → { email, orgName, firstName }
POST /api/v1/auth/invite/:token     — Accept invite { password } → creates user, returns tokens
```

### My Account (Any authenticated user)

```
GET  /api/v1/account/profile        — Get own profile
PUT  /api/v1/account/profile        — Update own profile (name, title, phone, address, avatar)
PUT  /api/v1/account/email          — Change email (requires current password)
PUT  /api/v1/account/password       — Change password (requires current password)
POST /api/v1/account/2fa/setup      — Generate TOTP secret + QR code
POST /api/v1/account/2fa/verify     — Verify TOTP code to enable 2FA
DELETE /api/v1/account/2fa          — Disable 2FA (requires current password)
```

---

## 7. Frontend Architecture

### File Structure

```
client/src/
├── modules/admin/                    # Administration module
│   ├── pages/
│   │   ├── AdminLayout.tsx           # Module layout with admin sidebar nav
│   │   ├── CompanyProfilePage.tsx    # Company profile form
│   │   ├── BrandingPage.tsx          # Logo upload, color picker, email footer
│   │   ├── UsersPage.tsx             # User list table with role badges
│   │   ├── UserDetailPage.tsx        # User detail/edit panel
│   │   └── PreferencesPage.tsx       # Currency, date/number format
│   ├── components/
│   │   ├── InviteUserDialog.tsx      # 3-step invite wizard
│   │   ├── ModuleRoleSelector.tsx    # Dropdown per module for role selection
│   │   ├── UserRoleBadge.tsx         # Owner/Manager/Analyst badge component
│   │   └── LogoUploader.tsx          # Image upload with preview/crop
│   ├── api/
│   │   └── adminApi.ts              # API client for admin endpoints
│   ├── store/
│   │   └── useAdminStore.ts         # Zustand store for admin state
│   └── types/
│       └── admin.types.ts           # TypeScript interfaces
├── pages/
│   ├── AccountPage.tsx               # My Account layout
│   ├── ProfilePage.tsx               # Personal profile form
│   ├── SecurityPage.tsx              # Password, 2FA, email change
│   └── AppearancePage.tsx            # Theme toggle
├── components/layout/
│   └── Sidebar.tsx                   # Updated: contextual sidebar logic
├── store/
│   └── useAuthStore.ts              # Enhanced: permissions, moduleAccess, roles
└── hooks/
    └── usePermission.ts             # Permission checking hook
```

### Sidebar Implementation

```typescript
// Sidebar behavior based on current route
type SidebarMode = 'global' | 'module'

// Determine mode from current path
function getSidebarMode(pathname: string): { mode: SidebarMode; moduleSlug?: string } {
  // /home/admin/* → module mode, slug = 'admin'
  // /home/deals/* → module mode, slug = 'deals'
  // /home, /home/dashboard, /home/chat, etc. → global mode
}

// Each module defines its sidebar nav items
interface ModuleNavConfig {
  slug: string
  label: string
  icon: LucideIcon
  accentColor: string
  items: { label: string; path: string; icon: LucideIcon }[]
}
```

### Auth Store Enhancement

```typescript
interface AuthState {
  // Existing
  isAuthenticated: boolean
  user: User | null
  accessToken: string | null

  // New
  moduleRoles: Record<string, 'owner' | 'manager' | 'analyst'>  // { deals: 'analyst', engage: 'analyst' }
  
  // Helpers
  hasModuleAccess: (moduleSlug: string) => boolean
  getModuleRole: (moduleSlug: string) => 'owner' | 'manager' | 'analyst' | null
  isOrgAdmin: () => boolean  // has any role in 'admin' module
}
```

---

## 8. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Navigation pattern | Contextual sidebar (morphs per module) | Clean, focused, scales well. Users spend most time in one module. |
| Pinned sidebar item | "Your Daily" at bottom | Quick access to daily activities from any module context |
| Role model | 3 system-defined roles (Owner/Manager/Analyst) per module | Simple, predictable, no configuration overhead for org admins |
| Custom roles | Deferred to v2+ | Keeps v1 simple; 3 roles cover most use cases |
| Groups | Deferred to v2+ | Not needed for small orgs (5-20 users) |
| Admin access gate | Administration = module in RBAC matrix | Consistent with the rest of the system, no special flags |
| My Account location | Avatar dropdown → separate route, outside admin | Every user needs access; not an admin function |
| Profile settings per module | Deferred | Users will have module-specific settings in each module's own settings page |

---

## 9. Deferred Items (v2+)

- **Groups**: Bulk role assignment for larger orgs
- **Custom roles**: Create custom permission bundles beyond Owner/Manager/Analyst
- **Audit log viewer**: View all admin actions (user changes, role changes, login events)
- **Activity log / login history**: Per-user login history and session management
- **SSO / SAML**: Enterprise single sign-on integration
- **IP whitelisting**: Restrict org access to specific IP ranges
- **API key management**: Service-to-service authentication for integrations
- **Data export / GDPR tools**: Bulk data export and right-to-deletion flows
- **Notification preferences**: Per-module notification settings (email, push, in-app)
- **Manager field**: Change from free text to user picker (select from org members)
