import { create } from 'zustand'

interface User {
  name: string
  email: string
  initials: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  tenantId: string
  login: (username: string, password: string) => boolean
  logout: () => void
}

function deriveUser(input: string): User {
  const trimmed = input.trim()

  // If it looks like an email, extract the name from the local part
  // e.g. "raoof.naushad@asbitech.ai" → "Raoof Naushad"
  // e.g. "raoof_naushad@gmail.com" → "Raoof Naushad"
  let nameParts: string[]
  let email: string

  if (trimmed.includes('@')) {
    email = trimmed.toLowerCase()
    const localPart = email.split('@')[0]
    // Split on dots, underscores, hyphens, or plus signs
    nameParts = localPart.split(/[._\-+]+/).filter(Boolean)
  } else {
    // Treat as a plain name (e.g. "Raoof Naushad" or "raoof")
    nameParts = trimmed.split(/\s+/).filter(Boolean)
    email = `${nameParts.join('.').toLowerCase()}@asbitech.ai`
  }

  // Title-case each word
  const name = nameParts
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

  // Initials from first letter of first and last word (max 2)
  const initials =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()

  return { name, email, initials }
}

function loadStoredUser(): User | null {
  const stored = localStorage.getItem('auth_user')
  if (stored) {
    try {
      return JSON.parse(stored) as User
    } catch {
      return null
    }
  }
  return null
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('auth_token'),
  user: loadStoredUser(),
  tenantId: 'tenant-watar',

  login: (username: string, _password: string) => {
    const user = deriveUser(username)
    localStorage.setItem('auth_token', 'mock-jwt-token')
    localStorage.setItem('auth_user', JSON.stringify(user))
    set({ isAuthenticated: true, user })
    return true
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    set({ isAuthenticated: false, user: null })
  },
}))
