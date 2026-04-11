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
