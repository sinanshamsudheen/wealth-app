# 11 — Infrastructure & Deployment

## Architecture Overview

```
                    ┌─────────────┐
                    │   CDN/Edge  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
┌────────▼────────┐ ┌──────▼──────┐ ┌────────▼────────┐
│  Tenant App SPA │ │ Super Admin │ │   Backend API   │
│  app.invictus   │ │ admin.invic │ │  (Containerized)│
│  (Vercel)       │ │ (Vercel)    │ └────────┬────────┘
└─────────────────┘ └─────────────┘          │
                                    ┌────────┼────────────┐
                                    │        │            │
                             ┌──────▼──┐ ┌───▼────┐ ┌────▼──────────┐
                             │PostgreSQL│ │ Redis  │ │ External AI   │
                             │(Managed) │ │(Managed)│ │ Service       │
                             └──────────┘ └────────┘ │ (Separate)    │
                                                      └───────────────┘
```

## Frontend Deployment

There are **two separate frontend SPAs**:

| App | Directory | URL | Purpose |
|-----|-----------|-----|---------|
| **Tenant App** | `client/` | `app.invictus.ai` | Customer-facing wealth management platform |
| **Super Admin Panel** | `superadmin/` | `admin.invictus.ai` | Internal platform management (Invictus team only) |

### Hosting: Vercel

Both SPAs are deployed to Vercel as separate projects with separate domains.

**Tenant App:**
- **Framework**: Vite (static SPA)
- **Build command**: `pnpm build` (runs `tsc -b` then `vite build`)
- **Output directory**: `client/dist`
- **Domain**: `app.invictus.ai`

**Super Admin Panel:**
- **Framework**: Vite (static SPA)
- **Build command**: `pnpm build`
- **Output directory**: `superadmin/dist`
- **Domain**: `admin.invictus.ai`
- **Access**: IP-restricted or VPN-gated — not publicly discoverable

### Deployment Flow

```
git push to branch
  → Vercel detects push
    → Builds preview deployments for both SPAs
    → Builds production deployments (main branch)
      → CDN distribution
        → Tenant app live at app.invictus.ai
        → Super Admin live at admin.invictus.ai
```

### Environment Variables (Frontend)

All must use `VITE_` prefix:

**Tenant App (`client/`):**

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend API URL |
| `VITE_WS_URL` | WebSocket server URL |
| ~~`VITE_ANTHROPIC_API_KEY`~~ | **Removed** — frontend never holds LLM API keys |
| `VITE_ENVIRONMENT` | `development`, `staging`, `production` |

**Super Admin Panel (`superadmin/`):**

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend API URL (same backend, different routes) |
| `VITE_ENVIRONMENT` | `development`, `staging`, `production` |

## Backend Deployment

### Containerization: Docker

```dockerfile
# Multi-stage build for Python/FastAPI
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim AS runner
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Hosting Options

| Option | Best For | Notes |
|--------|----------|-------|
| **AWS ECS / Fargate** | Production at scale | Managed containers, auto-scaling |
| **Google Cloud Run** | Simplicity + scale | Serverless containers |
| **Railway / Render** | Early stage / MVP | Quick setup, managed Postgres + Redis |
| **Fly.io** | Global distribution | Edge-like deployment for containers |

### Environment Variables (Backend)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL async connection string (`postgresql+asyncpg://...`) |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing key |
| `JWT_REFRESH_SECRET` | Refresh token signing key |
| `AI_SERVICE_URL` | External AI service URL |
| `AI_SERVICE_API_KEY` | Service-to-service auth key for AI service |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) |
| `PORT` | Server port (default 8000) |
| `ENVIRONMENT` | `development`, `staging`, `production` |
| `LOG_LEVEL` | structlog log level |

## Database Hosting

### PostgreSQL

| Option | Notes |
|--------|-------|
| **Neon** | Serverless Postgres, auto-scaling, branching (Vercel Marketplace) |
| **Supabase** | Postgres + auth + real-time (Vercel Marketplace) |
| **AWS RDS** | Managed Postgres, production-grade |
| **Google Cloud SQL** | Managed Postgres on GCP |

### Redis

| Option | Notes |
|--------|-------|
| **Upstash** | Serverless Redis, pay-per-request (Vercel Marketplace) |
| **AWS ElastiCache** | Managed Redis on AWS |
| **Redis Cloud** | Managed Redis, multi-cloud |

## CI/CD Pipeline

### Recommended Flow

```
Feature Branch
  → Push
    → Lint (ESLint)
    → Type check (tsc --noEmit)
    → Unit tests (Vitest)
    → Build check (vite build)
    → Preview deployment (Vercel)
  → PR Review
    → Merge to dev

Dev Branch
  → Auto-deploy to staging
    → Integration tests
    → E2E tests (Playwright)
    → Backend: run migrations on staging DB
  → Manual promotion to main

Main Branch
  → Auto-deploy to production
    → Backend: run migrations on prod DB
    → Smoke tests
    → Monitor error rates
```

### GitHub Actions (Target)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: cd client && pnpm install --frozen-lockfile
      - run: cd client && pnpm lint
      - run: cd client && pnpm build
      # - run: cd client && pnpm test    # when Vitest is set up

  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_DB: invictus_test, POSTGRES_PASSWORD: test }
        ports: ['5432:5432']
      redis:
        image: redis:7
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: cd server && pip install -r requirements.txt
      - run: cd server && ruff check .
      - run: cd server && ruff format --check .
      - run: cd server && pytest --cov=app
```

## Environment Strategy

| Environment | Tenant App | Super Admin | Backend | Database | Purpose |
|------------|-----------|-------------|---------|----------|---------|
| **Local** | `localhost:5173` | `localhost:5174` | `localhost:8000` | Local Postgres + Redis | Development |
| **Staging** | `staging.invictus.ai` | `admin-staging.invictus.ai` | `api-staging.invictus.ai` | Staging DB | QA |
| **Production** | `app.invictus.ai` | `admin.invictus.ai` | `api.invictus.ai` | Production DB | Live |

## Monitoring & Observability

### Logging

- **Backend**: structlog (structured JSON logs) → log aggregation service (e.g., Datadog, Grafana Loki)
- **Frontend**: Error boundary catch → error reporting service (e.g., Sentry)

### Metrics

- **Backend**: Prometheus-compatible metrics (request rate, latency, error rate)
- **Frontend**: Core Web Vitals via Vercel Analytics

### Alerting

| Alert | Condition | Severity |
|-------|-----------|----------|
| API error rate > 5% | 5xx responses | Critical |
| Response time p95 > 2s | Latency spike | Warning |
| Database connection pool exhausted | No available connections | Critical |
| Disk usage > 80% | Storage filling up | Warning |
| Auth failure rate spike | Brute force / attack | Critical |

### Health Checks

```
GET /api/health     → { status: 'ok', uptime: 12345 }
GET /api/ready      → { status: 'ready', database: 'ok', redis: 'ok' }
```

## Security

| Layer | Measure |
|-------|---------|
| **Transport** | HTTPS everywhere (TLS 1.3) |
| **CORS** | Strict origin whitelist |
| **Auth** | JWT with short expiry, refresh token rotation |
| **Input** | Pydantic validation on all API inputs |
| **SQL** | Parameterized queries (SQLAlchemy enforced), no raw SQL with user input |
| **XSS** | React's default escaping + CSP headers |
| **Rate limiting** | Per-user and per-IP limits (Redis-backed) |
| **Secrets** | Environment variables, never in code; rotated regularly |
| **Dependencies** | `pip-audit` / `pnpm audit` in CI; Dependabot or Renovate for updates |
| **Multi-tenancy** | RLS in PostgreSQL; tenant context per request |
| **Audit** | All significant actions logged to audit table |
| **File uploads** | Scanned, size-limited, stored in object storage (not filesystem) |
