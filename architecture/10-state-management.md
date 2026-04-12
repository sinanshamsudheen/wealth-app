# 10 — State Management

## Frontend State (Zustand)

### Store Hierarchy

```
Global Stores (client/src/store/)
  ├── useAuthStore.ts       # Auth state, user profile, permissions, module access
  └── useThemeStore.ts      # Theme mode (light/dark), accent color

Platform Stores (client/src/platform/*/store/)
  ├── useChatStore.ts       # Chat UI state: conversations, messages, streaming tokens (data from backend API)
  ├── useAgentStore.ts      # Agent UI state: agent list, configurations (data from backend API)
  └── useRunStore.ts        # Run UI state: run history, active runs, steps (updates via WebSocket)

Module Stores (client/src/modules/*/store/)
  ├── useEngageStore.ts     # Clients, prospects, pipelines, interactions
  ├── usePlanStore.ts       # Financial plans, risk profiles, IPS documents
  ├── useToolsStore.ts      # Tasks, meetings, communications, notifications
  ├── useDealsStore.ts      # Deals, evaluations, allocations
  ├── useInsightsStore.ts   # Reports, dashboards, alerts, data sources
  └── useAdminStore.ts      # Users, roles, permissions, org settings
```

### Store Rules

1. **Module stores never read from other module stores** — use the event bus or shared API
2. **All stores can read from global stores** (auth, theme)
3. **Module stores can read from platform stores** (chat, agents) when needed
4. **Each store manages its own loading/error state** for its data

### Zustand Conventions

```typescript
// Standard store pattern
interface EngageState {
  // Data
  clients: Client[]
  selectedClient: Client | null

  // Loading states
  isLoadingClients: boolean
  clientsError: string | null

  // Actions
  fetchClients: () => Promise<void>
  selectClient: (id: string) => void
  createClient: (data: CreateClientData) => Promise<Client>
  updateClient: (id: string, data: UpdateClientData) => Promise<Client>
}

export const useEngageStore = create<EngageState>((set, get) => ({
  clients: [],
  selectedClient: null,
  isLoadingClients: false,
  clientsError: null,

  fetchClients: async () => {
    set({ isLoadingClients: true, clientsError: null })
    try {
      const clients = await engageApi.getClients()
      set({ clients, isLoadingClients: false })
    } catch (error) {
      set({ clientsError: error.message, isLoadingClients: false })
    }
  },

  selectClient: (id) => {
    const client = get().clients.find(c => c.id === id) ?? null
    set({ selectedClient: client })
  },

  // ...
}))
```

### Auth Store (Enhanced)

The auth store is the most critical global store. Target state:

```typescript
interface AuthState {
  // Auth
  isAuthenticated: boolean
  accessToken: string | null
  user: User | null

  // RBAC
  permissions: string[]
  moduleAccess: string[]         // licensed module slugs
  roles: string[]

  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>

  // Permission helpers
  hasPermission: (permission: string) => boolean
  hasModuleAccess: (moduleSlug: string) => boolean
}
```

## Backend State

### Stateless Services (FastAPI)

Backend services are **stateless** — all state lives in the database or Redis. No in-memory state is shared between requests (except connection pools and the SQLAlchemy async engine). FastAPI's dependency injection provides fresh DB sessions per request.

### Session State

- **JWT tokens** are stateless (self-contained claims), verified via `python-jose` / `PyJWT`
- **Refresh tokens** stored in PostgreSQL (`admin.refresh_tokens` table)
- **Session metadata** (last activity, device info) stored in Redis with TTL

## Caching Strategy

### Frontend Caching

| Layer | Tool | Use Case |
|-------|------|----------|
| **In-memory** | Zustand stores | Active page data, user profile |
| **HTTP cache** | Browser cache + `Cache-Control` headers | Static assets, rarely-changing API data |
| **API data cache** | React Query / SWR (future) | Server state with auto-revalidation |

For now, Zustand stores handle all frontend state. When the backend is built, consider adding **React Query** (TanStack Query) for server state management — it handles caching, revalidation, and background refetching automatically.

### Backend Caching (Redis)

| Cache Type | Key Pattern | TTL | Purpose |
|-----------|-------------|-----|---------|
| User session | `session:<userId>` | 30m | Active session metadata |
| User permissions | `perms:<userId>` | 5m | Cached RBAC permissions |
| API response | `api:<tenantId>:<endpoint>:<hash>` | 1-5m | Frequently-read list endpoints |
| Rate limit counters | `ratelimit:<userId>:<endpoint>` | 1m | Request counting |
| Report cache | `report:<tenantId>:<reportId>:<hash>` | 15m | Generated report data |

### Cache Invalidation

- **Write-through**: update cache immediately after database write
- **TTL-based**: caches expire automatically, reloaded on next read
- **Event-driven**: cross-module events trigger cache invalidation for affected modules

## Real-Time State Sync

### WebSocket Channels

Real-time updates are delivered via Socket.IO:

```typescript
// Client connects to WebSocket on login
const socket = io(WS_URL, {
  auth: { token: accessToken },
})

// Subscribe to relevant channels
socket.on('notification', (data) => {
  useToolsStore.getState().addNotification(data)
})

socket.on('agent:run:update', (data) => {
  useRunStore.getState().updateRun(data.runId, data)
})

socket.on('chat:message', (data) => {
  useChatStore.getState().addMessage(data.conversationId, data.message)
})
```

### Server-Sent Events (SSE)

Used specifically for AI chat streaming (token-by-token response):

```typescript
// AI response streaming
const eventSource = new EventSource(`/api/v1/platform/chat/stream?id=${conversationId}`)
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  useChatStore.getState().appendStreamToken(conversationId, data.token)
}
```

## Persistence

| Store | Persisted? | Storage | Notes |
|-------|-----------|---------|-------|
| `useAuthStore` | Yes | `localStorage` | Tokens, user profile (cleared on logout) |
| `useThemeStore` | Yes | `localStorage` | Theme preference |
| Module stores | No | In-memory | Reloaded from API on navigation |
| Platform stores | Partial | In-memory | Chat history loaded from API, not persisted locally |
