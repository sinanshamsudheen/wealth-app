# Invictus Administration Module — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Invictus Administration module (company profile, branding, roles & access, preferences), My Account pages, contextual sidebar navigation, and the enhanced auth store with module-role RBAC.

**Architecture:** Frontend-only (React SPA with MSW mocks). The sidebar morphs between global nav and module-specific nav based on current route. Administration is a module in the RBAC matrix — users with an Admin role see the Administration sidebar item. My Account is a separate area accessible via avatar dropdown. All API calls are mocked via MSW.

**Tech Stack:** React 19, TypeScript, Zustand 5, shadcn/ui, Tailwind CSS 4.2, React Router 7, MSW 2, Lucide React

**Spec:** `docs/superpowers/specs/2026-04-11-invictus-administration-design.md`

---

## File Structure

### New Files

```
client/src/
├── modules/
│   └── admin/
│       ├── pages/
│       │   ├── AdminLayout.tsx              # Admin module layout (wraps child routes)
│       │   ├── CompanyProfilePage.tsx        # Company profile form
│       │   ├── BrandingPage.tsx              # Logo upload, color picker, email footer
│       │   ├── UsersPage.tsx                 # User list with role matrix table
│       │   ├── UserDetailPanel.tsx           # User edit slide-over (sheet)
│       │   └── PreferencesPage.tsx           # Currency, date/number format
│       ├── components/
│       │   ├── InviteUserDialog.tsx          # 3-step invite wizard dialog
│       │   ├── ModuleRoleSelector.tsx        # Per-module role dropdown row
│       │   └── UserRoleBadge.tsx             # Owner/Manager/Analyst colored badge
│       ├── types.ts                         # Admin TypeScript interfaces
│       └── api.ts                           # Admin API client + endpoints
├── pages/
│   ├── AccountLayout.tsx                    # My Account layout with sub-nav
│   ├── ProfilePage.tsx                      # Personal profile form
│   └── SecurityPage.tsx                     # Password change, 2FA toggle
├── store/
│   └── useAdminStore.ts                     # Zustand store for admin data
├── hooks/
│   └── useActiveModule.ts                   # Detect current module from route
├── api/mock/
│   └── data/
│       └── admin.ts                         # Mock data for admin module
```

### Modified Files

```
client/src/
├── App.tsx                                  # Add admin + account routes
├── store/useAuthStore.ts                    # Add moduleRoles, helpers
├── components/layout/
│   ├── Sidebar.tsx                          # Contextual sidebar (global vs module)
│   ├── TopNav.tsx                           # Add breadcrumbs + My Account link
│   ├── AppShell.tsx                         # Pass module context to sidebar
│   └── ModuleSwitcher.tsx                   # Enable Administration module
├── api/mock/handlers.ts                     # Add admin API handlers
├── api/endpoints.ts                         # Add adminApi + accountApi
└── api/client.ts                            # Add put + delete methods
```

---

## Task 1: Extend API Client with PUT and DELETE

**Files:**
- Modify: `client/src/api/client.ts`

- [ ] **Step 1: Add put and delete methods to the API client**

```typescript
// client/src/api/client.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((error as { error: string }).error || res.statusText)
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
```

- [ ] **Step 2: Verify the dev server still runs**

Run: `cd client && pnpm build`
Expected: Build succeeds with no type errors

- [ ] **Step 3: Commit**

```bash
git add client/src/api/client.ts
git commit -m "feat: add put and delete methods to API client"
```

---

## Task 2: Admin Types and Mock Data

**Files:**
- Create: `client/src/modules/admin/types.ts`
- Create: `client/src/api/mock/data/admin.ts`

- [ ] **Step 1: Create admin TypeScript interfaces**

```typescript
// client/src/modules/admin/types.ts

export type ModuleRole = 'owner' | 'manager' | 'analyst'

export type ModuleSlug = 'admin' | 'deals' | 'engage' | 'plan' | 'insights' | 'tools'

export interface ModuleRoleAssignment {
  moduleSlug: ModuleSlug
  role: ModuleRole
}

export interface OrgUser {
  id: string
  email: string
  firstName: string
  lastName: string
  title: string | null
  phone: string | null
  avatarUrl: string | null
  status: 'active' | 'invited' | 'suspended'
  moduleRoles: ModuleRoleAssignment[]
  lastLoginAt: string | null
  createdAt: string
}

export interface Invitation {
  id: string
  email: string
  firstName: string
  lastName: string
  moduleRoles: ModuleRoleAssignment[]
  invitedBy: string
  expiresAt: string
  createdAt: string
}

export interface InviteUserRequest {
  email: string
  firstName: string
  lastName: string
  moduleRoles: ModuleRoleAssignment[]
}

export interface OrgProfile {
  id: string
  name: string
  slug: string
  companyNumber: string | null
  websiteUrl: string | null
  currency: string
  timezone: string
  address: {
    line: string
    city: string
    state: string
    country: string
    zip: string
  }
  isActive: boolean
  supportEmail: string | null
}

export interface OrgBranding {
  smallLogoUrl: string | null
  largeLogoUrl: string | null
  headerLogo: 'small' | 'large'
  brandColor: string
  emailFooter: string
}

export interface OrgPreferences {
  currency: string
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  numberFormat: '1,000.00' | '1.000,00'
}

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  title: string | null
  phone: string | null
  managerName: string | null
  avatarUrl: string | null
  address: {
    line: string
    city: string
    state: string
    country: string
    zip: string
  }
}
```

- [ ] **Step 2: Create mock data**

```typescript
// client/src/api/mock/data/admin.ts
import type { OrgUser, OrgProfile, OrgBranding, OrgPreferences, Invitation } from '@/modules/admin/types'

export const MOCK_ORG_PROFILE: OrgProfile = {
  id: 'org-watar',
  name: 'Watar Partners',
  slug: 'watar',
  companyNumber: 'WP-2024-001',
  websiteUrl: 'https://watar.com',
  currency: 'USD',
  timezone: 'Asia/Dubai',
  address: {
    line: '123 Business Bay, Tower A',
    city: 'Dubai',
    state: 'Dubai',
    country: 'UAE',
    zip: '00000',
  },
  isActive: true,
  supportEmail: 'support@watar.com',
}

export const MOCK_ORG_BRANDING: OrgBranding = {
  smallLogoUrl: null,
  largeLogoUrl: null,
  headerLogo: 'small',
  brandColor: '#1E3A5F',
  emailFooter: 'Confidential. This email and attachments are for the intended recipient only.',
}

export const MOCK_ORG_PREFERENCES: OrgPreferences = {
  currency: 'USD',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: '1,000.00',
}

export const MOCK_USERS: OrgUser[] = [
  {
    id: 'user-usman',
    email: 'usman@watar.com',
    firstName: 'Usman',
    lastName: 'Ahmed',
    title: 'Managing Partner',
    phone: '+971 50 111 2222',
    avatarUrl: null,
    status: 'active',
    moduleRoles: [
      { moduleSlug: 'admin', role: 'owner' },
      { moduleSlug: 'deals', role: 'owner' },
      { moduleSlug: 'engage', role: 'owner' },
      { moduleSlug: 'plan', role: 'owner' },
      { moduleSlug: 'insights', role: 'owner' },
      { moduleSlug: 'tools', role: 'owner' },
    ],
    lastLoginAt: '2026-04-10T14:30:00Z',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'user-pine',
    email: 'pine@watar.com',
    firstName: 'Pine',
    lastName: 'Liu',
    title: 'Senior Analyst',
    phone: '+971 50 333 4444',
    avatarUrl: null,
    status: 'active',
    moduleRoles: [
      { moduleSlug: 'deals', role: 'manager' },
      { moduleSlug: 'engage', role: 'manager' },
      { moduleSlug: 'insights', role: 'manager' },
    ],
    lastLoginAt: '2026-04-10T09:15:00Z',
    createdAt: '2025-02-20T10:00:00Z',
  },
  {
    id: 'user-john',
    email: 'john@watar.com',
    firstName: 'John',
    lastName: 'Smith',
    title: 'Analyst',
    phone: '+971 50 555 6666',
    avatarUrl: null,
    status: 'active',
    moduleRoles: [
      { moduleSlug: 'deals', role: 'analyst' },
      { moduleSlug: 'engage', role: 'analyst' },
      { moduleSlug: 'insights', role: 'analyst' },
    ],
    lastLoginAt: '2026-04-09T16:45:00Z',
    createdAt: '2025-03-10T10:00:00Z',
  },
  {
    id: 'user-sarah',
    email: 'sarah@watar.com',
    firstName: 'Sarah',
    lastName: 'Khan',
    title: 'Junior Analyst',
    phone: null,
    avatarUrl: null,
    status: 'invited',
    moduleRoles: [
      { moduleSlug: 'deals', role: 'analyst' },
    ],
    lastLoginAt: null,
    createdAt: '2026-04-08T10:00:00Z',
  },
  {
    id: 'user-raoof',
    email: 'raoof@watar.com',
    firstName: 'Raoof',
    lastName: 'Naushad',
    title: 'Senior Analyst',
    phone: '+971 50 123 4567',
    avatarUrl: null,
    status: 'active',
    moduleRoles: [
      { moduleSlug: 'admin', role: 'owner' },
      { moduleSlug: 'deals', role: 'manager' },
      { moduleSlug: 'engage', role: 'manager' },
      { moduleSlug: 'insights', role: 'analyst' },
    ],
    lastLoginAt: '2026-04-11T08:00:00Z',
    createdAt: '2025-01-20T10:00:00Z',
  },
]

export const MOCK_INVITATIONS: Invitation[] = [
  {
    id: 'inv-1',
    email: 'sarah@watar.com',
    firstName: 'Sarah',
    lastName: 'Khan',
    moduleRoles: [{ moduleSlug: 'deals', role: 'analyst' }],
    invitedBy: 'user-usman',
    expiresAt: '2026-04-13T10:00:00Z',
    createdAt: '2026-04-10T10:00:00Z',
  },
]
```

- [ ] **Step 3: Commit**

```bash
git add client/src/modules/admin/types.ts client/src/api/mock/data/admin.ts
git commit -m "feat: add admin module types and mock data"
```

---

## Task 3: Admin API Endpoints and MSW Handlers

**Files:**
- Create: `client/src/modules/admin/api.ts`
- Modify: `client/src/api/endpoints.ts`
- Modify: `client/src/api/mock/handlers.ts`

- [ ] **Step 1: Create admin API client**

```typescript
// client/src/modules/admin/api.ts
import { api } from '@/api/client'
import type {
  OrgUser,
  OrgProfile,
  OrgBranding,
  OrgPreferences,
  Invitation,
  InviteUserRequest,
  UserProfile,
  ModuleRoleAssignment,
} from './types'

export const adminApi = {
  // Organization
  getOrganization: () => api.get<OrgProfile>('/admin/organization'),
  updateOrganization: (data: Partial<OrgProfile>) => api.put<OrgProfile>('/admin/organization', data),

  // Branding
  getBranding: () => api.get<OrgBranding>('/admin/branding'),
  updateBranding: (data: Partial<OrgBranding>) => api.put<OrgBranding>('/admin/branding', data),

  // Preferences
  getPreferences: () => api.get<OrgPreferences>('/admin/preferences'),
  updatePreferences: (data: Partial<OrgPreferences>) => api.put<OrgPreferences>('/admin/preferences', data),

  // Users
  listUsers: () => api.get<OrgUser[]>('/admin/users'),
  getUser: (id: string) => api.get<OrgUser>(`/admin/users/${id}`),
  updateUser: (id: string, data: { status?: string; moduleRoles?: ModuleRoleAssignment[] }) =>
    api.put<OrgUser>(`/admin/users/${id}`, data),
  removeUser: (id: string) => api.delete<void>(`/admin/users/${id}`),

  // Invitations
  listInvitations: () => api.get<Invitation[]>('/admin/invitations'),
  sendInvitation: (data: InviteUserRequest) => api.post<Invitation>('/admin/invitations', data),
  cancelInvitation: (id: string) => api.delete<void>(`/admin/invitations/${id}`),
}

export const accountApi = {
  getProfile: () => api.get<UserProfile>('/account/profile'),
  updateProfile: (data: Partial<UserProfile>) => api.put<UserProfile>('/account/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<void>('/account/password', data),
}
```

- [ ] **Step 2: Add MSW handlers for admin endpoints**

Append these handlers to the `handlers` array in `client/src/api/mock/handlers.ts`:

```typescript
// Add these imports at the top of handlers.ts
import {
  MOCK_ORG_PROFILE,
  MOCK_ORG_BRANDING,
  MOCK_ORG_PREFERENCES,
  MOCK_USERS,
  MOCK_INVITATIONS,
} from './data/admin'
import type { OrgProfile, OrgBranding, OrgPreferences, InviteUserRequest, ModuleRoleAssignment } from '@/modules/admin/types'

// Add mutable state after the existing dynamicRuns/runTimers Maps
const orgProfile = { ...MOCK_ORG_PROFILE }
const orgBranding = { ...MOCK_ORG_BRANDING }
const orgPreferences = { ...MOCK_ORG_PREFERENCES }
const users = [...MOCK_USERS]
const invitations = [...MOCK_INVITATIONS]
```

Then append these handlers inside the `handlers` array (before the closing `]`):

```typescript
  // ── Administration: Organization ─────────────────────────────────

  http.get('/api/admin/organization', async () => {
    await delay(300)
    return HttpResponse.json(orgProfile)
  }),

  http.put('/api/admin/organization', async ({ request }) => {
    await delay(400)
    const body = await request.json() as Partial<OrgProfile>
    Object.assign(orgProfile, body)
    return HttpResponse.json(orgProfile)
  }),

  // ── Administration: Branding ─────────────────────────────────────

  http.get('/api/admin/branding', async () => {
    await delay(300)
    return HttpResponse.json(orgBranding)
  }),

  http.put('/api/admin/branding', async ({ request }) => {
    await delay(400)
    const body = await request.json() as Partial<OrgBranding>
    Object.assign(orgBranding, body)
    return HttpResponse.json(orgBranding)
  }),

  // ── Administration: Preferences ──────────────────────────────────

  http.get('/api/admin/preferences', async () => {
    await delay(200)
    return HttpResponse.json(orgPreferences)
  }),

  http.put('/api/admin/preferences', async ({ request }) => {
    await delay(300)
    const body = await request.json() as Partial<OrgPreferences>
    Object.assign(orgPreferences, body)
    return HttpResponse.json(orgPreferences)
  }),

  // ── Administration: Users ────────────────────────────────────────

  http.get('/api/admin/users', async () => {
    await delay(300)
    return HttpResponse.json(users)
  }),

  http.get('/api/admin/users/:id', async ({ params }) => {
    await delay(200)
    const { id } = params as { id: string }
    const user = users.find(u => u.id === id)
    if (!user) return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    return HttpResponse.json(user)
  }),

  http.put('/api/admin/users/:id', async ({ params, request }) => {
    await delay(400)
    const { id } = params as { id: string }
    const body = await request.json() as { status?: string; moduleRoles?: ModuleRoleAssignment[] }
    const idx = users.findIndex(u => u.id === id)
    if (idx === -1) return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    if (body.status) users[idx].status = body.status as 'active' | 'invited' | 'suspended'
    if (body.moduleRoles) users[idx].moduleRoles = body.moduleRoles
    return HttpResponse.json(users[idx])
  }),

  http.delete('/api/admin/users/:id', async ({ params }) => {
    await delay(300)
    const { id } = params as { id: string }
    const idx = users.findIndex(u => u.id === id)
    if (idx === -1) return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    users.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // ── Administration: Invitations ──────────────────────────────────

  http.get('/api/admin/invitations', async () => {
    await delay(200)
    return HttpResponse.json(invitations)
  }),

  http.post('/api/admin/invitations', async ({ request }) => {
    await delay(500)
    const body = await request.json() as InviteUserRequest
    const newInvitation = {
      id: `inv-${Date.now().toString(36)}`,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      moduleRoles: body.moduleRoles,
      invitedBy: 'user-raoof',
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    }
    invitations.push(newInvitation)

    // Also add as an invited user
    users.push({
      id: `user-${Date.now().toString(36)}`,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      title: null,
      phone: null,
      avatarUrl: null,
      status: 'invited',
      moduleRoles: body.moduleRoles,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    })

    return HttpResponse.json(newInvitation, { status: 201 })
  }),

  http.delete('/api/admin/invitations/:id', async ({ params }) => {
    await delay(300)
    const { id } = params as { id: string }
    const idx = invitations.findIndex(inv => inv.id === id)
    if (idx === -1) return HttpResponse.json({ error: 'Invitation not found' }, { status: 404 })
    invitations.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // ── My Account ───────────────────────────────────────────────────

  http.get('/api/account/profile', async () => {
    await delay(200)
    const currentUser = users.find(u => u.id === 'user-raoof')
    if (!currentUser) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    return HttpResponse.json({
      id: currentUser.id,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      title: currentUser.title,
      phone: currentUser.phone,
      managerName: 'Usman Ahmed',
      avatarUrl: currentUser.avatarUrl,
      address: { line: '123 Business Bay', city: 'Dubai', state: 'Dubai', country: 'UAE', zip: '00000' },
    })
  }),

  http.put('/api/account/profile', async ({ request }) => {
    await delay(400)
    const body = await request.json() as Record<string, unknown>
    // In mock, just return the data back
    return HttpResponse.json(body)
  }),

  http.put('/api/account/password', async () => {
    await delay(500)
    return HttpResponse.json({ success: true })
  }),
```

- [ ] **Step 3: Verify build**

Run: `cd client && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add client/src/modules/admin/api.ts client/src/api/mock/handlers.ts
git commit -m "feat: add admin API client and MSW mock handlers"
```

---

## Task 4: Enhanced Auth Store with Module Roles

**Files:**
- Modify: `client/src/store/useAuthStore.ts`

- [ ] **Step 1: Rewrite auth store with moduleRoles support**

Replace the entire file with:

```typescript
// client/src/store/useAuthStore.ts
import { create } from 'zustand'
import type { ModuleRole, ModuleSlug } from '@/modules/admin/types'

interface User {
  id: string
  name: string
  email: string
  initials: string
  firstName: string
  lastName: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  tenantId: string
  moduleRoles: Partial<Record<ModuleSlug, ModuleRole>>

  // Actions
  login: (username: string, password: string) => boolean
  logout: () => void

  // Helpers
  hasModuleAccess: (moduleSlug: ModuleSlug) => boolean
  getModuleRole: (moduleSlug: ModuleSlug) => ModuleRole | null
  isOrgAdmin: () => boolean
}

function deriveUser(input: string): User {
  const trimmed = input.trim()
  let nameParts: string[]
  let email: string

  if (trimmed.includes('@')) {
    email = trimmed.toLowerCase()
    const localPart = email.split('@')[0]
    nameParts = localPart.split(/[._\-+]+/).filter(Boolean)
  } else {
    nameParts = trimmed.split(/\s+/).filter(Boolean)
    email = `${nameParts.join('.').toLowerCase()}@asbitech.ai`
  }

  const firstName = nameParts[0]
    ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase()
    : ''
  const lastName = nameParts.length >= 2
    ? nameParts[nameParts.length - 1].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].slice(1).toLowerCase()
    : ''
  const name = [firstName, lastName].filter(Boolean).join(' ')
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()

  return { id: 'user-raoof', name, email, initials, firstName, lastName }
}

// Default module roles for the mock user (Raoof)
const DEFAULT_MODULE_ROLES: Partial<Record<ModuleSlug, ModuleRole>> = {
  admin: 'owner',
  deals: 'manager',
  engage: 'manager',
  insights: 'analyst',
}

function loadStoredAuth(): { user: User | null; moduleRoles: Partial<Record<ModuleSlug, ModuleRole>> } {
  const stored = localStorage.getItem('auth_user')
  const storedRoles = localStorage.getItem('auth_module_roles')
  let user: User | null = null
  let moduleRoles = DEFAULT_MODULE_ROLES

  if (stored) {
    try {
      user = JSON.parse(stored) as User
    } catch { /* ignore */ }
  }
  if (storedRoles) {
    try {
      moduleRoles = JSON.parse(storedRoles) as Partial<Record<ModuleSlug, ModuleRole>>
    } catch { /* ignore */ }
  }

  return { user, moduleRoles }
}

const initial = loadStoredAuth()

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: !!localStorage.getItem('auth_token'),
  user: initial.user,
  tenantId: 'tenant-watar',
  moduleRoles: initial.moduleRoles,

  login: (username: string, _password: string) => {
    const user = deriveUser(username)
    const moduleRoles = DEFAULT_MODULE_ROLES
    localStorage.setItem('auth_token', 'mock-jwt-token')
    localStorage.setItem('auth_user', JSON.stringify(user))
    localStorage.setItem('auth_module_roles', JSON.stringify(moduleRoles))
    set({ isAuthenticated: true, user, moduleRoles })
    return true
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_module_roles')
    set({ isAuthenticated: false, user: null, moduleRoles: {} })
  },

  hasModuleAccess: (moduleSlug: ModuleSlug) => {
    return moduleSlug in get().moduleRoles
  },

  getModuleRole: (moduleSlug: ModuleSlug) => {
    return get().moduleRoles[moduleSlug] ?? null
  },

  isOrgAdmin: () => {
    return 'admin' in get().moduleRoles
  },
}))
```

- [ ] **Step 2: Verify build**

Run: `cd client && pnpm build`
Expected: Build succeeds (existing components use `user.name`, `user.email`, `user.initials` which still exist)

- [ ] **Step 3: Commit**

```bash
git add client/src/store/useAuthStore.ts
git commit -m "feat: enhance auth store with module roles and RBAC helpers"
```

---

## Task 5: useActiveModule Hook

**Files:**
- Create: `client/src/hooks/useActiveModule.ts`

- [ ] **Step 1: Create the hook**

```typescript
// client/src/hooks/useActiveModule.ts
import { useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Handshake,
  ClipboardList,
  Flag,
  TrendingUp,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface ModuleNavItem {
  label: string
  path: string
  icon: LucideIcon
}

export interface ActiveModule {
  slug: string
  label: string
  icon: LucideIcon
  accentColor: string
  navItems: ModuleNavItem[]
}

const MODULE_NAV_CONFIG: Record<string, ActiveModule> = {
  admin: {
    slug: 'admin',
    label: 'Administration',
    icon: Settings,
    accentColor: 'text-slate-500',
    navItems: [
      { label: 'Company Profile', path: '/home/admin/company', icon: LayoutDashboard },
      { label: 'Branding', path: '/home/admin/branding', icon: LayoutDashboard },
      { label: 'Roles & Access', path: '/home/admin/users', icon: LayoutDashboard },
      { label: 'Preferences', path: '/home/admin/preferences', icon: LayoutDashboard },
    ],
  },
  deals: {
    slug: 'deals',
    label: 'Deals',
    icon: TrendingUp,
    accentColor: 'text-amber-500',
    navItems: [
      { label: 'Dashboard', path: '/home/deals', icon: LayoutDashboard },
      { label: 'Pipeline', path: '/home/deals/pipeline', icon: LayoutDashboard },
      { label: 'Opportunities', path: '/home/deals/opportunities', icon: LayoutDashboard },
      { label: 'Allocations', path: '/home/deals/allocations', icon: LayoutDashboard },
      { label: 'Reports', path: '/home/deals/reports', icon: LayoutDashboard },
    ],
  },
  engage: {
    slug: 'engage',
    label: 'Engage',
    icon: Handshake,
    accentColor: 'text-emerald-500',
    navItems: [
      { label: 'Dashboard', path: '/home/engage', icon: LayoutDashboard },
      { label: 'Clients', path: '/home/engage/clients', icon: LayoutDashboard },
      { label: 'Prospects', path: '/home/engage/prospects', icon: LayoutDashboard },
      { label: 'Pipeline', path: '/home/engage/pipeline', icon: LayoutDashboard },
    ],
  },
  plan: {
    slug: 'plan',
    label: 'Plan',
    icon: ClipboardList,
    accentColor: 'text-blue-500',
    navItems: [
      { label: 'Dashboard', path: '/home/plan', icon: LayoutDashboard },
      { label: 'Financial Plans', path: '/home/plan/plans', icon: LayoutDashboard },
      { label: 'Risk Profiles', path: '/home/plan/risk', icon: LayoutDashboard },
    ],
  },
  insights: {
    slug: 'insights',
    label: 'Insights',
    icon: BarChart3,
    accentColor: 'text-orange-500',
    navItems: [
      { label: 'Dashboard', path: '/home/insights', icon: LayoutDashboard },
      { label: 'Reports', path: '/home/insights/reports', icon: LayoutDashboard },
      { label: 'Alerts', path: '/home/insights/alerts', icon: LayoutDashboard },
    ],
  },
  tools: {
    slug: 'tools',
    label: 'Tools & Communication',
    icon: Flag,
    accentColor: 'text-violet-500',
    navItems: [
      { label: 'Dashboard', path: '/home/tools', icon: LayoutDashboard },
      { label: 'Tasks', path: '/home/tools/tasks', icon: LayoutDashboard },
      { label: 'Meetings', path: '/home/tools/meetings', icon: LayoutDashboard },
    ],
  },
}

const MODULE_SLUGS = Object.keys(MODULE_NAV_CONFIG)

export function useActiveModule(): ActiveModule | null {
  const { pathname } = useLocation()
  const match = pathname.match(/^\/home\/([^/]+)/)
  if (!match) return null

  const slug = match[1]
  if (!MODULE_SLUGS.includes(slug)) return null

  return MODULE_NAV_CONFIG[slug] ?? null
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/useActiveModule.ts
git commit -m "feat: add useActiveModule hook for contextual sidebar navigation"
```

---

## Task 6: Contextual Sidebar

**Files:**
- Modify: `client/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Rewrite Sidebar to support contextual navigation**

Replace the entire file:

```typescript
// client/src/components/layout/Sidebar.tsx
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home,
  LayoutDashboard,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  Handshake,
  ClipboardList,
  Flag,
  TrendingUp,
  BarChart3,
  CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useActiveModule } from '@/hooks/useActiveModule'
import { useAuthStore } from '@/store/useAuthStore'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface NavItem {
  icon?: typeof Home
  customIcon?: React.ReactNode
  label: string
  path: string
  end?: boolean
}

const GLOBAL_NAV: NavItem[] = [
  { icon: Home, label: 'Home', path: '/home', end: true },
  { icon: LayoutDashboard, label: 'Your Daily', path: '/home/dashboard' },
  { customIcon: <img src="/invictus-logo.svg" alt="" className="h-4.5 w-4.5 dark:invert" />, label: 'Chat', path: '/home/chat' },
  { icon: Bot, label: 'Agents', path: '/home/agents' },
]

const MODULE_ITEMS: NavItem[] = [
  { icon: TrendingUp, label: 'Deals', path: '/home/deals' },
  { icon: Handshake, label: 'Engage', path: '/home/engage' },
  { icon: ClipboardList, label: 'Plan', path: '/home/plan' },
  { icon: BarChart3, label: 'Insights', path: '/home/insights' },
  { icon: Flag, label: 'Tools', path: '/home/tools' },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const activeModule = useActiveModule()
  const isOrgAdmin = useAuthStore((s) => s.isOrgAdmin())
  const hasModuleAccess = useAuthStore((s) => s.hasModuleAccess)
  const navigate = useNavigate()

  function renderNavItem(item: NavItem) {
    const Icon = item.icon
    const content = (
      <div
        className={cn(
          'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors cursor-pointer',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          'text-sidebar-foreground',
          hoveredItem === item.label && 'bg-sidebar-accent'
        )}
        onMouseEnter={() => setHoveredItem(item.label)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {item.customIcon ? (
          <span className="h-4 w-4 shrink-0 flex items-center justify-center">{item.customIcon}</span>
        ) : Icon ? (
          <Icon className="h-4 w-4 shrink-0" />
        ) : null}
        {!collapsed && <span className="truncate">{item.label}</span>}
      </div>
    )

    const link = (
      <NavLink
        key={item.label}
        to={item.path}
        end={item.end}
        className={({ isActive }) =>
          cn(isActive && '[&>div]:bg-sidebar-accent [&>div]:text-sidebar-accent-foreground [&>div]:font-medium')
        }
      >
        {content}
      </NavLink>
    )

    return collapsed ? (
      <Tooltip key={item.label}>
        <TooltipTrigger className="w-full text-left">
          <NavLink
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(isActive && '[&>div]:bg-sidebar-accent [&>div]:text-sidebar-accent-foreground [&>div]:font-medium')
            }
          >
            {content}
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    ) : link
  }

  // ── Module View (inside a module) ────────────────────────────────
  if (activeModule) {
    const ModuleIcon = activeModule.icon
    const moduleNavItems: NavItem[] = activeModule.navItems.map((item) => ({
      icon: item.icon,
      label: item.label,
      path: item.path,
    }))

    return (
      <aside
        className={cn(
          'border-r border-border bg-sidebar flex flex-col shrink-0 transition-all duration-200',
          collapsed ? 'w-14' : 'w-56'
        )}
      >
        <nav className="flex-1 py-3 px-2 space-y-1">
          {/* Back to Home */}
          <button
            onClick={() => navigate('/home')}
            className={cn(
              'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors cursor-pointer w-full',
              'hover:bg-sidebar-accent text-muted-foreground'
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Back to Home</span>}
          </button>

          {/* Module header */}
          {!collapsed && (
            <div className={cn('flex items-center gap-2 px-2.5 py-2 text-xs font-bold uppercase tracking-wider', activeModule.accentColor)}>
              <ModuleIcon className="h-3.5 w-3.5" />
              {activeModule.label}
            </div>
          )}

          {/* Module nav items */}
          {moduleNavItems.map(renderNavItem)}
        </nav>

        {/* Pinned: Your Daily */}
        <div className="px-2 py-1 border-t border-border">
          {renderNavItem({ icon: CalendarDays, label: 'Your Daily', path: '/home/dashboard' })}
        </div>

        <div className="p-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onToggle} className="w-full justify-center h-8">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
    )
  }

  // ── Global View ──────────────────────────────────────────────────
  // Filter module items based on user's module access
  const accessibleModules = MODULE_ITEMS.filter((item) => {
    const slug = item.path.split('/').pop()
    return slug ? hasModuleAccess(slug as 'deals' | 'engage' | 'plan' | 'insights' | 'tools') : false
  })

  return (
    <aside
      className={cn(
        'border-r border-border bg-sidebar flex flex-col shrink-0 transition-all duration-200',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      <nav className="flex-1 py-3 px-2 space-y-1">
        {GLOBAL_NAV.map(renderNavItem)}

        {/* Modules section */}
        {accessibleModules.length > 0 && (
          <>
            {!collapsed && (
              <div className="px-2.5 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Modules
              </div>
            )}
            {collapsed && <div className="my-2 border-t border-border" />}
            {accessibleModules.map(renderNavItem)}
          </>
        )}
      </nav>

      {/* Administration link (org admins only) */}
      {isOrgAdmin && (
        <div className="px-2 py-1 border-t border-border">
          {renderNavItem({ icon: Settings, label: 'Administration', path: '/home/admin' })}
        </div>
      )}

      <div className="p-2 border-t border-border">
        <Button variant="ghost" size="sm" onClick={onToggle} className="w-full justify-center h-8">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add client/src/components/layout/Sidebar.tsx
git commit -m "feat: implement contextual sidebar that morphs per module"
```

---

## Task 7: Update TopNav with Breadcrumbs and My Account Link

**Files:**
- Modify: `client/src/components/layout/TopNav.tsx`

- [ ] **Step 1: Add admin/account breadcrumbs and My Account dropdown item**

In `TopNav.tsx`, add these cases inside `getBreadcrumbs()` after the `runs` case (around line 53):

```typescript
    } else if (parts[0] === 'admin') {
      crumbs.push({ label: 'Administration', path: '/home/admin' })
      if (parts[1] === 'company') crumbs.push({ label: 'Company Profile', path: '/home/admin/company' })
      else if (parts[1] === 'branding') crumbs.push({ label: 'Branding', path: '/home/admin/branding' })
      else if (parts[1] === 'users') crumbs.push({ label: 'Roles & Access', path: '/home/admin/users' })
      else if (parts[1] === 'preferences') crumbs.push({ label: 'Preferences', path: '/home/admin/preferences' })
    } else if (parts[0] === 'account') {
      crumbs.push({ label: 'My Account', path: '/home/account' })
      if (parts[1] === 'security') crumbs.push({ label: 'Security', path: '/home/account/security' })
    }
```

Then add the `User` icon import and My Account link to the avatar dropdown. Add `User` to the lucide-react import:

```typescript
import { Sun, Moon, Grid3X3, LogOut, ChevronRight, User } from 'lucide-react'
```

And add a "My Account" menu item before the Logout item in the `DropdownMenuContent`:

```typescript
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/home/account')}>
              <User className="mr-2 h-4 w-4" />
              My Account
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
```

- [ ] **Step 2: Verify build**

Run: `cd client && pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add client/src/components/layout/TopNav.tsx
git commit -m "feat: add admin/account breadcrumbs and My Account link to avatar dropdown"
```

---

## Task 8: Update ModuleSwitcher

**Files:**
- Modify: `client/src/components/layout/ModuleSwitcher.tsx`

- [ ] **Step 1: Enable Administration module in ModuleSwitcher**

In `ModuleSwitcher.tsx`, update line 36 to activate the admin module:

Change:
```typescript
  { name: 'Invictus\nAdministration', icon: 'Users', active: false, path: null },
```
To:
```typescript
  { name: 'Invictus\nAdministration', icon: 'Users', active: false, path: '/home/admin' },
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/layout/ModuleSwitcher.tsx
git commit -m "feat: enable Administration module in ModuleSwitcher"
```

---

## Task 9: Admin Zustand Store

**Files:**
- Create: `client/src/store/useAdminStore.ts`

- [ ] **Step 1: Create admin store**

```typescript
// client/src/store/useAdminStore.ts
import { create } from 'zustand'
import { adminApi } from '@/modules/admin/api'
import type { OrgUser, OrgProfile, OrgBranding, OrgPreferences, Invitation, InviteUserRequest, ModuleRoleAssignment } from '@/modules/admin/types'

interface AdminState {
  // Data
  users: OrgUser[]
  invitations: Invitation[]
  orgProfile: OrgProfile | null
  branding: OrgBranding | null
  preferences: OrgPreferences | null

  // Loading
  isLoadingUsers: boolean
  isLoadingOrg: boolean
  isLoadingBranding: boolean
  isLoadingPreferences: boolean

  // Actions
  fetchUsers: () => Promise<void>
  fetchInvitations: () => Promise<void>
  fetchOrgProfile: () => Promise<void>
  fetchBranding: () => Promise<void>
  fetchPreferences: () => Promise<void>
  updateOrgProfile: (data: Partial<OrgProfile>) => Promise<void>
  updateBranding: (data: Partial<OrgBranding>) => Promise<void>
  updatePreferences: (data: Partial<OrgPreferences>) => Promise<void>
  updateUserRoles: (userId: string, moduleRoles: ModuleRoleAssignment[]) => Promise<void>
  updateUserStatus: (userId: string, status: string) => Promise<void>
  removeUser: (userId: string) => Promise<void>
  sendInvitation: (data: InviteUserRequest) => Promise<void>
  cancelInvitation: (invitationId: string) => Promise<void>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  invitations: [],
  orgProfile: null,
  branding: null,
  preferences: null,
  isLoadingUsers: false,
  isLoadingOrg: false,
  isLoadingBranding: false,
  isLoadingPreferences: false,

  fetchUsers: async () => {
    set({ isLoadingUsers: true })
    try {
      const users = await adminApi.listUsers()
      set({ users, isLoadingUsers: false })
    } catch {
      set({ isLoadingUsers: false })
    }
  },

  fetchInvitations: async () => {
    try {
      const invitations = await adminApi.listInvitations()
      set({ invitations })
    } catch { /* ignore */ }
  },

  fetchOrgProfile: async () => {
    set({ isLoadingOrg: true })
    try {
      const orgProfile = await adminApi.getOrganization()
      set({ orgProfile, isLoadingOrg: false })
    } catch {
      set({ isLoadingOrg: false })
    }
  },

  fetchBranding: async () => {
    set({ isLoadingBranding: true })
    try {
      const branding = await adminApi.getBranding()
      set({ branding, isLoadingBranding: false })
    } catch {
      set({ isLoadingBranding: false })
    }
  },

  fetchPreferences: async () => {
    set({ isLoadingPreferences: true })
    try {
      const preferences = await adminApi.getPreferences()
      set({ preferences, isLoadingPreferences: false })
    } catch {
      set({ isLoadingPreferences: false })
    }
  },

  updateOrgProfile: async (data) => {
    const orgProfile = await adminApi.updateOrganization(data)
    set({ orgProfile })
  },

  updateBranding: async (data) => {
    const branding = await adminApi.updateBranding(data)
    set({ branding })
  },

  updatePreferences: async (data) => {
    const preferences = await adminApi.updatePreferences(data)
    set({ preferences })
  },

  updateUserRoles: async (userId, moduleRoles) => {
    const updated = await adminApi.updateUser(userId, { moduleRoles })
    set({ users: get().users.map((u) => (u.id === userId ? updated : u)) })
  },

  updateUserStatus: async (userId, status) => {
    const updated = await adminApi.updateUser(userId, { status })
    set({ users: get().users.map((u) => (u.id === userId ? updated : u)) })
  },

  removeUser: async (userId) => {
    await adminApi.removeUser(userId)
    set({ users: get().users.filter((u) => u.id !== userId) })
  },

  sendInvitation: async (data) => {
    await adminApi.sendInvitation(data)
    // Refresh both lists
    await get().fetchUsers()
    await get().fetchInvitations()
  },

  cancelInvitation: async (invitationId) => {
    await adminApi.cancelInvitation(invitationId)
    set({ invitations: get().invitations.filter((inv) => inv.id !== invitationId) })
  },
}))
```

- [ ] **Step 2: Commit**

```bash
git add client/src/store/useAdminStore.ts
git commit -m "feat: add admin Zustand store with full CRUD operations"
```

---

## Task 10: UserRoleBadge and ModuleRoleSelector Components

**Files:**
- Create: `client/src/modules/admin/components/UserRoleBadge.tsx`
- Create: `client/src/modules/admin/components/ModuleRoleSelector.tsx`

- [ ] **Step 1: Create UserRoleBadge**

```typescript
// client/src/modules/admin/components/UserRoleBadge.tsx
import { cn } from '@/lib/utils'
import type { ModuleRole } from '../types'

interface UserRoleBadgeProps {
  role: ModuleRole
}

const ROLE_STYLES: Record<ModuleRole, { bg: string; text: string; label: string }> = {
  owner: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Owner' },
  manager: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Manager' },
  analyst: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', label: 'Analyst' },
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const style = ROLE_STYLES[role]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold', style.bg, style.text)}>
      {style.label}
    </span>
  )
}
```

- [ ] **Step 2: Create ModuleRoleSelector**

```typescript
// client/src/modules/admin/components/ModuleRoleSelector.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ModuleRole, ModuleSlug } from '../types'

interface ModuleRoleSelectorProps {
  moduleSlug: ModuleSlug
  moduleLabel: string
  value: ModuleRole | 'none'
  onChange: (role: ModuleRole | 'none') => void
  disabled?: boolean
}

export function ModuleRoleSelector({ moduleLabel, value, onChange, disabled }: ModuleRoleSelectorProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{moduleLabel}</span>
      <Select value={value} onValueChange={(v) => onChange(v as ModuleRole | 'none')} disabled={disabled}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No access</SelectItem>
          <SelectItem value="owner">Owner</SelectItem>
          <SelectItem value="manager">Manager</SelectItem>
          <SelectItem value="analyst">Analyst</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/modules/admin/components/
git commit -m "feat: add UserRoleBadge and ModuleRoleSelector components"
```

---

## Task 11: Administration Pages (Company Profile, Branding, Preferences)

**Files:**
- Create: `client/src/modules/admin/pages/AdminLayout.tsx`
- Create: `client/src/modules/admin/pages/CompanyProfilePage.tsx`
- Create: `client/src/modules/admin/pages/BrandingPage.tsx`
- Create: `client/src/modules/admin/pages/PreferencesPage.tsx`

- [ ] **Step 1: Create AdminLayout**

```typescript
// client/src/modules/admin/pages/AdminLayout.tsx
import { Outlet } from 'react-router-dom'

export function AdminLayout() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Outlet />
    </div>
  )
}
```

- [ ] **Step 2: Create CompanyProfilePage**

```typescript
// client/src/modules/admin/pages/CompanyProfilePage.tsx
import { useEffect, useState } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const CURRENCIES = ['USD', 'AED', 'GBP', 'EUR', 'CHF', 'SGD', 'HKD']
const TIMEZONES = [
  'Asia/Dubai', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Singapore', 'Asia/Hong_Kong',
]

export function CompanyProfilePage() {
  const { orgProfile, isLoadingOrg, fetchOrgProfile, updateOrgProfile } = useAdminStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => { fetchOrgProfile() }, [fetchOrgProfile])

  useEffect(() => {
    if (orgProfile) {
      setForm({
        name: orgProfile.name,
        companyNumber: orgProfile.companyNumber ?? '',
        websiteUrl: orgProfile.websiteUrl ?? '',
        currency: orgProfile.currency,
        timezone: orgProfile.timezone,
        supportEmail: orgProfile.supportEmail ?? '',
        addressLine: orgProfile.address.line,
        city: orgProfile.address.city,
        state: orgProfile.address.state,
        country: orgProfile.address.country,
        zip: orgProfile.address.zip,
      })
    }
  }, [orgProfile])

  if (isLoadingOrg || !orgProfile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  async function handleSave() {
    await updateOrgProfile({
      name: form.name,
      companyNumber: form.companyNumber || null,
      websiteUrl: form.websiteUrl || null,
      currency: form.currency,
      timezone: form.timezone,
      supportEmail: form.supportEmail || null,
      address: {
        line: form.addressLine,
        city: form.city,
        state: form.state,
        country: form.country,
        zip: form.zip,
      },
    })
    setEditing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Company Profile</h1>
        <div className="flex items-center gap-2">
          <Badge variant={orgProfile.isActive ? 'default' : 'destructive'}>
            {orgProfile.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave}>Save Changes</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">General Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Company Name</Label>
            {editing ? (
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            ) : (
              <p className="text-sm font-medium">{orgProfile.name}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Company Number</Label>
            {editing ? (
              <Input value={form.companyNumber} onChange={(e) => setForm({ ...form, companyNumber: e.target.value })} />
            ) : (
              <p className="text-sm text-muted-foreground">{orgProfile.companyNumber || '—'}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Website URL</Label>
            {editing ? (
              <Input value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} />
            ) : (
              <p className="text-sm text-muted-foreground">{orgProfile.websiteUrl || '—'}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Support Email</Label>
            {editing ? (
              <Input value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
            ) : (
              <p className="text-sm text-muted-foreground">{orgProfile.supportEmail || '—'}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Default Currency</Label>
            {editing ? (
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium">{orgProfile.currency}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            {editing ? (
              <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium">{orgProfile.timezone}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Company Address</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label>Address Line</Label>
            {editing ? (
              <Input value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} />
            ) : (
              <p className="text-sm text-muted-foreground">{orgProfile.address.line || '—'}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            {editing ? (
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            ) : (
              <p className="text-sm text-muted-foreground">{orgProfile.address.city || '—'}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>State / Region</Label>
            {editing ? (
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            ) : (
              <p className="text-sm text-muted-foreground">{orgProfile.address.state || '—'}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            {editing ? (
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            ) : (
              <p className="text-sm text-muted-foreground">{orgProfile.address.country || '—'}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>ZIP / Postal Code</Label>
            {editing ? (
              <Input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
            ) : (
              <p className="text-sm text-muted-foreground">{orgProfile.address.zip || '—'}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Create BrandingPage**

```typescript
// client/src/modules/admin/pages/BrandingPage.tsx
import { useEffect, useState } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function BrandingPage() {
  const { branding, isLoadingBranding, fetchBranding, updateBranding } = useAdminStore()
  const [editing, setEditing] = useState(false)
  const [brandColor, setBrandColor] = useState('#1E3A5F')
  const [headerLogo, setHeaderLogo] = useState<'small' | 'large'>('small')
  const [emailFooter, setEmailFooter] = useState('')

  useEffect(() => { fetchBranding() }, [fetchBranding])

  useEffect(() => {
    if (branding) {
      setBrandColor(branding.brandColor)
      setHeaderLogo(branding.headerLogo)
      setEmailFooter(branding.emailFooter)
    }
  }, [branding])

  if (isLoadingBranding || !branding) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  async function handleSave() {
    await updateBranding({ brandColor, headerLogo, emailFooter })
    setEditing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Branding</h1>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save Changes</Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Logos</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Small Logo (48×48)</Label>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-border">
                {branding.smallLogoUrl ? (
                  <img src={branding.smallLogoUrl} alt="Small logo" className="w-full h-full object-contain rounded-lg" />
                ) : '48×48'}
              </div>
              {editing && <Button variant="outline" size="sm" disabled>Upload (v2)</Button>}
            </div>
            <div className="space-y-2">
              <Label>Large Logo (200×48)</Label>
              <div className="w-[200px] h-12 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-border">
                {branding.largeLogoUrl ? (
                  <img src={branding.largeLogoUrl} alt="Large logo" className="w-full h-full object-contain rounded-lg" />
                ) : '200×48'}
              </div>
              {editing && <Button variant="outline" size="sm" disabled>Upload (v2)</Button>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>App Header Logo</Label>
            <div className="flex gap-2">
              <Button
                variant={headerLogo === 'small' ? 'default' : 'outline'}
                size="sm"
                onClick={() => editing && setHeaderLogo('small')}
                disabled={!editing}
              >
                Small Logo
              </Button>
              <Button
                variant={headerLogo === 'large' ? 'default' : 'outline'}
                size="sm"
                onClick={() => editing && setHeaderLogo('large')}
                disabled={!editing}
              >
                Large Logo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Brand Color</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border-2 border-border"
              style={{ backgroundColor: brandColor }}
            />
            {editing ? (
              <Input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-32 font-mono text-sm"
                placeholder="#1E3A5F"
              />
            ) : (
              <span className="font-mono text-sm text-muted-foreground">{brandColor}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Email Footer</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <Textarea
              value={emailFooter}
              onChange={(e) => setEmailFooter(e.target.value)}
              rows={3}
              placeholder="Enter footer message for outgoing emails..."
            />
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {branding.emailFooter || 'No email footer configured'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Create PreferencesPage**

```typescript
// client/src/modules/admin/pages/PreferencesPage.tsx
import { useEffect } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

export function PreferencesPage() {
  const { preferences, isLoadingPreferences, fetchPreferences, updatePreferences } = useAdminStore()

  useEffect(() => { fetchPreferences() }, [fetchPreferences])

  if (isLoadingPreferences || !preferences) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Preferences</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Display Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date Format</Label>
              <Select
                value={preferences.dateFormat}
                onValueChange={(v) => updatePreferences({ dateFormat: v as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Number Format</Label>
              <Select
                value={preferences.numberFormat}
                onValueChange={(v) => updatePreferences({ numberFormat: v as '1,000.00' | '1.000,00' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1,000.00">1,000.00</SelectItem>
                  <SelectItem value="1.000,00">1.000,00</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/modules/admin/pages/
git commit -m "feat: add Administration pages — Company Profile, Branding, Preferences"
```

---

## Task 12: Users Page with Role Matrix and Invite Dialog

**Files:**
- Create: `client/src/modules/admin/pages/UsersPage.tsx`
- Create: `client/src/modules/admin/components/InviteUserDialog.tsx`

- [ ] **Step 1: Create UsersPage**

```typescript
// client/src/modules/admin/pages/UsersPage.tsx
import { useEffect, useState } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserRoleBadge } from '../components/UserRoleBadge'
import { InviteUserDialog } from '../components/InviteUserDialog'
import { UserPlus, Search } from 'lucide-react'
import type { ModuleSlug } from '../types'

const DISPLAY_MODULES: { slug: ModuleSlug; label: string }[] = [
  { slug: 'deals', label: 'Deals' },
  { slug: 'engage', label: 'Engage' },
  { slug: 'plan', label: 'Plan' },
  { slug: 'insights', label: 'Insights' },
  { slug: 'tools', label: 'Tools' },
]

export function UsersPage() {
  const { users, isLoadingUsers, fetchUsers } = useAdminStore()
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  })

  if (isLoadingUsers && users.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Roles & Access</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} members</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">User</TableHead>
                <TableHead className="w-[90px]">Status</TableHead>
                {DISPLAY_MODULES.map((m) => (
                  <TableHead key={m.slug} className="text-center w-[90px]">{m.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const initials = (user.firstName[0] + user.lastName[0]).toUpperCase()
                const isAdmin = user.moduleRoles.some((r) => r.moduleSlug === 'admin')
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm flex items-center gap-2">
                            {user.firstName} {user.lastName}
                            {isAdmin && <Badge variant="outline" className="text-[9px] px-1 py-0">Admin</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : user.status === 'invited' ? 'secondary' : 'destructive'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    {DISPLAY_MODULES.map((m) => {
                      const assignment = user.moduleRoles.find((r) => r.moduleSlug === m.slug)
                      return (
                        <TableCell key={m.slug} className="text-center">
                          {assignment ? <UserRoleBadge role={assignment.role} /> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InviteUserDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 2: Create InviteUserDialog**

```typescript
// client/src/modules/admin/components/InviteUserDialog.tsx
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAdminStore } from '@/store/useAdminStore'
import { ModuleRoleSelector } from './ModuleRoleSelector'
import type { ModuleRole, ModuleSlug, ModuleRoleAssignment } from '../types'
import { Mail } from 'lucide-react'

interface InviteUserDialogProps {
  open: boolean
  onClose: () => void
}

const MODULES: { slug: ModuleSlug; label: string }[] = [
  { slug: 'deals', label: 'Deals' },
  { slug: 'engage', label: 'Engage' },
  { slug: 'plan', label: 'Plan' },
  { slug: 'insights', label: 'Insights' },
  { slug: 'tools', label: 'Tools' },
]

export function InviteUserDialog({ open, onClose }: InviteUserDialogProps) {
  const sendInvitation = useAdminStore((s) => s.sendInvitation)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [roles, setRoles] = useState<Record<ModuleSlug, ModuleRole | 'none'>>({
    admin: 'none', deals: 'none', engage: 'none', plan: 'none', insights: 'none', tools: 'none',
  })
  const [sending, setSending] = useState(false)

  function reset() {
    setStep(1)
    setEmail('')
    setFirstName('')
    setLastName('')
    setRoles({ admin: 'none', deals: 'none', engage: 'none', plan: 'none', insights: 'none', tools: 'none' })
    setSending(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSend() {
    setSending(true)
    const moduleRoles: ModuleRoleAssignment[] = Object.entries(roles)
      .filter(([, role]) => role !== 'none')
      .map(([slug, role]) => ({ moduleSlug: slug as ModuleSlug, role: role as ModuleRole }))

    await sendInvitation({ email, firstName, lastName, moduleRoles })
    setStep(3)
    setSending(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && 'Invite User — Details'}
            {step === 2 && 'Invite User — Module Roles'}
            {step === 3 && 'Invitation Sent!'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Email Address *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} disabled={!email || !firstName || !lastName}>
                Next: Assign Roles
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Assign a role for each module. Leave as "No access" to exclude.
            </p>
            <div className="divide-y">
              {MODULES.map((m) => (
                <ModuleRoleSelector
                  key={m.slug}
                  moduleSlug={m.slug}
                  moduleLabel={m.label}
                  value={roles[m.slug]}
                  onChange={(role) => setRoles({ ...roles, [m.slug]: role })}
                />
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleSend} disabled={sending}>
                {sending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-6 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <p className="font-medium">Invitation sent to {email}</p>
            <p className="text-sm text-muted-foreground">
              {firstName} will receive an email to set up their account.
            </p>
            <Button onClick={handleClose} className="mt-4">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/modules/admin/pages/UsersPage.tsx client/src/modules/admin/components/InviteUserDialog.tsx
git commit -m "feat: add Users page with role matrix and invite dialog"
```

---

## Task 13: My Account Pages (Profile + Security)

**Files:**
- Create: `client/src/pages/AccountLayout.tsx`
- Create: `client/src/pages/ProfilePage.tsx`
- Create: `client/src/pages/SecurityPage.tsx`

- [ ] **Step 1: Create AccountLayout**

```typescript
// client/src/pages/AccountLayout.tsx
import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { User, Shield } from 'lucide-react'

const ACCOUNT_NAV = [
  { label: 'Profile', path: '/home/account', icon: User, end: true },
  { label: 'Security', path: '/home/account/security', icon: Shield, end: false },
]

export function AccountLayout() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">My Account</h1>
      <div className="flex gap-6">
        <nav className="w-48 shrink-0 space-y-1">
          {ACCOUNT_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ProfilePage**

```typescript
// client/src/pages/ProfilePage.tsx
import { useEffect, useState } from 'react'
import { accountApi } from '@/modules/admin/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserProfile } from '@/modules/admin/types'

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    accountApi.getProfile().then((p) => {
      setProfile(p)
      setForm({
        firstName: p.firstName,
        lastName: p.lastName,
        title: p.title ?? '',
        phone: p.phone ?? '',
        managerName: p.managerName ?? '',
        addressLine: p.address.line,
        city: p.address.city,
        state: p.address.state,
        country: p.address.country,
        zip: p.address.zip,
      })
      setLoading(false)
    })
  }, [])

  if (loading || !profile) {
    return <Skeleton className="h-96 w-full" />
  }

  const initials = (profile.firstName[0] + profile.lastName[0]).toUpperCase()

  async function handleSave() {
    await accountApi.updateProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      title: form.title || null,
      phone: form.phone || null,
      managerName: form.managerName || null,
      address: { line: form.addressLine, city: form.city, state: form.state, country: form.country, zip: form.zip },
    })
    setEditing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{profile.firstName} {profile.lastName}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save</Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>First Name</Label>
            {editing ? (
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            ) : (
              <p className="text-sm">{profile.firstName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Last Name</Label>
            {editing ? (
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            ) : (
              <p className="text-sm">{profile.lastName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            {editing ? (
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            ) : (
              <p className="text-sm text-muted-foreground">{profile.title || '—'}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            {editing ? (
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            ) : (
              <p className="text-sm text-muted-foreground">{profile.phone || '—'}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Manager</Label>
            {editing ? (
              <Input value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} />
            ) : (
              <p className="text-sm text-muted-foreground">{profile.managerName || '—'}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label>Address Line</Label>
            {editing ? (
              <Input value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} />
            ) : (
              <p className="text-sm text-muted-foreground">{profile.address.line || '—'}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            {editing ? (
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            ) : (
              <p className="text-sm text-muted-foreground">{profile.address.city || '—'}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            {editing ? (
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            ) : (
              <p className="text-sm text-muted-foreground">{profile.address.country || '—'}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Create SecurityPage**

```typescript
// client/src/pages/SecurityPage.tsx
import { useState } from 'react'
import { accountApi } from '@/modules/admin/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

export function SecurityPage() {
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [twoFaEnabled, setTwoFaEnabled] = useState(false)

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) return
    await accountApi.changePassword({ currentPassword, newPassword })
    setChangingPassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Password</CardTitle></CardHeader>
        <CardContent>
          {changingPassword ? (
            <div className="space-y-3 max-w-sm">
              <div className="space-y-1.5">
                <Label>Current Password</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setChangingPassword(false)}>Cancel</Button>
                <Button size="sm" onClick={handleChangePassword} disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}>
                  Update Password
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setChangingPassword(true)}>Change</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Two-Factor Authentication</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Authenticator App</p>
              <p className="text-xs text-muted-foreground">
                {twoFaEnabled ? 'Two-factor authentication is enabled' : 'Add an extra layer of security'}
              </p>
            </div>
            <Switch checked={twoFaEnabled} onCheckedChange={setTwoFaEnabled} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/AccountLayout.tsx client/src/pages/ProfilePage.tsx client/src/pages/SecurityPage.tsx
git commit -m "feat: add My Account pages — Profile and Security"
```

---

## Task 14: Wire Up Routes in App.tsx

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Add admin and account routes**

Replace the entire file:

```typescript
// client/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { ModulesHomePage } from '@/pages/ModulesHomePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { AgentsPage } from '@/pages/AgentsPage'
import { AgentDetailPage } from '@/pages/AgentDetailPage'
import { RunDetailPage } from '@/pages/RunDetailPage'
import { TriggerPage } from '@/pages/TriggerPage'
import { RunsPage } from '@/pages/RunsPage'
import { MeetingBriefPage } from '@/pages/MeetingBriefPage'
import { ChatPage } from '@/pages/ChatPage'

// Administration module
import { AdminLayout } from '@/modules/admin/pages/AdminLayout'
import { CompanyProfilePage } from '@/modules/admin/pages/CompanyProfilePage'
import { BrandingPage } from '@/modules/admin/pages/BrandingPage'
import { UsersPage } from '@/modules/admin/pages/UsersPage'
import { PreferencesPage } from '@/modules/admin/pages/PreferencesPage'

// My Account
import { AccountLayout } from '@/pages/AccountLayout'
import { ProfilePage } from '@/pages/ProfilePage'
import { SecurityPage } from '@/pages/SecurityPage'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/home" replace />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          }
        />
        {/* Main app — with sidebar layout */}
        <Route
          path="/home"
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route index element={<ModulesHomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="meetings/:meetingId" element={<MeetingBriefPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="agents/:workflow" element={<AgentDetailPage />} />
          <Route path="agents/:workflow/trigger" element={<TriggerPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="runs" element={<RunsPage />} />
          <Route path="runs/:runId" element={<RunDetailPage />} />

          {/* Administration module */}
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="company" replace />} />
            <Route path="company" element={<CompanyProfilePage />} />
            <Route path="branding" element={<BrandingPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="preferences" element={<PreferencesPage />} />
          </Route>

          {/* My Account */}
          <Route path="account" element={<AccountLayout />}>
            <Route index element={<ProfilePage />} />
            <Route path="security" element={<SecurityPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 2: Verify full build**

Run: `cd client && pnpm build`
Expected: Build succeeds with no type errors

- [ ] **Step 3: Start dev server and test navigation**

Run: `cd client && pnpm dev`

Test manually:
1. Navigate to `/home` — global sidebar with Home, Your Daily, Chat, Agents, Modules, Administration
2. Click "Administration" — sidebar morphs to Admin view (Company Profile, Branding, Roles & Access, Preferences), "Back to Home" at top, "Your Daily" pinned at bottom
3. Click Company Profile — form displays with Watar Partners data
4. Click Branding — logo placeholders, color picker, email footer
5. Click Roles & Access — user table with role badges, Invite User button
6. Click "Invite User" — 3-step dialog works
7. Click avatar dropdown → "My Account" — profile page with personal info
8. Navigate to `/home/account/security` — password and 2FA settings
9. Click "Back to Home" in admin sidebar — returns to global view
10. Navigate to `/home/deals` — sidebar morphs to Deals module view

- [ ] **Step 4: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat: wire up Administration and My Account routes"
```

---

## Task 15: Add .superpowers to .gitignore

**Files:**
- Modify: `client/.gitignore` or root `.gitignore`

- [ ] **Step 1: Add .superpowers to gitignore**

Add this line to the root `.gitignore`:

```
.superpowers/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add .superpowers to gitignore"
```

---

## Verification

After all tasks are complete:

1. **Build check**: `cd client && pnpm build` — should pass with zero errors
2. **Lint check**: `cd client && pnpm lint` — should pass
3. **Manual test**: `cd client && pnpm dev` — open http://localhost:5173 and verify:
   - Global sidebar shows all sections correctly
   - Clicking a module transitions sidebar to module nav
   - "Back to Home" returns to global view
   - "Your Daily" is pinned at bottom in module views
   - Administration pages load and display mock data
   - Inline editing works on Company Profile and Branding
   - User table shows role badges correctly
   - Invite User dialog flows through all 3 steps
   - My Account shows profile and security pages
   - Avatar dropdown includes "My Account" link
   - Breadcrumbs update correctly for all routes
   - ModuleSwitcher shows Administration as clickable
