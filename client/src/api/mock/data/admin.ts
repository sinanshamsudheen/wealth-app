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
