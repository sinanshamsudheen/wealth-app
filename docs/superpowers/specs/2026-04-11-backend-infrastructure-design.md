# Backend Infrastructure & Administration Module — Design Spec

## Goal

Stand up the backend infrastructure (FastAPI + PostgreSQL + Redis + Celery) with the Administration module and Account endpoints, enabling the existing frontend to talk to a real API instead of MSW mocks.

## Scope

### In Scope
- Project scaffolding (FastAPI app, Docker Compose for Postgres/Redis, Alembic migrations)
- Auth system (JWT access/refresh tokens, login/logout/refresh, bcrypt passwords)
- Tenant context middleware + Row Level Security (RLS)
- Admin module: org profile, branding, preferences, users, invitations CRUD
- Account module: profile, password change
- Celery workers + Redis broker for background tasks
- Email sending via Resend (invitations, future password reset)
- Seed script with same data MSW currently uses
- Permission checking (3 roles: Owner, Manager, Analyst per module)
- Frontend Vite proxy config to connect to backend in dev
- Structured logging (structlog)
- Rate limiting (Redis-based)

### Out of Scope (Future Phases)
- Engage, Plan, Deals, Insights, Tools modules
- AI/Platform services (chat, agents, runs)
- WebSocket/SSE real-time features
- Super Admin panel (platform-level admin at admin.invictus.ai)
- File/image uploads to cloud storage (logos stored as data URLs for now)
- MFA/2FA
- Password reset flow (task is ready but no frontend wiring)

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.12+ | Runtime |
| FastAPI | latest | Async HTTP framework |
| Pydantic v2 | latest | Validation, settings, schemas |
| SQLAlchemy | 2.0 (async) | ORM with asyncpg driver |
| Alembic | latest | Database migrations |
| PostgreSQL | 16+ | Primary database |
| Redis | 7+ | Cache, sessions, Celery broker |
| Celery | 5.x | Background task processing |
| uvicorn | latest | ASGI server |
| python-jose | latest | JWT creation/verification |
| passlib + bcrypt | latest | Password hashing |
| resend | latest | Email delivery |
| structlog | latest | Structured logging |
| httpx | latest | Async HTTP client |
| Ruff | latest | Linting and formatting |
| pytest + pytest-asyncio | latest | Testing |

---

## Directory Structure

```
server/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app factory, middleware, lifespan
│   ├── config.py                  # Pydantic Settings (env-based config)
│   ├── database/
│   │   ├── __init__.py
│   │   ├── session.py             # Async engine, sessionmaker, get_db dependency
│   │   ├── base.py                # DeclarativeBase, TenantMixin, TimestampMixin
│   │   └── migrations/
│   │       ├── env.py             # Alembic async env
│   │       └── versions/          # Migration files
│   ├── shared/
│   │   ├── __init__.py
│   │   ├── dependencies.py        # get_current_user, require_role, get_tenant_context
│   │   ├── exceptions.py          # AppException + FastAPI exception handlers
│   │   ├── schemas.py             # SuccessResponse, ErrorResponse, PaginatedResponse envelopes
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   ├── tenant_context.py  # Sets RLS tenant per request
│   │   │   ├── request_logging.py # structlog request/response logging
│   │   │   └── rate_limit.py      # Redis-based rate limiting
│   │   └── utils.py               # Pagination helpers, etc.
│   ├── modules/
│   │   └── admin/
│   │       ├── __init__.py
│   │       ├── router.py          # All admin routes (org, branding, prefs, users, invitations)
│   │       ├── service.py         # Business logic
│   │       ├── repository.py      # DB queries
│   │       ├── models.py          # SQLAlchemy ORM models
│   │       └── schemas.py         # Pydantic request/response schemas
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── router.py              # Login, refresh, logout
│   │   ├── service.py             # JWT creation, password verification
│   │   ├── models.py              # RefreshToken model
│   │   └── schemas.py             # LoginRequest, TokenResponse
│   ├── account/
│   │   ├── __init__.py
│   │   ├── router.py              # Profile, password change
│   │   ├── service.py             # Profile update logic
│   │   └── schemas.py             # ProfileResponse, UpdateProfileRequest, ChangePasswordRequest
│   └── tasks/
│       ├── __init__.py
│       ├── celery_app.py          # Celery config, autodiscover
│       ├── email.py               # send_invitation_email, send_password_reset_email
│       └── audit.py               # write_audit_log task
├── scripts/
│   ├── seed.py                    # Populate DB with test data (mirrors MSW mock data)
│   └── create_schemas.py          # Create PostgreSQL schemas (admin, platform)
├── tests/
│   ├── conftest.py                # Fixtures: async test client, test DB, test user
│   ├── unit/
│   │   └── ...
│   └── integration/
│       └── ...
├── docker-compose.yml             # PostgreSQL 16 + Redis 7
├── pyproject.toml                 # Dependencies, ruff config, pytest config
├── alembic.ini                    # Alembic configuration
├── .env.example                   # Template environment variables
└── README.md                      # Setup instructions
```

---

## Database Schema

### PostgreSQL Schemas
- `admin` — Administration module tables
- `platform` — Auth/session tables (shared infrastructure)

### Tables

#### `admin.organizations`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, default gen_random_uuid() |
| name | VARCHAR(255) | NOT NULL |
| registration_number | VARCHAR(100) | nullable |
| website | VARCHAR(255) | nullable |
| currency | VARCHAR(10) | default 'USD' |
| timezone | VARCHAR(50) | default 'UTC' |
| support_email | VARCHAR(255) | nullable |
| status | VARCHAR(20) | 'active' or 'suspended', default 'active' |
| address | JSONB | { line1, line2, city, state, postalCode, country } |
| created_at | TIMESTAMPTZ | default now() |
| updated_at | TIMESTAMPTZ | auto-updated |

#### `admin.users`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → organizations, NOT NULL, indexed |
| email | VARCHAR(255) | NOT NULL |
| password_hash | VARCHAR(255) | nullable (null for invited users) |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| phone | VARCHAR(50) | nullable |
| address | JSONB | nullable |
| status | VARCHAR(20) | 'active', 'invited', 'suspended' |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

Unique constraint: `(tenant_id, email)`

#### `admin.user_module_roles`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → organizations, NOT NULL |
| user_id | UUID | FK → users, NOT NULL |
| module_slug | VARCHAR(20) | enum: admin, deals, engage, plan, insights, tools |
| role | VARCHAR(20) | enum: owner, manager, analyst |
| created_at | TIMESTAMPTZ | |

Unique constraint: `(tenant_id, user_id, module_slug)`

#### `admin.org_branding`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → organizations, UNIQUE (one per org) |
| header_logo | VARCHAR(10) | 'small' or 'large' |
| brand_color | VARCHAR(10) | hex color, default '#000000' |
| email_footer | TEXT | nullable |
| small_logo_url | TEXT | nullable (data URL or future CDN URL) |
| large_logo_url | TEXT | nullable |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `admin.org_preferences`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → organizations, UNIQUE |
| date_format | VARCHAR(20) | default 'MM/DD/YYYY' |
| number_format | VARCHAR(20) | default 'en-US' |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `admin.invitations`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → organizations |
| email | VARCHAR(255) | NOT NULL |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| module_roles | JSONB | array of { moduleSlug, role } |
| status | VARCHAR(20) | 'pending', 'accepted', 'cancelled' |
| invited_by | UUID | FK → users |
| expires_at | TIMESTAMPTZ | default now() + 7 days |
| created_at | TIMESTAMPTZ | |

#### `admin.audit_logs`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | indexed |
| user_id | UUID | nullable (system actions) |
| action | VARCHAR(100) | dot-notation e.g. 'user.create', 'branding.update' |
| resource_type | VARCHAR(50) | e.g. 'user', 'organization', 'invitation' |
| resource_id | UUID | nullable |
| metadata | JSONB | { ip, user_agent, changes } |
| created_at | TIMESTAMPTZ | indexed |

#### `platform.refresh_tokens`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → admin.users, indexed |
| token_hash | VARCHAR(255) | SHA-256 hash of refresh token (fast hash — token is already high-entropy) |
| expires_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| revoked_at | TIMESTAMPTZ | nullable (null = active) |

### Row Level Security

Every table with `tenant_id` gets RLS:
```sql
ALTER TABLE admin.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON admin.users
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

The `TenantContextMiddleware` executes `SET LOCAL app.current_tenant = '<uuid>'` at the start of each DB session within a request. Since `SET LOCAL` is transaction-scoped, it automatically clears when the request ends.

### Indexes
- Every `tenant_id` column: B-tree index
- `admin.users`: composite `(tenant_id, email)`, `(tenant_id, status)`
- `admin.audit_logs`: composite `(tenant_id, created_at DESC)`
- `platform.refresh_tokens`: `(user_id, revoked_at)` for active token lookups

---

## Auth System

### Flow

1. **Login** — `POST /api/v1/auth/login`
   - Validates email + password against bcrypt hash
   - Generates JWT access token (1hr expiry)
   - Generates refresh token (30 days), hashes it, stores in `platform.refresh_tokens`
   - Returns access token in response body, refresh token as httpOnly secure cookie
   - Note: login does NOT use RLS (queries by email across tenants using a service-level DB session)

2. **Refresh** — `POST /api/v1/auth/refresh`
   - Reads refresh token from httpOnly cookie
   - Validates hash against DB, checks not revoked, checks not expired
   - Rotates: revokes old token, issues new refresh token + new access token
   - Token rotation prevents replay attacks

3. **Logout** — `POST /api/v1/auth/logout`
   - Revokes refresh token (sets `revoked_at`)
   - Client discards access token from memory

### JWT Access Token Payload
```json
{
  "sub": "user-uuid",
  "tenant_id": "org-uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "module_roles": {
    "admin": "owner",
    "deals": "manager",
    "engage": "manager",
    "insights": "analyst"
  },
  "exp": 1712880000,
  "iat": 1712876400
}
```

### Permission Checking

FastAPI dependency pattern:
```python
@router.get("/admin/users")
async def list_users(
    user=Depends(require_role(module="admin", roles=["owner", "manager", "analyst"])),
    db=Depends(get_db),
):
    ...

@router.put("/admin/users/{user_id}")
async def update_user(
    user=Depends(require_role(module="admin", roles=["owner", "manager"])),
    ...
):
    ...
```

Permission rules:
- All `/api/v1/admin/*` — requires any role in `admin` module
- Write operations (PUT/DELETE on users, org, branding) — requires `admin: owner` or `admin: manager`
- `/api/v1/account/*` — requires any authenticated user (no module role check)

---

## API Endpoints

All responses use the standard envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "request_id": "uuid" }
}
```

Error responses:
```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "User not found", "details": null },
  "meta": { "request_id": "uuid" }
}
```

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/v1/auth/login | None | Login with email + password |
| POST | /api/v1/auth/refresh | Cookie | Rotate refresh token, get new access token |
| POST | /api/v1/auth/logout | Bearer | Revoke refresh token |

### Admin — Organization
| Method | Path | Role Required | Description |
|---|---|---|---|
| GET | /api/v1/admin/organization | admin: any | Get org profile |
| PUT | /api/v1/admin/organization | admin: owner/manager | Update org profile |

### Admin — Branding
| Method | Path | Role Required | Description |
|---|---|---|---|
| GET | /api/v1/admin/branding | admin: any | Get branding settings |
| PUT | /api/v1/admin/branding | admin: owner/manager | Update branding |

### Admin — Preferences
| Method | Path | Role Required | Description |
|---|---|---|---|
| GET | /api/v1/admin/preferences | admin: any | Get org preferences |
| PUT | /api/v1/admin/preferences | admin: owner/manager | Update preferences |

### Admin — Users
| Method | Path | Role Required | Description |
|---|---|---|---|
| GET | /api/v1/admin/users | admin: any | List all org users |
| GET | /api/v1/admin/users/:id | admin: any | Get user details |
| PUT | /api/v1/admin/users/:id | admin: owner/manager | Update user roles/status |
| DELETE | /api/v1/admin/users/:id | admin: owner | Remove user from org |

### Admin — Invitations
| Method | Path | Role Required | Description |
|---|---|---|---|
| GET | /api/v1/admin/invitations | admin: any | List pending invitations |
| POST | /api/v1/admin/invitations | admin: owner/manager | Send invitation (triggers email) |
| DELETE | /api/v1/admin/invitations/:id | admin: owner/manager | Cancel invitation |

### Account
| Method | Path | Role Required | Description |
|---|---|---|---|
| GET | /api/v1/account/profile | authenticated | Get own profile |
| PUT | /api/v1/account/profile | authenticated | Update own profile |
| PUT | /api/v1/account/password | authenticated | Change password |

---

## Celery & Background Tasks

### Configuration
- Broker: Redis DB 1 (`redis://localhost:6379/1`)
- Result backend: Redis DB 2 (`redis://localhost:6379/2`)
- Task serializer: JSON
- Queues: `default`, `email`
- Task acknowledgment: late (ack after task completes, not before)

### Tasks

#### `tasks.email.send_invitation_email`
- Queue: `email`
- Triggered by: `POST /api/v1/admin/invitations` (after DB insert)
- Payload: invitation_id, org_name, inviter_name, invitee_email, invitee_name, module_roles
- Action: Sends invitation email via Resend SDK
- Retry: 3 attempts, exponential backoff (10s, 60s, 300s)
- Dev mode: Logs email content to console when `EMAIL_DRY_RUN=true`

#### `tasks.email.send_password_reset_email`
- Queue: `email`
- Not wired to any endpoint in v1 (ready for future use)
- Payload: user_id, email, reset_token

#### `tasks.audit.write_audit_log`
- Queue: `default`
- Triggered by: service layer after mutations
- Payload: tenant_id, user_id, action, resource_type, resource_id, metadata
- Action: Inserts row into `admin.audit_logs`
- No retry (audit logs are best-effort, not critical path)

### Resend Integration
```python
import resend

resend.api_key = settings.RESEND_API_KEY

def send_email(to: str, subject: str, html: str):
    if settings.EMAIL_DRY_RUN:
        logger.info("DRY RUN email", to=to, subject=subject)
        return
    resend.Emails.send({
        "from": settings.EMAIL_FROM,
        "to": to,
        "subject": subject,
        "html": html,
    })
```

Email templates: plain Python f-strings generating HTML. No template engine in v1.

---

## Development Setup

### Docker Compose
```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: invictus
      POSTGRES_USER: invictus
      POSTGRES_PASSWORD: invictus_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  postgres_data:
```

### Commands
```bash
# Start infrastructure
docker compose up -d

# Install Python dependencies
cd server
pip install -e ".[dev]"

# Create PostgreSQL schemas
python scripts/create_schemas.py

# Run migrations
alembic upgrade head

# Seed test data
python scripts/seed.py

# Start API server (auto-reload)
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A app.tasks.celery_app worker --loglevel=info -Q default,email
```

### Frontend Proxy (vite.config.ts)
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

### MSW Toggle
- Add `VITE_USE_REAL_API=true` to `.env.development`
- Modify `main.tsx`: only start MSW worker when `VITE_USE_REAL_API` is not `'true'`
- This allows gradual migration — MSW still works for endpoints not yet in the backend

### Environment Variables (.env)
```
DATABASE_URL=postgresql+asyncpg://invictus:invictus_dev@localhost:5432/invictus
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
JWT_SECRET_KEY=dev-secret-change-in-prod
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30
RESEND_API_KEY=re_dev_xxx
EMAIL_FROM=noreply@invictus.ai
EMAIL_DRY_RUN=true
CORS_ORIGINS=http://localhost:5173
```

---

## Seed Data

The seed script creates data matching the current MSW mocks exactly:

**Organization:**
- Watar Partners (active, USD, Asia/Dubai timezone)

**Users:**
| Name | Email | Status | Module Roles |
|---|---|---|---|
| Usman Al-Rashid | usman@watar.com | active | admin: owner, deals: owner, engage: owner, plan: owner, insights: owner, tools: owner |
| Pine Anderson | pine@watar.com | active | deals: manager, engage: manager, insights: manager |
| John Smith | john@watar.com | active | deals: analyst, engage: analyst, insights: analyst |
| Sarah Johnson | sarah@watar.com | invited | deals: analyst |
| Raoof Naushad | raoof@watar.com | active | admin: owner, deals: manager, engage: manager, insights: analyst |

**Default login:** `raoof@watar.com` / `password123` (for dev only)

**Branding:** header_logo=small, brand_color=#1E3A5F, email_footer="Watar Partners..."
**Preferences:** date_format=DD/MM/YYYY, number_format=en-US
**Invitations:** 2 pending (alex@example.com, maria@example.com)

---

## Frontend Changes Required

Minimal changes to connect frontend to real backend:

1. **`vite.config.ts`** — Add `/api` proxy to `http://localhost:8000`
2. **`src/main.tsx`** — Conditionally skip MSW when `VITE_USE_REAL_API=true`
3. **`src/store/useAuthStore.ts`** — Update login to call `/api/v1/auth/login`, store access token, handle refresh flow
4. **`src/api/client.ts`** — Already handles Bearer token injection (no change needed)
5. **`src/api/endpoints.ts`** — Verify URL paths match backend (current MSW paths use `/api/admin/...` without version prefix — need to align to `/api/v1/admin/...`)

---

## Key Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| RBAC roles | 3 per module (Owner/Manager/Analyst) | Matches frontend, simple, sufficient |
| Password hashing | bcrypt via passlib | Industry standard, battle-tested |
| Dev dependencies | Docker Compose (Postgres + Redis only) | App runs natively for fast iteration |
| Data strategy | Real DB + seed script | Mirrors MSW data, enables full E2E |
| Email provider | Resend | Modern DX, simple Python SDK |
| Background tasks | Celery + Redis | Proven stack, handles email + audit async |
| Multi-tenancy | Shared DB + RLS | Single DB, strong isolation, PostgreSQL-native |
| Token storage | Access in memory, refresh in httpOnly cookie | Secure against XSS |
