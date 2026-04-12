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
