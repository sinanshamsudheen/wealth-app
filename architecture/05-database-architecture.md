# 05 — Database Architecture

## Overview

PostgreSQL is the primary database. Each module owns a logical schema namespace for its tables. Multi-tenancy is enforced via row-level security (RLS) or `tenant_id` foreign keys on every table. Redis serves as the caching and session layer.

## Database Strategy

| Database | Role |
|----------|------|
| **PostgreSQL 16+** | Primary relational store — all business data |
| **Redis 7+** | Session store, API response cache, job queues (BullMQ), pub/sub for events |

## Schema Namespacing

Each module owns a PostgreSQL schema (namespace), keeping tables isolated:

```sql
CREATE SCHEMA admin;     -- Administration module
CREATE SCHEMA engage;    -- Engage CRM module
CREATE SCHEMA plan;      -- Plan module
CREATE SCHEMA tools;     -- Tools & Communication module
CREATE SCHEMA deals;     -- Deals module
CREATE SCHEMA insights;  -- Insights module
CREATE SCHEMA platform;  -- Cross-cutting platform tables (AI, notifications)
CREATE SCHEMA superadmin; -- Platform-level Super Admin tables (NOT tenant-scoped)
```

Benefits:
- Clear ownership — each module team knows which tables they own
- Standalone deployment — only migrate the relevant module schema
- Prevents accidental cross-module table coupling

## Multi-Tenancy

### Strategy: Shared Database, Tenant Isolation via Row-Level Security

All tenants share one database instance. Every table includes a `tenant_id` column, and PostgreSQL Row-Level Security (RLS) policies enforce isolation.

```sql
-- Enable RLS on every business table
ALTER TABLE engage.clients ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see rows for their tenant
CREATE POLICY tenant_isolation ON engage.clients
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

The backend sets the tenant context per request:

```sql
SET LOCAL app.current_tenant = '<tenant-uuid-from-jwt>';
```

### Why RLS over Separate Databases?
- Simpler operations (one database to manage, backup, migrate)
- Efficient for the expected tenant count (hundreds, not millions)
- Schema-per-tenant doesn't scale well with module-based schemas
- RLS provides strong isolation without application-layer bugs

## Core Entity Models

### Administration Schema (`admin`)

```sql
admin.organizations
  id              UUID PRIMARY KEY
  name            VARCHAR(255)
  slug            VARCHAR(100) UNIQUE
  plan            VARCHAR(50)           -- 'starter', 'professional', 'enterprise'
  settings        JSONB                 -- org-level customization
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

admin.users
  id              UUID PRIMARY KEY
  tenant_id       UUID REFERENCES admin.organizations(id)
  email           VARCHAR(255) UNIQUE
  name            VARCHAR(255)
  password_hash   VARCHAR(255)
  avatar_url      TEXT
  status          VARCHAR(20)           -- 'active', 'invited', 'suspended'
  last_login_at   TIMESTAMPTZ
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

admin.roles
  id              UUID PRIMARY KEY
  tenant_id       UUID
  name            VARCHAR(100)          -- 'admin', 'advisor', 'analyst', 'viewer'
  description     TEXT
  is_system       BOOLEAN DEFAULT false -- system roles can't be deleted
  created_at      TIMESTAMPTZ

admin.permissions
  id              UUID PRIMARY KEY
  code            VARCHAR(200) UNIQUE   -- 'module:engage:clients:write'
  description     TEXT
  module          VARCHAR(50)           -- 'engage', 'deals', etc.

admin.role_permissions
  role_id         UUID REFERENCES admin.roles(id)
  permission_id   UUID REFERENCES admin.permissions(id)
  PRIMARY KEY (role_id, permission_id)

admin.user_roles
  user_id         UUID REFERENCES admin.users(id)
  role_id         UUID REFERENCES admin.roles(id)
  PRIMARY KEY (user_id, role_id)

admin.module_access
  id              UUID PRIMARY KEY
  tenant_id       UUID
  module_slug     VARCHAR(50)           -- 'engage', 'deals', etc.
  is_active       BOOLEAN DEFAULT true
  licensed_until  TIMESTAMPTZ           -- license expiry
  created_at      TIMESTAMPTZ

admin.audit_logs
  id              UUID PRIMARY KEY
  tenant_id       UUID
  user_id         UUID
  action          VARCHAR(100)          -- 'user.login', 'client.create', etc.
  resource_type   VARCHAR(100)
  resource_id     UUID
  metadata        JSONB                 -- request details, IP, user agent
  created_at      TIMESTAMPTZ
```

### Engage Schema (`engage`)

```sql
engage.clients
  id              UUID PRIMARY KEY
  tenant_id       UUID
  name            VARCHAR(255)
  email           VARCHAR(255)
  phone           VARCHAR(50)
  type            VARCHAR(20)           -- 'individual', 'institutional'
  status          VARCHAR(20)           -- 'active', 'inactive', 'prospect'
  assigned_to     UUID                  -- advisor user_id
  aum             DECIMAL(20, 2)
  risk_profile    VARCHAR(20)
  tags            TEXT[]
  metadata        JSONB
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

engage.prospects
  id              UUID PRIMARY KEY
  tenant_id       UUID
  name            VARCHAR(255)
  email           VARCHAR(255)
  phone           VARCHAR(50)
  source          VARCHAR(100)          -- 'referral', 'website', 'event'
  pipeline_stage  VARCHAR(50)           -- 'lead', 'qualified', 'proposal', 'negotiation'
  estimated_aum   DECIMAL(20, 2)
  assigned_to     UUID
  notes           TEXT
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

engage.interactions
  id              UUID PRIMARY KEY
  tenant_id       UUID
  client_id       UUID                  -- nullable (could be prospect)
  prospect_id     UUID                  -- nullable
  type            VARCHAR(50)           -- 'call', 'email', 'meeting', 'note'
  subject         VARCHAR(500)
  body            TEXT
  occurred_at     TIMESTAMPTZ
  created_by      UUID
  created_at      TIMESTAMPTZ

engage.pipelines
  id              UUID PRIMARY KEY
  tenant_id       UUID
  name            VARCHAR(255)
  stages          JSONB                 -- ordered list of stage definitions
  is_default      BOOLEAN DEFAULT false
  created_at      TIMESTAMPTZ
```

### Plan Schema (`plan`)

```sql
plan.financial_plans
  id              UUID PRIMARY KEY
  tenant_id       UUID
  client_id       UUID                  -- references engage.clients logically (not FK)
  name            VARCHAR(255)
  status          VARCHAR(20)           -- 'draft', 'active', 'archived'
  plan_data       JSONB                 -- structured plan content
  created_by      UUID
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

plan.risk_profiles
  id              UUID PRIMARY KEY
  tenant_id       UUID
  client_id       UUID
  questionnaire   JSONB                 -- IPQ responses
  risk_score      INTEGER               -- 1-10 scale
  risk_category   VARCHAR(50)           -- 'conservative', 'moderate', 'aggressive'
  assessed_at     TIMESTAMPTZ
  assessed_by     UUID
  created_at      TIMESTAMPTZ

plan.ips_documents
  id              UUID PRIMARY KEY
  tenant_id       UUID
  client_id       UUID
  plan_id         UUID
  version         INTEGER
  content         JSONB                 -- IPS document content
  status          VARCHAR(20)           -- 'draft', 'signed', 'active'
  signed_at       TIMESTAMPTZ
  created_at      TIMESTAMPTZ

plan.goals
  id              UUID PRIMARY KEY
  tenant_id       UUID
  client_id       UUID
  plan_id         UUID
  name            VARCHAR(255)
  target_amount   DECIMAL(20, 2)
  target_date     DATE
  priority        INTEGER
  status          VARCHAR(20)           -- 'on_track', 'at_risk', 'achieved'
  created_at      TIMESTAMPTZ
```

### Deals Schema (`deals`)

```sql
deals.deals
  id              UUID PRIMARY KEY
  tenant_id       UUID
  name            VARCHAR(255)
  description     TEXT
  deal_type       VARCHAR(50)           -- 'equity', 'fixed_income', 'real_estate', 'alternative'
  stage           VARCHAR(50)           -- 'sourced', 'evaluating', 'due_diligence', 'committed', 'closed'
  total_size      DECIMAL(20, 2)
  currency        VARCHAR(3) DEFAULT 'USD'
  source          VARCHAR(100)
  lead_manager    UUID
  metadata        JSONB
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ
  closed_at       TIMESTAMPTZ

deals.evaluations
  id              UUID PRIMARY KEY
  tenant_id       UUID
  deal_id         UUID REFERENCES deals.deals(id)
  evaluated_by    UUID
  score           DECIMAL(5, 2)
  criteria        JSONB                 -- structured evaluation criteria and scores
  recommendation  VARCHAR(20)           -- 'strong_buy', 'buy', 'hold', 'pass'
  notes           TEXT
  created_at      TIMESTAMPTZ

deals.allocations
  id              UUID PRIMARY KEY
  tenant_id       UUID
  deal_id         UUID REFERENCES deals.deals(id)
  client_id       UUID                  -- references engage.clients logically
  amount          DECIMAL(20, 2)
  status          VARCHAR(20)           -- 'proposed', 'committed', 'funded'
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

deals.deal_documents
  id              UUID PRIMARY KEY
  tenant_id       UUID
  deal_id         UUID REFERENCES deals.deals(id)
  name            VARCHAR(500)
  file_url        TEXT
  document_type   VARCHAR(50)           -- 'term_sheet', 'prospectus', 'due_diligence', 'legal'
  uploaded_by     UUID
  created_at      TIMESTAMPTZ
```

### Insights Schema (`insights`)

```sql
insights.reports
  id              UUID PRIMARY KEY
  tenant_id       UUID
  name            VARCHAR(255)
  type            VARCHAR(50)           -- 'portfolio', 'performance', 'risk', 'compliance'
  config          JSONB                 -- report parameters, filters, layout
  created_by      UUID
  is_scheduled    BOOLEAN DEFAULT false
  schedule_cron   VARCHAR(100)
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

insights.dashboards
  id              UUID PRIMARY KEY
  tenant_id       UUID
  name            VARCHAR(255)
  layout          JSONB                 -- widget positions and configurations
  is_default      BOOLEAN DEFAULT false
  created_by      UUID
  created_at      TIMESTAMPTZ

insights.alerts
  id              UUID PRIMARY KEY
  tenant_id       UUID
  name            VARCHAR(255)
  condition       JSONB                 -- alert trigger conditions
  severity        VARCHAR(20)           -- 'info', 'warning', 'critical'
  is_active       BOOLEAN DEFAULT true
  last_triggered  TIMESTAMPTZ
  created_by      UUID
  created_at      TIMESTAMPTZ

insights.data_sources
  id              UUID PRIMARY KEY
  tenant_id       UUID
  name            VARCHAR(255)
  type            VARCHAR(50)           -- 'market_data', 'portfolio', 'custodian', 'benchmark'
  connection      JSONB                 -- encrypted connection details
  sync_frequency  VARCHAR(50)           -- 'real_time', 'hourly', 'daily'
  last_synced_at  TIMESTAMPTZ
  status          VARCHAR(20)           -- 'connected', 'error', 'paused'
  created_at      TIMESTAMPTZ
```

### Tools & Communication Schema (`tools`)

```sql
tools.tasks
  id              UUID PRIMARY KEY
  tenant_id       UUID
  title           VARCHAR(500)
  description     TEXT
  assignee_id     UUID
  client_id       UUID                  -- optional link to client
  deal_id         UUID                  -- optional link to deal
  priority        VARCHAR(20)           -- 'low', 'medium', 'high', 'urgent'
  status          VARCHAR(20)           -- 'todo', 'in_progress', 'done', 'cancelled'
  due_date        TIMESTAMPTZ
  created_by      UUID
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

tools.meetings
  id              UUID PRIMARY KEY
  tenant_id       UUID
  title           VARCHAR(500)
  description     TEXT
  start_time      TIMESTAMPTZ
  end_time        TIMESTAMPTZ
  location        VARCHAR(500)
  meeting_url     TEXT
  client_id       UUID
  attendees       UUID[]
  status          VARCHAR(20)           -- 'scheduled', 'completed', 'cancelled'
  brief           JSONB                 -- AI-generated meeting brief
  created_by      UUID
  created_at      TIMESTAMPTZ

tools.communications
  id              UUID PRIMARY KEY
  tenant_id       UUID
  type            VARCHAR(20)           -- 'email', 'sms', 'letter'
  subject         VARCHAR(500)
  body            TEXT
  recipient_id    UUID                  -- client or prospect
  status          VARCHAR(20)           -- 'draft', 'sent', 'delivered', 'failed'
  sent_at         TIMESTAMPTZ
  created_by      UUID
  created_at      TIMESTAMPTZ

tools.notifications
  id              UUID PRIMARY KEY
  tenant_id       UUID
  user_id         UUID
  type            VARCHAR(50)           -- 'task_assigned', 'deal_updated', 'alert_triggered'
  title           VARCHAR(500)
  body            TEXT
  source_module   VARCHAR(50)
  source_id       UUID
  is_read         BOOLEAN DEFAULT false
  created_at      TIMESTAMPTZ
```

### Platform Schema (`platform`)

```sql
platform.ai_conversations
  id              UUID PRIMARY KEY
  tenant_id       UUID
  user_id         UUID
  module_context  VARCHAR(50)           -- which module the chat was in
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

platform.ai_messages
  id              UUID PRIMARY KEY
  conversation_id UUID REFERENCES platform.ai_conversations(id)
  role            VARCHAR(20)           -- 'user', 'assistant', 'system', 'tool'
  content         TEXT
  tool_calls      JSONB
  model           VARCHAR(100)
  tokens_used     INTEGER
  created_at      TIMESTAMPTZ

platform.agent_runs
  id              UUID PRIMARY KEY
  tenant_id       UUID
  agent_id        VARCHAR(100)
  status          VARCHAR(20)           -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  input           JSONB
  output          JSONB
  steps           JSONB
  started_at      TIMESTAMPTZ
  completed_at    TIMESTAMPTZ
  created_by      UUID
  created_at      TIMESTAMPTZ
```

### Super Admin Schema (`superadmin`)

These tables are **NOT tenant-scoped** — they manage the platform itself and are only accessible via the Super Admin API.

```sql
superadmin.platform_admins
  id              UUID PRIMARY KEY
  email           VARCHAR(255) UNIQUE
  name            VARCHAR(255)
  password_hash   VARCHAR(255)
  role            VARCHAR(50)           -- 'super_admin', 'support', 'billing'
  status          VARCHAR(20)           -- 'active', 'suspended'
  last_login_at   TIMESTAMPTZ
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

superadmin.organization_subscriptions
  id              UUID PRIMARY KEY
  organization_id UUID REFERENCES admin.organizations(id)
  plan            VARCHAR(50)           -- 'starter', 'professional', 'enterprise'
  status          VARCHAR(20)           -- 'active', 'trial', 'suspended', 'cancelled'
  trial_ends_at   TIMESTAMPTZ
  current_period_start TIMESTAMPTZ
  current_period_end   TIMESTAMPTZ
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

superadmin.feature_flags
  id              UUID PRIMARY KEY
  key             VARCHAR(200) UNIQUE   -- 'ai.agent_runtime', 'deals.bulk_import', etc.
  description     TEXT
  enabled_global  BOOLEAN DEFAULT false -- global toggle
  enabled_orgs    UUID[]                -- specific org IDs (overrides global)
  disabled_orgs   UUID[]                -- specific org IDs (overrides global)
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

superadmin.platform_metrics
  id              UUID PRIMARY KEY
  metric_type     VARCHAR(100)          -- 'daily_active_users', 'total_aum', 'api_calls'
  value           JSONB                 -- { count: 1234, breakdown: {...} }
  recorded_at     DATE
  created_at      TIMESTAMPTZ

superadmin.platform_announcements
  id              UUID PRIMARY KEY
  title           VARCHAR(500)
  body            TEXT
  type            VARCHAR(20)           -- 'info', 'warning', 'maintenance'
  target_orgs     UUID[]                -- null = all orgs
  active_from     TIMESTAMPTZ
  active_until    TIMESTAMPTZ
  created_by      UUID REFERENCES superadmin.platform_admins(id)
  created_at      TIMESTAMPTZ

superadmin.platform_audit_logs
  id              UUID PRIMARY KEY
  admin_id        UUID REFERENCES superadmin.platform_admins(id)
  action          VARCHAR(100)          -- 'org.create', 'org.suspend', 'feature_flag.toggle'
  resource_type   VARCHAR(100)
  resource_id     UUID
  metadata        JSONB
  created_at      TIMESTAMPTZ
```

## Cross-Module Data References

Modules reference entities from other modules by **ID only** — no foreign key constraints across schemas.

```
deals.allocations.client_id  →  engage.clients.id     (logical reference, no FK)
plan.financial_plans.client_id  →  engage.clients.id   (logical reference, no FK)
tools.tasks.deal_id  →  deals.deals.id                 (logical reference, no FK)
```

This ensures modules can be deployed independently. Referential integrity across modules is enforced at the **application layer**, not the database layer.

## ORM: SQLAlchemy 2.0

### Base Model

All models inherit from a shared base with common columns:

```python
# server/app/database/base.py
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4

class Base(DeclarativeBase):
    pass

class TenantMixin:
    """Adds tenant_id to every business table for RLS."""
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

class TimestampMixin:
    """Adds created_at and updated_at timestamps."""
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

### Async Session

```python
# server/app/database/session.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

engine = create_async_engine(settings.database_url, echo=False)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)
```

## Migration Strategy

- Use **Alembic** for schema versioning, configured in `server/alembic.ini`
- Alembic auto-generates migrations from SQLAlchemy model changes: `alembic revision --autogenerate -m "description"`
- Migrations live in `server/app/database/migrations/versions/`
- Each migration file includes the module context in its description for traceability
- Seed scripts live in `server/scripts/seed_<module>.py`

## Indexing Strategy

Every table should have indexes on:
- `tenant_id` — always filtered in queries
- `created_at` — for sorting and pagination
- Frequently queried columns (e.g., `status`, `assigned_to`, `client_id`)

Composite indexes for common query patterns:
```sql
CREATE INDEX idx_clients_tenant_status ON engage.clients(tenant_id, status);
CREATE INDEX idx_deals_tenant_stage ON deals.deals(tenant_id, stage);
CREATE INDEX idx_tasks_tenant_assignee ON tools.tasks(tenant_id, assignee_id, status);
```
