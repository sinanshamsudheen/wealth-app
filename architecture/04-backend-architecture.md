# 04 — Backend Architecture

## Overview

The backend is a modular API server built with **Python** and **FastAPI**. It mirrors the frontend's module structure — each module owns its own routers, services, repositories, models, and schemas. The backend provides RESTful APIs, WebSocket connections for real-time features, and an AI orchestration layer.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Python 3.12+** | Runtime |
| **FastAPI** | Async HTTP framework with automatic OpenAPI docs |
| **Pydantic v2** | Request/response validation, settings management |
| **SQLAlchemy 2.0** | Async ORM with type-safe queries |
| **Alembic** | Database migrations |
| **PostgreSQL 16+** | Primary database |
| **Redis 7+** | Caching, sessions, pub/sub, task queues |
| **Celery** | Distributed background task processing (backed by Redis) |
| **uvicorn** | ASGI server |
| **python-jose / PyJWT** | JWT token creation and verification |
| **passlib + bcrypt** | Password hashing |
| **httpx** | Async HTTP client (for external AI service calls) |
| **structlog** | Structured logging |
| **Ruff** | Linting and formatting |
| **pytest** | Testing framework |

## Server Structure

```
server/
├── app/
│   ├── modules/                  # Feature modules
│   │   ├── admin/                # Administration module
│   │   ├── engage/               # CRM module
│   │   ├── plan/                 # Financial planning module
│   │   ├── tools/                # Tools & Communication module
│   │   ├── deals/                # Deal management module
│   │   └── insights/             # Data & reporting module
│   ├── platform/                 # Cross-cutting services
│   │   ├── ai/                   # AI service proxy (NOT LLM orchestration — that's external)
│   │   │   ├── router.py         # Chat + agent endpoints
│   │   │   ├── client.py         # HTTP client for external AI service
│   │   │   └── schemas.py        # Chat/agent Pydantic schemas
│   │   ├── events/               # Event bus (cross-module communication)
│   │   ├── notifications/        # Notification delivery (email, push, in-app)
│   │   └── websocket/            # WebSocket handlers
│   ├── shared/                   # Shared infrastructure
│   │   ├── middleware/            # Request logging, error handling, CORS
│   │   ├── dependencies.py       # FastAPI Depends: auth, tenant, db session
│   │   ├── exceptions.py         # Custom exception classes + handlers
│   │   ├── schemas.py            # Shared Pydantic models (pagination, envelope)
│   │   └── utils.py              # Helper functions
│   ├── database/                 # Database setup
│   │   ├── session.py            # Async SQLAlchemy engine + session
│   │   ├── base.py               # Declarative base with common columns
│   │   └── migrations/           # Alembic migrations
│   ├── config.py                 # Pydantic BaseSettings (env config)
│   └── main.py                   # FastAPI app creation, middleware, router mount
├── alembic.ini
├── pyproject.toml
├── requirements.txt
└── Dockerfile
```

## Module Internal Structure

Each module follows a consistent layered architecture:

```
server/app/modules/engage/
├── __init__.py
├── router.py              # FastAPI APIRouter — endpoint definitions
├── service.py             # Business logic layer
├── repository.py          # Database access layer (SQLAlchemy queries)
├── models.py              # SQLAlchemy ORM models
├── schemas.py             # Pydantic request/response schemas
└── events.py              # Module-specific event definitions
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|---------------|
| **Router** | Define HTTP endpoints, parse request, call service, return response. No business logic. |
| **Service** | Business logic, orchestration, authorization checks. Calls repository for data. |
| **Repository** | Database queries via SQLAlchemy. Returns model instances. No business logic. |
| **Models** | SQLAlchemy ORM model definitions (table mapping). |
| **Schemas** | Pydantic models for request validation and response serialization. |

### Data Flow

```
HTTP Request
  → Middleware (logging, CORS, error handling)
    → FastAPI Dependencies (auth, tenant context, DB session)
      → Router (parse request, call service)
        → Service (business logic, authorization)
          → Repository (SQLAlchemy query)
          ← Return model instances
        ← Apply business rules, transform to response schema
      ← Return Pydantic response
    ← Serialize to JSON
  ← Send HTTP response
```

### Example Module Code

```python
# --- models.py ---
from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from app.database.base import Base, TenantMixin, TimestampMixin

class Client(Base, TenantMixin, TimestampMixin):
    __tablename__ = "clients"
    __table_args__ = {"schema": "engage"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    status = Column(String(20), default="active")
    assigned_to = Column(UUID(as_uuid=True))
    aum = Column(Numeric(20, 2))
    tags = Column(ARRAY(String))


# --- schemas.py ---
from pydantic import BaseModel, EmailStr
from decimal import Decimal

class ClientCreate(BaseModel):
    name: str
    email: EmailStr | None = None
    status: str = "active"
    assigned_to: str | None = None
    aum: Decimal | None = None
    tags: list[str] = []

class ClientResponse(BaseModel):
    id: str
    name: str
    email: str | None
    status: str
    aum: Decimal | None
    model_config = {"from_attributes": True}


# --- repository.py ---
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

class ClientRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, tenant_id: str) -> list[Client]:
        result = await self.db.execute(
            select(Client).where(Client.tenant_id == tenant_id)
        )
        return result.scalars().all()

    async def get_by_id(self, tenant_id: str, client_id: str) -> Client | None:
        result = await self.db.execute(
            select(Client).where(
                Client.tenant_id == tenant_id,
                Client.id == client_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, client: Client) -> Client:
        self.db.add(client)
        await self.db.flush()
        return client


# --- service.py ---
class ClientService:
    def __init__(self, repo: ClientRepository, event_bus: EventBus):
        self.repo = repo
        self.event_bus = event_bus

    async def list_clients(self, tenant_id: str) -> list[Client]:
        return await self.repo.get_all(tenant_id)

    async def create_client(self, tenant_id: str, data: ClientCreate) -> Client:
        client = Client(tenant_id=tenant_id, **data.model_dump())
        created = await self.repo.create(client)
        await self.event_bus.publish("client.created", {
            "tenant_id": tenant_id,
            "client_id": str(created.id),
        })
        return created


# --- router.py ---
from fastapi import APIRouter, Depends
from app.shared.dependencies import get_current_user, get_db, require_permission

router = APIRouter(prefix="/engage", tags=["Engage"])

@router.get("/clients", response_model=list[ClientResponse])
async def list_clients(
    user = Depends(get_current_user),
    db = Depends(get_db),
    _ = Depends(require_permission("module:engage:clients:read")),
):
    service = ClientService(ClientRepository(db), event_bus)
    return await service.list_clients(user.tenant_id)

@router.post("/clients", response_model=ClientResponse, status_code=201)
async def create_client(
    data: ClientCreate,
    user = Depends(get_current_user),
    db = Depends(get_db),
    _ = Depends(require_permission("module:engage:clients:write")),
):
    service = ClientService(ClientRepository(db), event_bus)
    return await service.create_client(user.tenant_id, data)
```

## FastAPI Dependency Injection

FastAPI's `Depends` system is used for cross-cutting concerns:

```python
# shared/dependencies.py

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Provide an async database session per request."""
    async with async_session_factory() as session:
        async with session.begin():
            yield session

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Decode JWT, verify user exists and is active."""
    payload = decode_jwt(token)
    user = await user_repo.get_by_id(db, payload["sub"])
    if not user or user.status != "active":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user

def require_permission(permission: str):
    """Factory that returns a dependency checking a specific permission."""
    async def checker(user: User = Depends(get_current_user)):
        if permission not in user.permissions:
            raise HTTPException(status_code=403, detail=f"Missing: {permission}")
    return checker

async def get_tenant_context(user: User = Depends(get_current_user)) -> str:
    """Extract tenant_id for database scoping."""
    return user.tenant_id
```

## Middleware Stack

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Invictus AI API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware (applied in order)
app.add_middleware(RequestLoggingMiddleware)     # Log method, path, duration
app.add_middleware(RateLimitMiddleware)          # Per-IP and per-user rate limits
app.add_middleware(TenantContextMiddleware)      # Set tenant RLS context

# Exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
```

## Module Registration

Modules register their routers with the main app:

```python
# main.py
from app.modules.admin.router import router as admin_router
from app.modules.engage.router import router as engage_router
from app.modules.plan.router import router as plan_router
from app.modules.tools.router import router as tools_router
from app.modules.deals.router import router as deals_router
from app.modules.insights.router import router as insights_router
from app.platform.ai.router import router as ai_router

app.include_router(admin_router, prefix="/api/v1")
app.include_router(engage_router, prefix="/api/v1")
app.include_router(plan_router, prefix="/api/v1")
app.include_router(tools_router, prefix="/api/v1")
app.include_router(deals_router, prefix="/api/v1")
app.include_router(insights_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1/platform")
```

In standalone mode, only the relevant module routers are included.

## Background Tasks (Celery)

Long-running or scheduled tasks use **Celery** with Redis as the broker:

```
server/app/platform/tasks/
├── celery_app.py             # Celery app setup and configuration
├── workers/
│   ├── email.py              # Send notification emails
│   ├── report.py             # Generate scheduled reports (Insights)
│   ├── sync.py               # External data sync (market data, CRM imports)
│   └── agent.py              # Execute AI agent runs
└── schedules.py              # Celery Beat periodic task schedule
```

```python
# celery_app.py
from celery import Celery

celery_app = Celery("invictus", broker=settings.redis_url)
celery_app.conf.beat_schedule = {
    "daily-digest": {
        "task": "app.platform.tasks.workers.email.send_daily_digest",
        "schedule": crontab(hour=8, minute=0),
    },
    "portfolio-scan": {
        "task": "app.platform.tasks.workers.report.scan_portfolios",
        "schedule": crontab(hour=1, minute=0),
    },
}
```

## Error Handling

All errors follow a consistent format via custom exception classes:

```python
# shared/exceptions.py
class AppException(Exception):
    def __init__(self, status_code: int, code: str, message: str, details=None):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details

class NotFoundError(AppException):
    def __init__(self, resource: str, id: str):
        super().__init__(404, "NOT_FOUND", f"{resource} {id} not found")

class ForbiddenError(AppException):
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(403, "FORBIDDEN", message)

# Exception handler
async def app_exception_handler(request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
            "meta": {"requestId": request.state.request_id},
        },
    )
```

## Observability

| Concern | Tool |
|---------|------|
| **Logging** | structlog (structured JSON logs) |
| **Metrics** | Prometheus + Grafana (via `prometheus-fastapi-instrumentator`) |
| **Tracing** | OpenTelemetry |
| **Health checks** | `/api/health` and `/api/ready` endpoints |
| **API docs** | Auto-generated OpenAPI at `/docs` (Swagger UI) and `/redoc` |
| **Audit log** | Database-backed audit trail (Administration module) |

## Testing

```
server/tests/
├── unit/                     # Unit tests (service, repository)
│   ├── modules/
│   │   ├── test_engage_service.py
│   │   ├── test_deals_service.py
│   │   └── ...
│   └── shared/
├── integration/              # Integration tests (API endpoints)
│   ├── test_engage_api.py
│   ├── test_auth_api.py
│   └── ...
├── conftest.py               # Shared fixtures (test DB, test client, auth tokens)
└── factories/                # Test data factories (Factory Boy)
```

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific module tests
pytest tests/unit/modules/test_engage_service.py
```
