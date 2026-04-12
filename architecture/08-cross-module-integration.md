# 08 — Cross-Module Integration

## Principles

1. **Modules are loosely coupled** — no direct imports between module code (frontend or backend)
2. **Integration happens through defined contracts** — not internal implementation details
3. **Graceful degradation** — if a connected module isn't available (standalone mode), the feature degrades or hides, never crashes
4. **Shared entities by ID** — modules reference each other's data by UUID, not by foreign key constraints

## Integration Tiers

### Tier 1: Navigation Links (Weakest Coupling)

One module links to another via URL. No code coupling at all.

```typescript
// In Deals module — link to client in Engage
<Link to={`/home/engage/clients/${deal.clientId}`}>
  View Client Profile
</Link>

// Conditional: only show if Engage module is available
const { moduleAccess } = useAuthStore()
{moduleAccess.includes('engage') && (
  <Link to={`/home/engage/clients/${deal.clientId}`}>
    View in Engage
  </Link>
)}
```

### Tier 2: Shared Events (Medium Coupling)

An event bus enables asynchronous cross-module communication. One module publishes events; another subscribes.

#### Backend Event Bus

```typescript
// platform/events/eventBus.ts
export const eventBus = new EventEmitter()  // or Redis pub/sub for distributed

export interface DomainEvent {
  type: string
  tenantId: string
  payload: unknown
  timestamp: string
  sourceModule: string
}
```

```typescript
// Deals module publishes when a deal closes
eventBus.emit('deal.closed', {
  type: 'deal.closed',
  tenantId: req.user.tenantId,
  payload: { dealId: deal.id, name: deal.name, totalSize: deal.totalSize },
  sourceModule: 'deals',
  timestamp: new Date().toISOString(),
})

// Tools module subscribes to create a task
eventBus.on('deal.closed', async (event: DomainEvent) => {
  await taskService.create({
    tenantId: event.tenantId,
    title: `Follow up on closed deal: ${event.payload.name}`,
    priority: 'high',
    dealId: event.payload.dealId,
  })
})
```

#### Frontend Event Bus (Zustand Middleware or Custom)

```typescript
// shared/events/moduleEvents.ts
type ModuleEventHandler = (payload: unknown) => void
const handlers = new Map<string, Set<ModuleEventHandler>>()

export function publish(event: string, payload: unknown) {
  handlers.get(event)?.forEach(handler => handler(payload))
}

export function subscribe(event: string, handler: ModuleEventHandler) {
  if (!handlers.has(event)) handlers.set(event, new Set())
  handlers.get(event)!.add(handler)
  return () => handlers.get(event)?.delete(handler)
}
```

### Tier 3: Shared Data Contracts (Strongest Coupling)

Typed interfaces for entities that cross module boundaries live in `shared/types/`:

```typescript
// shared/types/cross-module.ts

// A lightweight client reference (not the full Engage client entity)
export interface ClientReference {
  id: string
  name: string
  email: string
  type: 'individual' | 'institutional'
}

// A lightweight deal reference
export interface DealReference {
  id: string
  name: string
  stage: string
  totalSize: number
}

// Used when a module needs to display/link to another module's entity
// without importing that module's internal types
```

Backend equivalent — a shared API endpoint for cross-module lookups:

```typescript
// GET /api/v1/platform/entities/resolve
// Query: { type: 'client', ids: ['uuid1', 'uuid2'] }
// Returns: lightweight references for display purposes
```

## Full Cross-Module Integration Map

All modules are interconnected — every module both consumes and produces data for other modules. The platform is a cohesive mesh, not a hub-and-spoke model.

### Deals <-> Engage

| Integration | Direction | Type | Description |
|------------|-----------|------|-------------|
| Link deal to client | Deals → Engage | Tier 1 (Nav) | Deal page links to client profile in Engage |
| Client context in deal | Deals ← Engage | Tier 3 (Data) | Deal shows client name, AUM, risk profile |
| Client deal history | Engage → Deals | Tier 1 (Nav) | Client profile links to their deals |

### Deals <-> Plan

| Integration | Direction | Type | Description |
|------------|-----------|------|-------------|
| Suitability check | Deals → Plan | Tier 3 (Data) | Verify deal matches client's risk profile |
| Deal in plan context | Plan → Deals | Tier 1 (Nav) | Financial plan references recommended deals |

### Deals <-> Insights

| Integration | Direction | Type | Description |
|------------|-----------|------|-------------|
| Deal performance | Deals → Insights | Tier 2 (Event) | Closed deals feed into performance dashboards |
| Portfolio impact | Deals → Insights | Tier 3 (Data) | Show how deal allocation affects portfolio |
| Deal alerts | Insights → Deals | Tier 2 (Event) | Alert when deal metrics trigger thresholds |

### Deals <-> Tools

| Integration | Direction | Type | Description |
|------------|-----------|------|-------------|
| Deal tasks | Deals → Tools | Tier 2 (Event) | Deal stage changes create follow-up tasks |
| Meeting scheduling | Deals → Tools | Tier 1 (Nav) | Schedule deal meetings from deal page |
| Notifications | Deals → Tools | Tier 2 (Event) | Deal updates trigger notifications to team |

### Engage <-> Plan

| Integration | Direction | Type | Description |
|------------|-----------|------|-------------|
| Client risk profile | Engage → Plan | Tier 3 (Data) | Client profile feeds into risk assessment |
| Plan status on client | Plan → Engage | Tier 3 (Data) | Client profile shows active plan status |
| Client goals | Plan → Engage | Tier 1 (Nav) | Link from client profile to their financial plan |

### Engage <-> Insights

| Integration | Direction | Type | Description |
|------------|-----------|------|-------------|
| Client portfolio data | Engage → Insights | Tier 3 (Data) | Client AUM and holdings feed into reports |
| Client performance | Insights → Engage | Tier 3 (Data) | Performance metrics shown on client profile |
| Client alerts | Insights → Engage | Tier 2 (Event) | Portfolio alerts linked to specific clients |

### Engage <-> Tools

| Integration | Direction | Type | Description |
|------------|-----------|------|-------------|
| Client tasks | Engage → Tools | Tier 2 (Event) | Client interactions generate follow-up tasks |
| Client meetings | Engage → Tools | Tier 1 (Nav) | Schedule meetings from client profile |
| Communication history | Tools → Engage | Tier 3 (Data) | Client profile shows communication log |

### Plan <-> Deals

| Integration | Direction | Type | Description |
|------------|-----------|------|-------------|
| Suitability check | Plan → Deals | Tier 3 (Data) | Verify deal matches client's risk profile and plan |
| Deal in plan context | Deals → Plan | Tier 3 (Data) | Financial plan references allocated deals |

### Plan <-> Insights

| Integration | Direction | Type | Description |
|------------|-----------|------|-------------|
| Plan performance | Plan → Insights | Tier 3 (Data) | Plan goals tracked against actual performance |
| Benchmark data | Insights → Plan | Tier 3 (Data) | Market benchmarks inform plan projections |
| Goal tracking alerts | Insights → Plan | Tier 2 (Event) | Alert when goals are at risk |

### Plan <-> Tools

| Integration | Direction | Type | Description |
|------------|-----------|------|-------------|
| Plan review tasks | Plan → Tools | Tier 2 (Event) | Scheduled plan reviews create tasks |
| Client meeting prep | Plan → Tools | Tier 3 (Data) | Meeting briefs include plan summary |

### Insights <-> Tools

| Integration | Direction | Type | Description |
|------------|-----------|------|-------------|
| Alert notifications | Insights → Tools | Tier 2 (Event) | Portfolio alerts create notifications and tasks |
| Report delivery | Insights → Tools | Tier 2 (Event) | Scheduled reports trigger notifications |
| Report scheduling | Tools → Insights | Tier 1 (Nav) | Task links to scheduled report config |

### Insights <-> Deals

| Integration | Direction | Type | Description |
|------------|-----------|------|-------------|
| Deal performance | Deals → Insights | Tier 2 (Event) | Closed deals feed into performance dashboards |
| Portfolio impact | Deals → Insights | Tier 3 (Data) | Deal allocation affects portfolio analytics |
| Market data | Insights → Deals | Tier 3 (Data) | Market context for deal evaluation |

### Tools <-> Deals

| Integration | Direction | Type | Description |
|------------|-----------|------|-------------|
| Deal tasks | Deals → Tools | Tier 2 (Event) | Deal stage changes create follow-up tasks |
| Meeting scheduling | Deals → Tools | Tier 1 (Nav) | Schedule deal meetings from deal page |
| Notifications | Deals → Tools | Tier 2 (Event) | Deal updates trigger notifications |

## Cross-Module Event Catalog

| Event | Source | Consumers | Description |
|-------|--------|-----------|-------------|
| `client.created` | Engage | Plan, Insights, Tools, Deals | New client added |
| `client.updated` | Engage | Plan, Deals, Insights | Client profile changed |
| `prospect.converted` | Engage | Tools, Plan | Prospect became a client |
| `deal.created` | Deals | Tools, Insights, Engage | New deal sourced |
| `deal.stage_changed` | Deals | Tools, Insights | Deal moved to new stage |
| `deal.closed` | Deals | Insights, Tools, Engage, Plan | Deal completed |
| `deal.allocated` | Deals | Insights, Plan | Deal allocated to client |
| `plan.created` | Plan | Tools, Engage | New financial plan drafted |
| `plan.signed` | Plan | Engage, Insights, Tools | IPS signed by client |
| `plan.goal_at_risk` | Insights | Plan, Tools, Engage | Goal tracking alert |
| `report.generated` | Insights | Tools | Scheduled report ready |
| `alert.triggered` | Insights | Tools, Engage, Deals | Portfolio alert fired |
| `task.assigned` | Tools | (notification) | Task assigned to user |
| `task.completed` | Tools | Engage, Deals | Follow-up task done |
| `meeting.scheduled` | Tools | Engage | Meeting added to calendar |
| `meeting.completed` | Tools | Engage, Plan | Meeting done, notes available |
| `communication.sent` | Tools | Engage | Client communication logged |

## Integration Registry

A declarative map of cross-module links, used by the UI to conditionally render "View in X" buttons:

```typescript
// shared/integration/crossModuleLinks.ts
export const CROSS_MODULE_LINKS = {
  'engage.client': {
    deals: (clientId: string) => `/home/deals?clientId=${clientId}`,
    plan: (clientId: string) => `/home/plan?clientId=${clientId}`,
    insights: (clientId: string) => `/home/insights/clients/${clientId}`,
  },
  'deals.deal': {
    engage: (dealId: string, clientId: string) => `/home/engage/clients/${clientId}`,
    tools: (dealId: string) => `/home/tools/tasks?dealId=${dealId}`,
    insights: (dealId: string) => `/home/insights/deals/${dealId}`,
  },
}
```

This registry is filtered at runtime by the user's `moduleAccess` — links to unlicensed modules are hidden.
