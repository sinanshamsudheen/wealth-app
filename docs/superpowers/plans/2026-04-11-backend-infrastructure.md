# Backend Infrastructure & Administration Module — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Python/FastAPI backend with PostgreSQL, Redis, Celery, auth system, Administration module, and Account endpoints — replacing the frontend's MSW mocks with a real API.

**Architecture:** FastAPI async app with 4-layer module structure (Router → Service → Repository → Model). PostgreSQL with RLS for multi-tenancy. Celery + Redis for background tasks (email, audit). JWT auth with access/refresh token rotation.

**Tech Stack:** Python 3.12+, FastAPI, SQLAlchemy 2.0 (async), Alembic, PostgreSQL 16, Redis 7, Celery 5, Pydantic v2, passlib/bcrypt, python-jose, Resend, structlog, pytest

**Spec:** `docs/superpowers/specs/2026-04-11-backend-infrastructure-design.md`

---

## File Map

```
server/
├── pyproject.toml
├── alembic.ini
├── docker-compose.yml
├── .env.example
├── .env (gitignored)
├── README.md
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database/
│   │   ├── __init__.py
│   │   ├── session.py
│   │   ├── base.py
│   │   └── migrations/
│   │       ├── env.py
│   │       ├── script.py.mako
│   │       └── versions/
│   ├── shared/
│   │   ├── __init__.py
│   │   ├── dependencies.py
│   │   ├── exceptions.py
│   │   ├── schemas.py
│   │   ├── utils.py
│   │   └── middleware/
│   │       ├── __init__.py
│   │       ├── tenant_context.py
│   │       ├── request_logging.py
│   │       └── rate_limit.py
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── modules/
│   │   └── admin/
│   │       ├── __init__.py
│   │       ├── router.py
│   │       ├── service.py
│   │       ├── repository.py
│   │       ├── models.py
│   │       └── schemas.py
│   ├── account/
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── service.py
│   │   └── schemas.py
│   └── tasks/
│       ├── __init__.py
│       ├── celery_app.py
│       ├── email.py
│       └── audit.py
├── scripts/
│   ├── seed.py
│   └── create_schemas.py
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── unit/
    │   ├── __init__.py
    │   └── test_auth_service.py
    └── integration/
        ├── __init__.py
        ├── test_auth_endpoints.py
        ├── test_admin_endpoints.py
        └── test_account_endpoints.py
```

Frontend modifications:
- `client/vite.config.ts` — add proxy
- `client/src/main.tsx` — conditional MSW
- `client/src/store/useAuthStore.ts` — real login flow

---

### Task 1: Project Scaffolding

**Files:**
- Create: `server/pyproject.toml`
- Create: `server/docker-compose.yml`
- Create: `server/.env.example`
- Create: `server/README.md`
- Create: `server/app/__init__.py`
- Create: `server/app/config.py`

- [ ] **Step 1: Create `server/pyproject.toml`**

```toml
[project]
name = "invictus-server"
version = "0.1.0"
description = "Invictus AI Wealth Management Platform — Backend"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "pydantic>=2.10.0",
    "pydantic-settings>=2.7.0",
    "sqlalchemy[asyncio]>=2.0.36",
    "asyncpg>=0.30.0",
    "alembic>=1.14.0",
    "redis>=5.2.0",
    "celery[redis]>=5.4.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "resend>=2.5.0",
    "httpx>=0.28.0",
    "structlog>=24.4.0",
    "python-multipart>=0.0.18",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.28.0",
    "ruff>=0.8.0",
    "asgi-lifespan>=2.1.0",
]

[build-system]
requires = ["setuptools>=75.0"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["."]
include = ["app*"]

[tool.ruff]
target-version = "py312"
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "N", "UP", "B"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 2: Create `server/docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: invictus
      POSTGRES_USER: invictus
      POSTGRES_PASSWORD: invictus_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U invictus"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

- [ ] **Step 3: Create `server/.env.example`**

```bash
# Database
DATABASE_URL=postgresql+asyncpg://invictus:invictus_dev@localhost:5432/invictus

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Auth
JWT_SECRET_KEY=change-me-in-production
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# Email
RESEND_API_KEY=re_dev_xxx
EMAIL_FROM=noreply@invictus.ai
EMAIL_DRY_RUN=true

# App
CORS_ORIGINS=http://localhost:5173
ENVIRONMENT=development
```

- [ ] **Step 4: Create `server/app/__init__.py`**

```python
```

- [ ] **Step 5: Create `server/app/config.py`**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://invictus:invictus_dev@localhost:5432/invictus"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Auth
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Email
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@invictus.ai"
    EMAIL_DRY_RUN: bool = True

    # App
    CORS_ORIGINS: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
```

- [ ] **Step 6: Create `server/README.md`**

```markdown
# Invictus AI — Backend Server

## Prerequisites

- Python 3.12+
- Docker & Docker Compose

## Setup

```bash
# Start PostgreSQL and Redis
docker compose up -d

# Create virtual environment and install
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Copy env file
cp .env.example .env

# Create DB schemas and run migrations
python scripts/create_schemas.py
alembic upgrade head

# Seed test data
python scripts/seed.py

# Start the server
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A app.tasks.celery_app worker --loglevel=info -Q default,email
```

## API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
```

- [ ] **Step 7: Commit**

```bash
cd server
git add pyproject.toml docker-compose.yml .env.example README.md app/__init__.py app/config.py
git commit -m "feat(server): project scaffolding with deps, Docker Compose, and config"
```

---

### Task 2: Database Layer — Engine, Base Models, Session

**Files:**
- Create: `server/app/database/__init__.py`
- Create: `server/app/database/base.py`
- Create: `server/app/database/session.py`

- [ ] **Step 1: Create `server/app/database/__init__.py`**

```python
from app.database.base import Base, TenantMixin, TimestampMixin
from app.database.session import get_db, engine, async_session_factory

__all__ = ["Base", "TenantMixin", "TimestampMixin", "get_db", "engine", "async_session_factory"]
```

- [ ] **Step 2: Create `server/app/database/base.py`**

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import UUID, DateTime, ForeignKey, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class TenantMixin:
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("admin.organizations.id"),
        nullable=False,
        index=True,
    )
```

- [ ] **Step 3: Create `server/app/database/session.py`**

```python
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    pool_size=20,
    max_overflow=10,
)

async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

- [ ] **Step 4: Commit**

```bash
git add app/database/
git commit -m "feat(server): database engine, base models with tenant/timestamp mixins"
```

---

### Task 3: Shared Infrastructure — Exceptions, Schemas, Utils

**Files:**
- Create: `server/app/shared/__init__.py`
- Create: `server/app/shared/exceptions.py`
- Create: `server/app/shared/schemas.py`
- Create: `server/app/shared/utils.py`

- [ ] **Step 1: Create `server/app/shared/__init__.py`**

```python
```

- [ ] **Step 2: Create `server/app/shared/exceptions.py`**

```python
from fastapi import Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: dict | None = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
            "meta": {"request_id": request.state.request_id if hasattr(request.state, "request_id") else None},
        },
    )


# Convenience factories
def not_found(message: str = "Resource not found") -> AppException:
    return AppException(code="NOT_FOUND", message=message, status_code=404)


def unauthorized(message: str = "Not authenticated") -> AppException:
    return AppException(code="UNAUTHORIZED", message=message, status_code=401)


def forbidden(message: str = "Insufficient permissions") -> AppException:
    return AppException(code="FORBIDDEN", message=message, status_code=403)


def validation_error(message: str, details: dict | None = None) -> AppException:
    return AppException(code="VALIDATION_ERROR", message=message, status_code=422, details=details)


def conflict(message: str) -> AppException:
    return AppException(code="CONFLICT", message=message, status_code=409)
```

- [ ] **Step 3: Create `server/app/shared/schemas.py`**

```python
from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Meta(BaseModel):
    request_id: str | None = None


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    meta: Meta = Meta()


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Any | None = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
    meta: Meta = Meta()


class PaginationInfo(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: list[T]
    pagination: PaginationInfo
    meta: Meta = Meta()
```

- [ ] **Step 4: Create `server/app/shared/utils.py`**

```python
import uuid


def generate_id() -> uuid.UUID:
    return uuid.uuid4()


def paginate(page: int, page_size: int, total_items: int) -> dict:
    total_pages = (total_items + page_size - 1) // page_size if total_items > 0 else 0
    return {
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }
```

- [ ] **Step 5: Commit**

```bash
git add app/shared/
git commit -m "feat(server): shared exceptions, response schemas, and utilities"
```

---

### Task 4: Middleware — Request Logging, Tenant Context, Rate Limiting

**Files:**
- Create: `server/app/shared/middleware/__init__.py`
- Create: `server/app/shared/middleware/request_logging.py`
- Create: `server/app/shared/middleware/tenant_context.py`
- Create: `server/app/shared/middleware/rate_limit.py`

- [ ] **Step 1: Create `server/app/shared/middleware/__init__.py`**

```python
from app.shared.middleware.request_logging import RequestLoggingMiddleware
from app.shared.middleware.tenant_context import TenantContextMiddleware
from app.shared.middleware.rate_limit import RateLimitMiddleware

__all__ = ["RequestLoggingMiddleware", "TenantContextMiddleware", "RateLimitMiddleware"]
```

- [ ] **Step 2: Create `server/app/shared/middleware/request_logging.py`**

```python
import time
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = structlog.get_logger()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        start_time = time.perf_counter()

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        logger.info(
            "request_started",
            method=request.method,
            path=request.url.path,
        )

        response = await call_next(request)

        duration_ms = (time.perf_counter() - start_time) * 1000

        logger.info(
            "request_completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
        )

        response.headers["X-Request-ID"] = request_id
        return response
```

- [ ] **Step 3: Create `server/app/shared/middleware/tenant_context.py`**

```python
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class TenantContextMiddleware(BaseHTTPMiddleware):
    """
    Extracts tenant_id from the authenticated user's JWT claims
    and stores it on request.state for downstream use.

    The actual RLS SET LOCAL happens in the get_db dependency when
    tenant context is available. This middleware just makes tenant_id
    accessible early in the request lifecycle.
    """

    # Paths that don't require tenant context
    EXEMPT_PATHS = ("/api/v1/auth/", "/docs", "/redoc", "/openapi.json", "/api/health")

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Skip tenant context for exempt paths
        path = request.url.path
        if any(path.startswith(p) for p in self.EXEMPT_PATHS):
            request.state.tenant_id = None
            return await call_next(request)

        # tenant_id is set by the auth dependency (get_current_user)
        # This middleware just ensures the attribute exists
        if not hasattr(request.state, "tenant_id"):
            request.state.tenant_id = None

        return await call_next(request)
```

- [ ] **Step 4: Create `server/app/shared/middleware/rate_limit.py`**

```python
import time

import redis.asyncio as redis
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple Redis-based rate limiter using sliding window."""

    def __init__(self, app, requests_per_minute: int = 100):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.redis: redis.Redis | None = None

    async def _get_redis(self) -> redis.Redis:
        if self.redis is None:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        return self.redis

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Skip rate limiting for health checks and docs
        if request.url.path in ("/api/health", "/docs", "/redoc", "/openapi.json"):
            return await call_next(request)

        # Identify client by user ID (if authenticated) or IP
        user_id = getattr(request.state, "user_id", None)
        client_key = f"ratelimit:{user_id or request.client.host}"

        try:
            r = await self._get_redis()
            now = time.time()
            window_start = now - 60

            pipe = r.pipeline()
            pipe.zremrangebyscore(client_key, 0, window_start)
            pipe.zadd(client_key, {str(now): now})
            pipe.zcard(client_key)
            pipe.expire(client_key, 60)
            results = await pipe.execute()

            request_count = results[2]

            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
            response.headers["X-RateLimit-Remaining"] = str(
                max(0, self.requests_per_minute - request_count)
            )
            response.headers["X-RateLimit-Reset"] = str(int(now + 60))

            if request_count > self.requests_per_minute:
                return JSONResponse(
                    status_code=429,
                    content={
                        "success": False,
                        "error": {
                            "code": "RATE_LIMITED",
                            "message": "Too many requests",
                            "details": None,
                        },
                        "meta": {"request_id": getattr(request.state, "request_id", None)},
                    },
                )

            return response
        except Exception:
            # If Redis is down, allow the request through
            return await call_next(request)
```

- [ ] **Step 5: Commit**

```bash
git add app/shared/middleware/
git commit -m "feat(server): request logging, tenant context, and rate limit middleware"
```

---

### Task 5: Auth — ORM Models, Schemas, Service

**Files:**
- Create: `server/app/auth/__init__.py`
- Create: `server/app/auth/models.py`
- Create: `server/app/auth/schemas.py`
- Create: `server/app/auth/service.py`

- [ ] **Step 1: Create `server/app/auth/__init__.py`**

```python
```

- [ ] **Step 2: Create `server/app/auth/models.py`**

```python
import uuid
from datetime import datetime

from sqlalchemy import UUID, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = {"schema": "platform"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

- [ ] **Step 3: Create `server/app/auth/schemas.py`**

```python
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str  # user_id
    tenant_id: str
    email: str
    first_name: str
    last_name: str
    module_roles: dict[str, str]
    exp: int
    iat: int
```

- [ ] **Step 4: Create `server/app/auth/service.py`**

```python
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import RefreshToken
from app.config import settings
from app.shared.exceptions import unauthorized

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_refresh_token(token: str) -> str:
    """SHA-256 hash for refresh token (already high-entropy)."""
    return hashlib.sha256(token.encode()).hexdigest()


def create_access_token(
    user_id: uuid.UUID,
    tenant_id: uuid.UUID,
    email: str,
    first_name: str,
    last_name: str,
    module_roles: dict[str, str],
) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "tenant_id": str(tenant_id),
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "module_roles": module_roles,
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise unauthorized("Invalid or expired token")


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)


async def create_refresh_token_record(
    db: AsyncSession, user_id: uuid.UUID, token: str
) -> RefreshToken:
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    record = RefreshToken(
        id=uuid.uuid4(),
        user_id=user_id,
        token_hash=hash_refresh_token(token),
        expires_at=expires_at,
    )
    db.add(record)
    await db.flush()
    return record


async def validate_refresh_token(db: AsyncSession, token: str) -> RefreshToken:
    token_hash = hash_refresh_token(token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise unauthorized("Invalid or expired refresh token")
    return record


async def revoke_refresh_token(db: AsyncSession, record: RefreshToken) -> None:
    record.revoked_at = datetime.now(timezone.utc)
    await db.flush()
```

- [ ] **Step 5: Commit**

```bash
git add app/auth/
git commit -m "feat(server): auth models, schemas, and service (JWT + bcrypt + refresh tokens)"
```

---

### Task 6: Admin Module — ORM Models

**Files:**
- Create: `server/app/modules/__init__.py`
- Create: `server/app/modules/admin/__init__.py`
- Create: `server/app/modules/admin/models.py`

- [ ] **Step 1: Create `server/app/modules/__init__.py`**

```python
```

- [ ] **Step 2: Create `server/app/modules/admin/__init__.py`**

```python
```

- [ ] **Step 3: Create `server/app/modules/admin/models.py`**

```python
import uuid
from datetime import datetime

from sqlalchemy import UUID, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TenantMixin, TimestampMixin


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"
    __table_args__ = {"schema": "admin"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    registration_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), server_default="USD", nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), server_default="UTC", nullable=False)
    support_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), server_default="active", nullable=False)
    address: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class User(Base, TenantMixin, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_tenant_email", "tenant_id", "email", unique=True),
        Index("ix_users_tenant_status", "tenant_id", "status"),
        {"schema": "admin"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(20), server_default="active", nullable=False)

    module_roles: Mapped[list["UserModuleRole"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )


class UserModuleRole(Base, TenantMixin):
    __tablename__ = "user_module_roles"
    __table_args__ = (
        Index("ix_umr_tenant_user_module", "tenant_id", "user_id", "module_slug", unique=True),
        {"schema": "admin"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("admin.users.id", ondelete="CASCADE"), nullable=False
    )
    module_slug: Mapped[str] = mapped_column(String(20), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="module_roles")


class OrgBranding(Base, TenantMixin, TimestampMixin):
    __tablename__ = "org_branding"
    __table_args__ = (
        Index("ix_org_branding_tenant", "tenant_id", unique=True),
        {"schema": "admin"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    header_logo: Mapped[str] = mapped_column(String(10), server_default="small", nullable=False)
    brand_color: Mapped[str] = mapped_column(String(10), server_default="#000000", nullable=False)
    email_footer: Mapped[str | None] = mapped_column(Text, nullable=True)
    small_logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    large_logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)


class OrgPreferences(Base, TenantMixin, TimestampMixin):
    __tablename__ = "org_preferences"
    __table_args__ = (
        Index("ix_org_preferences_tenant", "tenant_id", unique=True),
        {"schema": "admin"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date_format: Mapped[str] = mapped_column(String(20), server_default="MM/DD/YYYY", nullable=False)
    number_format: Mapped[str] = mapped_column(String(20), server_default="en-US", nullable=False)


class Invitation(Base, TenantMixin):
    __tablename__ = "invitations"
    __table_args__ = (
        Index("ix_invitations_tenant_created", "tenant_id", "created_at"),
        {"schema": "admin"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    module_roles: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String(20), server_default="pending", nullable=False)
    invited_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("admin.users.id"), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class AuditLog(Base, TenantMixin):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_tenant_created", "tenant_id", "created_at"),
        {"schema": "admin"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
```

- [ ] **Step 4: Commit**

```bash
git add app/modules/
git commit -m "feat(server): admin module ORM models (org, users, roles, branding, preferences, invitations, audit)"
```

---

### Task 7: Alembic Setup & Initial Migration

**Files:**
- Create: `server/alembic.ini`
- Create: `server/app/database/migrations/env.py`
- Create: `server/app/database/migrations/script.py.mako`
- Create: `server/app/database/migrations/versions/` (directory)
- Create: `server/scripts/create_schemas.py`

- [ ] **Step 1: Create `server/alembic.ini`**

```ini
[alembic]
script_location = app/database/migrations
prepend_sys_path = .

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

- [ ] **Step 2: Create `server/app/database/migrations/env.py`**

```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool, text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings
from app.database.base import Base

# Import all models so they register with Base.metadata
from app.auth.models import RefreshToken  # noqa: F401
from app.modules.admin.models import (  # noqa: F401
    AuditLog,
    Invitation,
    Organization,
    OrgBranding,
    OrgPreferences,
    User,
    UserModuleRole,
)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = create_async_engine(settings.DATABASE_URL, poolclass=pool.NullPool)
    async with connectable.connect() as connection:
        await connection.execute(text("CREATE SCHEMA IF NOT EXISTS admin"))
        await connection.execute(text("CREATE SCHEMA IF NOT EXISTS platform"))
        await connection.commit()
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 3: Create `server/app/database/migrations/script.py.mako`**

```mako
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

# revision identifiers, used by Alembic.
revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
```

- [ ] **Step 4: Create `server/scripts/create_schemas.py`**

```python
"""Create PostgreSQL schemas required by the application."""
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings


async def create_schemas():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS admin"))
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS platform"))
    await engine.dispose()
    print("Created schemas: admin, platform")


if __name__ == "__main__":
    asyncio.run(create_schemas())
```

- [ ] **Step 5: Create empty versions directory**

```bash
mkdir -p app/database/migrations/versions
touch app/database/migrations/versions/.gitkeep
```

- [ ] **Step 6: Generate initial migration**

Run: `cd server && alembic revision --autogenerate -m "initial schema"`

This creates a migration file in `app/database/migrations/versions/` with all tables defined in the models.

- [ ] **Step 7: Create RLS migration**

Run: `cd server && alembic revision -m "enable RLS policies"`

Then edit the generated file to contain:

```python
from alembic import op

RLS_TABLES = [
    "admin.users",
    "admin.user_module_roles",
    "admin.org_branding",
    "admin.org_preferences",
    "admin.invitations",
    "admin.audit_logs",
]


def upgrade() -> None:
    for table in RLS_TABLES:
        schema, name = table.split(".")
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(
            f"CREATE POLICY tenant_isolation_{name} ON {table} "
            f"USING (tenant_id = current_setting('app.current_tenant')::uuid)"
        )
        op.execute(
            f"CREATE POLICY tenant_insert_{name} ON {table} "
            f"FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid)"
        )


def downgrade() -> None:
    for table in RLS_TABLES:
        schema, name = table.split(".")
        op.execute(f"DROP POLICY IF EXISTS tenant_insert_{name} ON {table}")
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation_{name} ON {table}")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")
```

- [ ] **Step 8: Commit**

```bash
git add alembic.ini app/database/migrations/ scripts/create_schemas.py
git commit -m "feat(server): Alembic setup with initial migration for admin + platform schemas"
```

---

### Task 8: Shared Dependencies — get_current_user, require_role

**Files:**
- Create: `server/app/shared/dependencies.py`

- [ ] **Step 1: Create `server/app/shared/dependencies.py`**

```python
import uuid
from dataclasses import dataclass

from fastapi import Cookie, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.service import decode_access_token
from app.database.session import get_db as _get_db
from app.shared.exceptions import forbidden, unauthorized

security = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    id: uuid.UUID
    tenant_id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    module_roles: dict[str, str]


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> CurrentUser:
    if credentials is None:
        raise unauthorized()

    payload = decode_access_token(credentials.credentials)

    user = CurrentUser(
        id=uuid.UUID(payload["sub"]),
        tenant_id=uuid.UUID(payload["tenant_id"]),
        email=payload["email"],
        first_name=payload["first_name"],
        last_name=payload["last_name"],
        module_roles=payload.get("module_roles", {}),
    )

    # Set tenant_id on request state for middleware/downstream use
    request.state.tenant_id = str(user.tenant_id)
    request.state.user_id = str(user.id)

    return user


def require_role(module: str, roles: list[str]):
    """
    Returns a dependency that checks the user has one of the given roles
    for the specified module.

    Usage:
        @router.get("/admin/users")
        async def list_users(user=Depends(require_role("admin", ["owner", "manager", "analyst"]))):
            ...
    """

    async def _check_role(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        user_role = user.module_roles.get(module)
        if user_role is None:
            raise forbidden(f"No access to module: {module}")
        if user_role not in roles:
            raise forbidden(f"Requires one of roles: {', '.join(roles)}")
        return user

    return _check_role


async def get_db_with_tenant(
    request: Request,
    session: AsyncSession = Depends(_get_db),
) -> AsyncSession:
    """
    Wraps the standard get_db to set RLS tenant context.
    Use this for all tenant-scoped routes.
    """
    tenant_id = getattr(request.state, "tenant_id", None)
    if tenant_id:
        await session.execute(
            __import__("sqlalchemy").text(f"SET LOCAL app.current_tenant = '{tenant_id}'")
        )
    return session
```

- [ ] **Step 2: Commit**

```bash
git add app/shared/dependencies.py
git commit -m "feat(server): auth dependencies — get_current_user, require_role, tenant-scoped DB session"
```

---

### Task 9: Auth Router — Login, Refresh, Logout

**Files:**
- Create: `server/app/auth/router.py`

- [ ] **Step 1: Create `server/app/auth/router.py`**

```python
import uuid

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas import LoginRequest, TokenResponse
from app.auth.service import (
    create_access_token,
    create_refresh_token_record,
    generate_refresh_token,
    revoke_refresh_token,
    validate_refresh_token,
    verify_password,
)
from app.config import settings
from app.database.session import get_db
from app.modules.admin.models import User, UserModuleRole
from app.shared.exceptions import unauthorized
from app.shared.schemas import SuccessResponse

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=SuccessResponse[TokenResponse])
async def login(body: LoginRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    # Find user by email (cross-tenant — no RLS for login)
    result = await db.execute(
        select(User).where(User.email == body.email, User.status != "suspended")
    )
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise unauthorized("Invalid email or password")

    if not verify_password(body.password, user.password_hash):
        raise unauthorized("Invalid email or password")

    # Build module_roles dict
    roles_result = await db.execute(
        select(UserModuleRole).where(UserModuleRole.user_id == user.id)
    )
    module_roles = {r.module_slug: r.role for r in roles_result.scalars().all()}

    # Create access token
    access_token = create_access_token(
        user_id=user.id,
        tenant_id=user.tenant_id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        module_roles=module_roles,
    )

    # Create refresh token
    refresh_token = generate_refresh_token()
    await create_refresh_token_record(db, user.id, refresh_token)

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/v1/auth",
    )

    return SuccessResponse(data=TokenResponse(access_token=access_token))


@router.post("/refresh", response_model=SuccessResponse[TokenResponse])
async def refresh(
    request: Request,
    response: Response,
    refresh_token: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    # Read refresh token from cookie
    token = request.cookies.get("refresh_token")
    if not token:
        raise unauthorized("No refresh token")

    # Validate and revoke old token
    record = await validate_refresh_token(db, token)
    await revoke_refresh_token(db, record)

    # Get user for new token
    result = await db.execute(select(User).where(User.id == record.user_id))
    user = result.scalar_one_or_none()
    if not user or user.status == "suspended":
        raise unauthorized("User not found or suspended")

    # Build module_roles
    roles_result = await db.execute(
        select(UserModuleRole).where(UserModuleRole.user_id == user.id)
    )
    module_roles = {r.module_slug: r.role for r in roles_result.scalars().all()}

    # Issue new tokens
    access_token = create_access_token(
        user_id=user.id,
        tenant_id=user.tenant_id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        module_roles=module_roles,
    )

    new_refresh_token = generate_refresh_token()
    await create_refresh_token_record(db, user.id, new_refresh_token)

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/v1/auth",
    )

    return SuccessResponse(data=TokenResponse(access_token=access_token))


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    token = request.cookies.get("refresh_token")
    if token:
        try:
            record = await validate_refresh_token(db, token)
            await revoke_refresh_token(db, record)
        except Exception:
            pass  # Token already revoked or invalid — still clear cookie

    response.delete_cookie(key="refresh_token", path="/api/v1/auth")
    return SuccessResponse(data={"message": "Logged out"})
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/router.py
git commit -m "feat(server): auth router — login, refresh token rotation, logout"
```

---

### Task 10: Admin Module — Schemas

**Files:**
- Create: `server/app/modules/admin/schemas.py`

- [ ] **Step 1: Create `server/app/modules/admin/schemas.py`**

```python
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


# --- Organization ---
class AddressSchema(BaseModel):
    line1: str | None = None
    line2: str | None = None
    city: str | None = None
    state: str | None = None
    postalCode: str | None = None
    country: str | None = None


class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    registrationNumber: str | None = None
    website: str | None = None
    currency: str
    timezone: str
    supportEmail: str | None = None
    status: str
    address: AddressSchema | None = None

    class Config:
        from_attributes = True


class UpdateOrganizationRequest(BaseModel):
    name: str | None = None
    registrationNumber: str | None = None
    website: str | None = None
    currency: str | None = None
    timezone: str | None = None
    supportEmail: str | None = None
    address: AddressSchema | None = None


# --- Branding ---
class BrandingResponse(BaseModel):
    headerLogo: str
    brandColor: str
    emailFooter: str | None = None
    smallLogoUrl: str | None = None
    largeLogoUrl: str | None = None

    class Config:
        from_attributes = True


class UpdateBrandingRequest(BaseModel):
    headerLogo: str | None = None
    brandColor: str | None = None
    emailFooter: str | None = None
    smallLogoUrl: str | None = None
    largeLogoUrl: str | None = None


# --- Preferences ---
class PreferencesResponse(BaseModel):
    dateFormat: str
    numberFormat: str

    class Config:
        from_attributes = True


class UpdatePreferencesRequest(BaseModel):
    dateFormat: str | None = None
    numberFormat: str | None = None


# --- Module Roles ---
class ModuleRoleSchema(BaseModel):
    moduleSlug: str
    role: str


# --- Users ---
class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    firstName: str
    lastName: str
    phone: str | None = None
    status: str
    moduleRoles: list[ModuleRoleSchema]

    class Config:
        from_attributes = True


class UpdateUserRequest(BaseModel):
    status: str | None = None
    moduleRoles: list[ModuleRoleSchema] | None = None


# --- Invitations ---
class InvitationResponse(BaseModel):
    id: uuid.UUID
    email: str
    firstName: str
    lastName: str
    moduleRoles: list[ModuleRoleSchema]
    status: str
    invitedBy: uuid.UUID
    expiresAt: datetime
    createdAt: datetime

    class Config:
        from_attributes = True


class CreateInvitationRequest(BaseModel):
    email: EmailStr
    firstName: str
    lastName: str
    moduleRoles: list[ModuleRoleSchema]
```

- [ ] **Step 2: Commit**

```bash
git add app/modules/admin/schemas.py
git commit -m "feat(server): admin Pydantic schemas for request/response serialization"
```

---

### Task 11: Admin Module — Repository

**Files:**
- Create: `server/app/modules/admin/repository.py`

- [ ] **Step 1: Create `server/app/modules/admin/repository.py`**

```python
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin.models import (
    Invitation,
    Organization,
    OrgBranding,
    OrgPreferences,
    User,
    UserModuleRole,
)


# --- Organization ---
async def get_organization(db: AsyncSession, tenant_id: uuid.UUID) -> Organization | None:
    result = await db.execute(select(Organization).where(Organization.id == tenant_id))
    return result.scalar_one_or_none()


async def update_organization(
    db: AsyncSession, tenant_id: uuid.UUID, data: dict
) -> Organization | None:
    org = await get_organization(db, tenant_id)
    if not org:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(org, key, value)
    await db.flush()
    return org


# --- Branding ---
async def get_branding(db: AsyncSession, tenant_id: uuid.UUID) -> OrgBranding | None:
    result = await db.execute(select(OrgBranding).where(OrgBranding.tenant_id == tenant_id))
    return result.scalar_one_or_none()


async def upsert_branding(db: AsyncSession, tenant_id: uuid.UUID, data: dict) -> OrgBranding:
    branding = await get_branding(db, tenant_id)
    if not branding:
        branding = OrgBranding(id=uuid.uuid4(), tenant_id=tenant_id)
        db.add(branding)
    for key, value in data.items():
        if value is not None:
            setattr(branding, key, value)
    await db.flush()
    return branding


# --- Preferences ---
async def get_preferences(db: AsyncSession, tenant_id: uuid.UUID) -> OrgPreferences | None:
    result = await db.execute(select(OrgPreferences).where(OrgPreferences.tenant_id == tenant_id))
    return result.scalar_one_or_none()


async def upsert_preferences(
    db: AsyncSession, tenant_id: uuid.UUID, data: dict
) -> OrgPreferences:
    prefs = await get_preferences(db, tenant_id)
    if not prefs:
        prefs = OrgPreferences(id=uuid.uuid4(), tenant_id=tenant_id)
        db.add(prefs)
    for key, value in data.items():
        if value is not None:
            setattr(prefs, key, value)
    await db.flush()
    return prefs


# --- Users ---
async def list_users(db: AsyncSession, tenant_id: uuid.UUID) -> list[User]:
    result = await db.execute(
        select(User).where(User.tenant_id == tenant_id).order_by(User.created_at)
    )
    return list(result.scalars().all())


async def get_user(db: AsyncSession, tenant_id: uuid.UUID, user_id: uuid.UUID) -> User | None:
    result = await db.execute(
        select(User).where(User.tenant_id == tenant_id, User.id == user_id)
    )
    return result.scalar_one_or_none()


async def update_user_status(
    db: AsyncSession, tenant_id: uuid.UUID, user_id: uuid.UUID, status: str
) -> User | None:
    user = await get_user(db, tenant_id, user_id)
    if not user:
        return None
    user.status = status
    await db.flush()
    return user


async def update_user_module_roles(
    db: AsyncSession, tenant_id: uuid.UUID, user_id: uuid.UUID, roles: list[dict]
) -> User | None:
    user = await get_user(db, tenant_id, user_id)
    if not user:
        return None

    # Delete existing roles
    await db.execute(
        delete(UserModuleRole).where(
            UserModuleRole.tenant_id == tenant_id, UserModuleRole.user_id == user_id
        )
    )

    # Insert new roles
    for role_data in roles:
        role = UserModuleRole(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            user_id=user_id,
            module_slug=role_data["moduleSlug"],
            role=role_data["role"],
        )
        db.add(role)

    await db.flush()

    # Refresh to get updated relationships
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, tenant_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    user = await get_user(db, tenant_id, user_id)
    if not user:
        return False
    await db.delete(user)
    await db.flush()
    return True


# --- Invitations ---
async def list_invitations(db: AsyncSession, tenant_id: uuid.UUID) -> list[Invitation]:
    result = await db.execute(
        select(Invitation)
        .where(Invitation.tenant_id == tenant_id, Invitation.status == "pending")
        .order_by(Invitation.created_at.desc())
    )
    return list(result.scalars().all())


async def create_invitation(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    invited_by: uuid.UUID,
    data: dict,
) -> Invitation:
    invitation = Invitation(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        email=data["email"],
        first_name=data["firstName"],
        last_name=data["lastName"],
        module_roles=data["moduleRoles"],
        invited_by=invited_by,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    await db.flush()
    return invitation


async def cancel_invitation(
    db: AsyncSession, tenant_id: uuid.UUID, invitation_id: uuid.UUID
) -> bool:
    result = await db.execute(
        select(Invitation).where(
            Invitation.tenant_id == tenant_id,
            Invitation.id == invitation_id,
            Invitation.status == "pending",
        )
    )
    invitation = result.scalar_one_or_none()
    if not invitation:
        return False
    invitation.status = "cancelled"
    await db.flush()
    return True
```

- [ ] **Step 2: Commit**

```bash
git add app/modules/admin/repository.py
git commit -m "feat(server): admin repository — all DB queries for org, branding, users, invitations"
```

---

### Task 12: Admin Module — Service

**Files:**
- Create: `server/app/modules/admin/service.py`

- [ ] **Step 1: Create `server/app/modules/admin/service.py`**

```python
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin import repository
from app.modules.admin.schemas import (
    BrandingResponse,
    CreateInvitationRequest,
    InvitationResponse,
    ModuleRoleSchema,
    OrganizationResponse,
    PreferencesResponse,
    UpdateBrandingRequest,
    UpdateOrganizationRequest,
    UpdatePreferencesRequest,
    UpdateUserRequest,
    UserResponse,
)
from app.shared.exceptions import not_found


# --- Organization ---
async def get_organization(db: AsyncSession, tenant_id: uuid.UUID) -> OrganizationResponse:
    org = await repository.get_organization(db, tenant_id)
    if not org:
        raise not_found("Organization not found")
    return OrganizationResponse(
        id=org.id,
        name=org.name,
        registrationNumber=org.registration_number,
        website=org.website,
        currency=org.currency,
        timezone=org.timezone,
        supportEmail=org.support_email,
        status=org.status,
        address=org.address,
    )


async def update_organization(
    db: AsyncSession, tenant_id: uuid.UUID, data: UpdateOrganizationRequest
) -> OrganizationResponse:
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.registrationNumber is not None:
        update_data["registration_number"] = data.registrationNumber
    if data.website is not None:
        update_data["website"] = data.website
    if data.currency is not None:
        update_data["currency"] = data.currency
    if data.timezone is not None:
        update_data["timezone"] = data.timezone
    if data.supportEmail is not None:
        update_data["support_email"] = data.supportEmail
    if data.address is not None:
        update_data["address"] = data.address.model_dump()

    org = await repository.update_organization(db, tenant_id, update_data)
    if not org:
        raise not_found("Organization not found")
    return OrganizationResponse(
        id=org.id,
        name=org.name,
        registrationNumber=org.registration_number,
        website=org.website,
        currency=org.currency,
        timezone=org.timezone,
        supportEmail=org.support_email,
        status=org.status,
        address=org.address,
    )


# --- Branding ---
async def get_branding(db: AsyncSession, tenant_id: uuid.UUID) -> BrandingResponse:
    branding = await repository.get_branding(db, tenant_id)
    if not branding:
        return BrandingResponse(headerLogo="small", brandColor="#000000")
    return BrandingResponse(
        headerLogo=branding.header_logo,
        brandColor=branding.brand_color,
        emailFooter=branding.email_footer,
        smallLogoUrl=branding.small_logo_url,
        largeLogoUrl=branding.large_logo_url,
    )


async def update_branding(
    db: AsyncSession, tenant_id: uuid.UUID, data: UpdateBrandingRequest
) -> BrandingResponse:
    update_data = {}
    if data.headerLogo is not None:
        update_data["header_logo"] = data.headerLogo
    if data.brandColor is not None:
        update_data["brand_color"] = data.brandColor
    if data.emailFooter is not None:
        update_data["email_footer"] = data.emailFooter
    if data.smallLogoUrl is not None:
        update_data["small_logo_url"] = data.smallLogoUrl
    if data.largeLogoUrl is not None:
        update_data["large_logo_url"] = data.largeLogoUrl

    branding = await repository.upsert_branding(db, tenant_id, update_data)
    return BrandingResponse(
        headerLogo=branding.header_logo,
        brandColor=branding.brand_color,
        emailFooter=branding.email_footer,
        smallLogoUrl=branding.small_logo_url,
        largeLogoUrl=branding.large_logo_url,
    )


# --- Preferences ---
async def get_preferences(db: AsyncSession, tenant_id: uuid.UUID) -> PreferencesResponse:
    prefs = await repository.get_preferences(db, tenant_id)
    if not prefs:
        return PreferencesResponse(dateFormat="MM/DD/YYYY", numberFormat="en-US")
    return PreferencesResponse(
        dateFormat=prefs.date_format,
        numberFormat=prefs.number_format,
    )


async def update_preferences(
    db: AsyncSession, tenant_id: uuid.UUID, data: UpdatePreferencesRequest
) -> PreferencesResponse:
    update_data = {}
    if data.dateFormat is not None:
        update_data["date_format"] = data.dateFormat
    if data.numberFormat is not None:
        update_data["number_format"] = data.numberFormat

    prefs = await repository.upsert_preferences(db, tenant_id, update_data)
    return PreferencesResponse(
        dateFormat=prefs.date_format,
        numberFormat=prefs.number_format,
    )


# --- Users ---
def _user_to_response(user) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        firstName=user.first_name,
        lastName=user.last_name,
        phone=user.phone,
        status=user.status,
        moduleRoles=[
            ModuleRoleSchema(moduleSlug=r.module_slug, role=r.role) for r in user.module_roles
        ],
    )


async def list_users(db: AsyncSession, tenant_id: uuid.UUID) -> list[UserResponse]:
    users = await repository.list_users(db, tenant_id)
    return [_user_to_response(u) for u in users]


async def get_user(db: AsyncSession, tenant_id: uuid.UUID, user_id: uuid.UUID) -> UserResponse:
    user = await repository.get_user(db, tenant_id, user_id)
    if not user:
        raise not_found("User not found")
    return _user_to_response(user)


async def update_user(
    db: AsyncSession, tenant_id: uuid.UUID, user_id: uuid.UUID, data: UpdateUserRequest
) -> UserResponse:
    if data.status is not None:
        user = await repository.update_user_status(db, tenant_id, user_id, data.status)
        if not user:
            raise not_found("User not found")

    if data.moduleRoles is not None:
        roles = [{"moduleSlug": r.moduleSlug, "role": r.role} for r in data.moduleRoles]
        user = await repository.update_user_module_roles(db, tenant_id, user_id, roles)
        if not user:
            raise not_found("User not found")

    # Fetch fresh user state
    user = await repository.get_user(db, tenant_id, user_id)
    if not user:
        raise not_found("User not found")
    return _user_to_response(user)


async def remove_user(db: AsyncSession, tenant_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    deleted = await repository.delete_user(db, tenant_id, user_id)
    if not deleted:
        raise not_found("User not found")
    return True


# --- Invitations ---
def _invitation_to_response(inv) -> InvitationResponse:
    module_roles = [ModuleRoleSchema(**r) for r in inv.module_roles]
    return InvitationResponse(
        id=inv.id,
        email=inv.email,
        firstName=inv.first_name,
        lastName=inv.last_name,
        moduleRoles=module_roles,
        status=inv.status,
        invitedBy=inv.invited_by,
        expiresAt=inv.expires_at,
        createdAt=inv.created_at,
    )


async def list_invitations(db: AsyncSession, tenant_id: uuid.UUID) -> list[InvitationResponse]:
    invitations = await repository.list_invitations(db, tenant_id)
    return [_invitation_to_response(inv) for inv in invitations]


async def create_invitation(
    db: AsyncSession, tenant_id: uuid.UUID, invited_by: uuid.UUID, data: CreateInvitationRequest
) -> InvitationResponse:
    inv_data = {
        "email": data.email,
        "firstName": data.firstName,
        "lastName": data.lastName,
        "moduleRoles": [r.model_dump() for r in data.moduleRoles],
    }
    invitation = await repository.create_invitation(db, tenant_id, invited_by, inv_data)
    return _invitation_to_response(invitation)


async def cancel_invitation(
    db: AsyncSession, tenant_id: uuid.UUID, invitation_id: uuid.UUID
) -> bool:
    cancelled = await repository.cancel_invitation(db, tenant_id, invitation_id)
    if not cancelled:
        raise not_found("Invitation not found")
    return True
```

- [ ] **Step 2: Commit**

```bash
git add app/modules/admin/service.py
git commit -m "feat(server): admin service layer — business logic for org, branding, users, invitations"
```

---

### Task 13: Admin Module — Router

**Files:**
- Create: `server/app/modules/admin/router.py`

- [ ] **Step 1: Create `server/app/modules/admin/router.py`**

```python
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin import service
from app.modules.admin.schemas import (
    BrandingResponse,
    CreateInvitationRequest,
    InvitationResponse,
    OrganizationResponse,
    PreferencesResponse,
    UpdateBrandingRequest,
    UpdateOrganizationRequest,
    UpdatePreferencesRequest,
    UpdateUserRequest,
    UserResponse,
)
from app.shared.dependencies import CurrentUser, get_db_with_tenant, require_role
from app.shared.schemas import SuccessResponse

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# Dependency shortcuts
AdminRead = Depends(require_role("admin", ["owner", "manager", "analyst"]))
AdminWrite = Depends(require_role("admin", ["owner", "manager"]))
AdminOwner = Depends(require_role("admin", ["owner"]))


# --- Organization ---
@router.get("/organization", response_model=SuccessResponse[OrganizationResponse])
async def get_organization(
    user: CurrentUser = AdminRead,
    db: AsyncSession = Depends(get_db_with_tenant),
):
    data = await service.get_organization(db, user.tenant_id)
    return SuccessResponse(data=data)


@router.put("/organization", response_model=SuccessResponse[OrganizationResponse])
async def update_organization(
    body: UpdateOrganizationRequest,
    user: CurrentUser = AdminWrite,
    db: AsyncSession = Depends(get_db_with_tenant),
):
    data = await service.update_organization(db, user.tenant_id, body)
    return SuccessResponse(data=data)


# --- Branding ---
@router.get("/branding", response_model=SuccessResponse[BrandingResponse])
async def get_branding(
    user: CurrentUser = AdminRead,
    db: AsyncSession = Depends(get_db_with_tenant),
):
    data = await service.get_branding(db, user.tenant_id)
    return SuccessResponse(data=data)


@router.put("/branding", response_model=SuccessResponse[BrandingResponse])
async def update_branding(
    body: UpdateBrandingRequest,
    user: CurrentUser = AdminWrite,
    db: AsyncSession = Depends(get_db_with_tenant),
):
    data = await service.update_branding(db, user.tenant_id, body)
    return SuccessResponse(data=data)


# --- Preferences ---
@router.get("/preferences", response_model=SuccessResponse[PreferencesResponse])
async def get_preferences(
    user: CurrentUser = AdminRead,
    db: AsyncSession = Depends(get_db_with_tenant),
):
    data = await service.get_preferences(db, user.tenant_id)
    return SuccessResponse(data=data)


@router.put("/preferences", response_model=SuccessResponse[PreferencesResponse])
async def update_preferences(
    body: UpdatePreferencesRequest,
    user: CurrentUser = AdminWrite,
    db: AsyncSession = Depends(get_db_with_tenant),
):
    data = await service.update_preferences(db, user.tenant_id, body)
    return SuccessResponse(data=data)


# --- Users ---
@router.get("/users", response_model=SuccessResponse[list[UserResponse]])
async def list_users(
    user: CurrentUser = AdminRead,
    db: AsyncSession = Depends(get_db_with_tenant),
):
    data = await service.list_users(db, user.tenant_id)
    return SuccessResponse(data=data)


@router.get("/users/{user_id}", response_model=SuccessResponse[UserResponse])
async def get_user(
    user_id: uuid.UUID,
    user: CurrentUser = AdminRead,
    db: AsyncSession = Depends(get_db_with_tenant),
):
    data = await service.get_user(db, user.tenant_id, user_id)
    return SuccessResponse(data=data)


@router.put("/users/{user_id}", response_model=SuccessResponse[UserResponse])
async def update_user(
    user_id: uuid.UUID,
    body: UpdateUserRequest,
    user: CurrentUser = AdminWrite,
    db: AsyncSession = Depends(get_db_with_tenant),
):
    data = await service.update_user(db, user.tenant_id, user_id, body)
    return SuccessResponse(data=data)


@router.delete("/users/{user_id}")
async def remove_user(
    user_id: uuid.UUID,
    user: CurrentUser = AdminOwner,
    db: AsyncSession = Depends(get_db_with_tenant),
):
    await service.remove_user(db, user.tenant_id, user_id)
    return SuccessResponse(data={"message": "User removed"})


# --- Invitations ---
@router.get("/invitations", response_model=SuccessResponse[list[InvitationResponse]])
async def list_invitations(
    user: CurrentUser = AdminRead,
    db: AsyncSession = Depends(get_db_with_tenant),
):
    data = await service.list_invitations(db, user.tenant_id)
    return SuccessResponse(data=data)


@router.post("/invitations", response_model=SuccessResponse[InvitationResponse])
async def create_invitation(
    body: CreateInvitationRequest,
    user: CurrentUser = AdminWrite,
    db: AsyncSession = Depends(get_db_with_tenant),
):
    data = await service.create_invitation(db, user.tenant_id, user.id, body)

    # Trigger async email task
    from app.tasks.email import send_invitation_email

    send_invitation_email.delay(
        invitation_id=str(data.id),
        org_name="",  # Will be fetched in task
        inviter_name=f"{user.first_name} {user.last_name}",
        invitee_email=data.email,
        invitee_name=f"{data.firstName} {data.lastName}",
        module_roles=[r.model_dump() for r in data.moduleRoles],
    )

    return SuccessResponse(data=data)


@router.delete("/invitations/{invitation_id}")
async def cancel_invitation(
    invitation_id: uuid.UUID,
    user: CurrentUser = AdminWrite,
    db: AsyncSession = Depends(get_db_with_tenant),
):
    await service.cancel_invitation(db, user.tenant_id, invitation_id)
    return SuccessResponse(data={"message": "Invitation cancelled"})
```

- [ ] **Step 2: Commit**

```bash
git add app/modules/admin/router.py
git commit -m "feat(server): admin router — all CRUD endpoints for org, branding, users, invitations"
```

---

### Task 14: Account Module

**Files:**
- Create: `server/app/account/__init__.py`
- Create: `server/app/account/schemas.py`
- Create: `server/app/account/service.py`
- Create: `server/app/account/router.py`

- [ ] **Step 1: Create `server/app/account/__init__.py`**

```python
```

- [ ] **Step 2: Create `server/app/account/schemas.py`**

```python
from pydantic import BaseModel


class ProfileResponse(BaseModel):
    id: str
    email: str
    firstName: str
    lastName: str
    phone: str | None = None
    address: dict | None = None

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    firstName: str | None = None
    lastName: str | None = None
    phone: str | None = None
    address: dict | None = None


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str
```

- [ ] **Step 3: Create `server/app/account/service.py`**

```python
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.account.schemas import ChangePasswordRequest, ProfileResponse, UpdateProfileRequest
from app.auth.service import hash_password, verify_password
from app.modules.admin.models import User
from app.shared.exceptions import not_found, validation_error


async def get_profile(db: AsyncSession, user_id: uuid.UUID) -> ProfileResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise not_found("User not found")
    return ProfileResponse(
        id=str(user.id),
        email=user.email,
        firstName=user.first_name,
        lastName=user.last_name,
        phone=user.phone,
        address=user.address,
    )


async def update_profile(
    db: AsyncSession, user_id: uuid.UUID, data: UpdateProfileRequest
) -> ProfileResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise not_found("User not found")

    if data.firstName is not None:
        user.first_name = data.firstName
    if data.lastName is not None:
        user.last_name = data.lastName
    if data.phone is not None:
        user.phone = data.phone
    if data.address is not None:
        user.address = data.address

    await db.flush()

    return ProfileResponse(
        id=str(user.id),
        email=user.email,
        firstName=user.first_name,
        lastName=user.last_name,
        phone=user.phone,
        address=user.address,
    )


async def change_password(
    db: AsyncSession, user_id: uuid.UUID, data: ChangePasswordRequest
) -> bool:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise not_found("User not found")

    if not user.password_hash:
        raise validation_error("Cannot change password for invited user")

    if not verify_password(data.currentPassword, user.password_hash):
        raise validation_error("Current password is incorrect")

    user.password_hash = hash_password(data.newPassword)
    await db.flush()
    return True
```

- [ ] **Step 4: Create `server/app/account/router.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.account import service
from app.account.schemas import ChangePasswordRequest, ProfileResponse, UpdateProfileRequest
from app.shared.dependencies import CurrentUser, get_current_user, get_db_with_tenant
from app.shared.schemas import SuccessResponse

router = APIRouter(prefix="/api/v1/account", tags=["account"])


@router.get("/profile", response_model=SuccessResponse[ProfileResponse])
async def get_profile(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_with_tenant),
):
    data = await service.get_profile(db, user.id)
    return SuccessResponse(data=data)


@router.put("/profile", response_model=SuccessResponse[ProfileResponse])
async def update_profile(
    body: UpdateProfileRequest,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_with_tenant),
):
    data = await service.update_profile(db, user.id, body)
    return SuccessResponse(data=data)


@router.put("/password")
async def change_password(
    body: ChangePasswordRequest,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_with_tenant),
):
    await service.change_password(db, user.id, body)
    return SuccessResponse(data={"message": "Password updated"})
```

- [ ] **Step 5: Commit**

```bash
git add app/account/
git commit -m "feat(server): account module — profile and password change endpoints"
```

---

### Task 15: Celery — App Config, Email Tasks, Audit Task

**Files:**
- Create: `server/app/tasks/__init__.py`
- Create: `server/app/tasks/celery_app.py`
- Create: `server/app/tasks/email.py`
- Create: `server/app/tasks/audit.py`

- [ ] **Step 1: Create `server/app/tasks/__init__.py`**

```python
```

- [ ] **Step 2: Create `server/app/tasks/celery_app.py`**

```python
from celery import Celery

from app.config import settings

celery_app = Celery(
    "invictus",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    task_routes={
        "app.tasks.email.*": {"queue": "email"},
        "app.tasks.audit.*": {"queue": "default"},
    },
)

celery_app.autodiscover_tasks(["app.tasks"])
```

- [ ] **Step 3: Create `server/app/tasks/email.py`**

```python
import structlog

from app.config import settings
from app.tasks.celery_app import celery_app

logger = structlog.get_logger()


def _send_email(to: str, subject: str, html: str) -> None:
    if settings.EMAIL_DRY_RUN:
        logger.info("DRY RUN email", to=to, subject=subject, html_length=len(html))
        return

    import resend

    resend.api_key = settings.RESEND_API_KEY
    resend.Emails.send(
        {
            "from": settings.EMAIL_FROM,
            "to": to,
            "subject": subject,
            "html": html,
        }
    )


@celery_app.task(
    name="app.tasks.email.send_invitation_email",
    bind=True,
    max_retries=3,
    default_retry_delay=10,
)
def send_invitation_email(
    self,
    invitation_id: str,
    org_name: str,
    inviter_name: str,
    invitee_email: str,
    invitee_name: str,
    module_roles: list[dict],
):
    try:
        roles_text = ", ".join(
            f"{r['moduleSlug'].capitalize()}: {r['role'].capitalize()}" for r in module_roles
        )

        html = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've been invited to join {org_name or 'the organization'}</h2>
            <p>Hi {invitee_name},</p>
            <p>{inviter_name} has invited you to join the team with the following roles:</p>
            <p><strong>{roles_text}</strong></p>
            <p>Click the link below to accept the invitation and set up your account:</p>
            <a href="https://app.invictus.ai/invite/{invitation_id}"
               style="display: inline-block; padding: 12px 24px; background: #1E3A5F; color: white; text-decoration: none; border-radius: 6px;">
                Accept Invitation
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 24px;">
                This invitation expires in 7 days.
            </p>
        </div>
        """

        _send_email(
            to=invitee_email,
            subject=f"You're invited to join {org_name or 'Invictus'}",
            html=html,
        )

        logger.info("invitation_email_sent", invitation_id=invitation_id, to=invitee_email)

    except Exception as exc:
        logger.error("invitation_email_failed", invitation_id=invitation_id, error=str(exc))
        raise self.retry(exc=exc, countdown=10 * (2 ** self.request.retries))


@celery_app.task(name="app.tasks.email.send_password_reset_email", bind=True, max_retries=3)
def send_password_reset_email(self, user_id: str, email: str, reset_token: str):
    try:
        html = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>Click the link below to reset your password:</p>
            <a href="https://app.invictus.ai/reset-password?token={reset_token}"
               style="display: inline-block; padding: 12px 24px; background: #1E3A5F; color: white; text-decoration: none; border-radius: 6px;">
                Reset Password
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 24px;">
                This link expires in 1 hour. If you didn't request this, you can ignore this email.
            </p>
        </div>
        """

        _send_email(to=email, subject="Reset your Invictus password", html=html)
        logger.info("password_reset_email_sent", user_id=user_id)

    except Exception as exc:
        logger.error("password_reset_email_failed", user_id=user_id, error=str(exc))
        raise self.retry(exc=exc, countdown=10 * (2 ** self.request.retries))
```

- [ ] **Step 4: Create `server/app/tasks/audit.py`**

```python
import asyncio
import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.config import settings
from app.tasks.celery_app import celery_app

logger = structlog.get_logger()


def _get_sync_session():
    """Create a fresh async session for the Celery worker (runs in its own event loop)."""
    engine = create_async_engine(settings.DATABASE_URL, pool_size=5)
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@celery_app.task(name="app.tasks.audit.write_audit_log")
def write_audit_log(
    tenant_id: str,
    user_id: str | None,
    action: str,
    resource_type: str,
    resource_id: str | None,
    metadata: dict | None = None,
):
    async def _write():
        session_factory = _get_sync_session()
        async with session_factory() as session:
            await session.execute(
                text(
                    """
                    INSERT INTO admin.audit_logs (id, tenant_id, user_id, action, resource_type, resource_id, metadata, created_at)
                    VALUES (:id, :tenant_id, :user_id, :action, :resource_type, :resource_id, :metadata, :created_at)
                    """
                ),
                {
                    "id": str(uuid.uuid4()),
                    "tenant_id": tenant_id,
                    "user_id": user_id,
                    "action": action,
                    "resource_type": resource_type,
                    "resource_id": resource_id,
                    "metadata": __import__("json").dumps(metadata) if metadata else None,
                    "created_at": datetime.now(timezone.utc),
                },
            )
            await session.commit()

    try:
        asyncio.run(_write())
        logger.info("audit_log_written", action=action, resource_type=resource_type)
    except Exception as exc:
        logger.error("audit_log_failed", action=action, error=str(exc))
        # Don't retry — audit is best-effort
```

- [ ] **Step 5: Commit**

```bash
git add app/tasks/
git commit -m "feat(server): Celery app with email (Resend) and audit log tasks"
```

---

### Task 16: FastAPI App Factory (main.py)

**Files:**
- Create: `server/app/main.py`

- [ ] **Step 1: Create `server/app/main.py`**

```python
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.shared.exceptions import AppException, app_exception_handler
from app.shared.middleware import RateLimitMiddleware, RequestLoggingMiddleware, TenantContextMiddleware

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer() if settings.ENVIRONMENT == "development" else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(20),  # INFO level
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("server_starting", environment=settings.ENVIRONMENT)
    yield
    logger.info("server_stopping")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Invictus AI",
        description="Wealth Management Platform API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Exception handlers
    app.add_exception_handler(AppException, app_exception_handler)

    # Middleware (order matters — outermost first)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RateLimitMiddleware, requests_per_minute=100)
    app.add_middleware(TenantContextMiddleware)

    # Routers
    from app.auth.router import router as auth_router
    from app.modules.admin.router import router as admin_router
    from app.account.router import router as account_router

    app.include_router(auth_router)
    app.include_router(admin_router)
    app.include_router(account_router)

    # Health check
    @app.get("/api/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
```

- [ ] **Step 2: Commit**

```bash
git add app/main.py
git commit -m "feat(server): FastAPI app factory with middleware, routers, and health check"
```

---

### Task 17: Seed Script

**Files:**
- Create: `server/scripts/seed.py`

- [ ] **Step 1: Create `server/scripts/seed.py`**

```python
"""
Seed script — populates the database with test data matching the frontend MSW mocks.
Run: python scripts/seed.py
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.auth.service import hash_password
from app.config import settings

# Fixed UUIDs for predictable seeding
ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
USMAN_ID = uuid.UUID("00000000-0000-0000-0000-000000000010")
PINE_ID = uuid.UUID("00000000-0000-0000-0000-000000000011")
JOHN_ID = uuid.UUID("00000000-0000-0000-0000-000000000012")
SARAH_ID = uuid.UUID("00000000-0000-0000-0000-000000000013")
RAOOF_ID = uuid.UUID("00000000-0000-0000-0000-000000000014")

PASSWORD_HASH = hash_password("password123")


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as db:
        # Disable RLS for seeding
        await db.execute(text("SET session_replication_role = 'replica'"))

        # --- Organization ---
        await db.execute(text("DELETE FROM admin.organizations WHERE id = :id"), {"id": str(ORG_ID)})
        await db.execute(
            text("""
                INSERT INTO admin.organizations (id, name, registration_number, website, currency, timezone, support_email, status, address, created_at, updated_at)
                VALUES (:id, :name, :reg, :website, :currency, :tz, :email, 'active', :address, NOW(), NOW())
            """),
            {
                "id": str(ORG_ID),
                "name": "Watar Partners",
                "reg": "WP-2024-001",
                "website": "https://watar.com",
                "currency": "USD",
                "tz": "Asia/Dubai",
                "email": "support@watar.com",
                "address": '{"line1": "123 Financial District", "city": "Dubai", "state": "Dubai", "postalCode": "00000", "country": "UAE"}',
            },
        )

        # --- Users ---
        users = [
            (USMAN_ID, "usman@watar.com", "Usman", "Al-Rashid"),
            (PINE_ID, "pine@watar.com", "Pine", "Anderson"),
            (JOHN_ID, "john@watar.com", "John", "Smith"),
            (SARAH_ID, "sarah@watar.com", "Sarah", "Johnson"),
            (RAOOF_ID, "raoof@watar.com", "Raoof", "Naushad"),
        ]

        # Clean existing
        for user_id, _, _, _ in users:
            await db.execute(text("DELETE FROM admin.user_module_roles WHERE user_id = :id"), {"id": str(user_id)})
            await db.execute(text("DELETE FROM admin.users WHERE id = :id"), {"id": str(user_id)})

        for user_id, email, first, last in users:
            status = "invited" if user_id == SARAH_ID else "active"
            pw = PASSWORD_HASH if status == "active" else None
            await db.execute(
                text("""
                    INSERT INTO admin.users (id, tenant_id, email, password_hash, first_name, last_name, status, created_at, updated_at)
                    VALUES (:id, :tenant_id, :email, :pw, :first, :last, :status, NOW(), NOW())
                """),
                {
                    "id": str(user_id),
                    "tenant_id": str(ORG_ID),
                    "email": email,
                    "pw": pw,
                    "first": first,
                    "last": last,
                    "status": status,
                },
            )

        # --- Module Roles ---
        roles = [
            # Usman — Owner of everything
            (USMAN_ID, "admin", "owner"), (USMAN_ID, "deals", "owner"), (USMAN_ID, "engage", "owner"),
            (USMAN_ID, "plan", "owner"), (USMAN_ID, "insights", "owner"), (USMAN_ID, "tools", "owner"),
            # Pine — Manager
            (PINE_ID, "deals", "manager"), (PINE_ID, "engage", "manager"), (PINE_ID, "insights", "manager"),
            # John — Analyst
            (JOHN_ID, "deals", "analyst"), (JOHN_ID, "engage", "analyst"), (JOHN_ID, "insights", "analyst"),
            # Sarah — Invited, just deals analyst
            (SARAH_ID, "deals", "analyst"),
            # Raoof — Admin owner + various
            (RAOOF_ID, "admin", "owner"), (RAOOF_ID, "deals", "manager"),
            (RAOOF_ID, "engage", "manager"), (RAOOF_ID, "insights", "analyst"),
        ]

        for user_id, module_slug, role in roles:
            await db.execute(
                text("""
                    INSERT INTO admin.user_module_roles (id, tenant_id, user_id, module_slug, role, created_at)
                    VALUES (:id, :tenant_id, :user_id, :module_slug, :role, NOW())
                """),
                {
                    "id": str(uuid.uuid4()),
                    "tenant_id": str(ORG_ID),
                    "user_id": str(user_id),
                    "module_slug": module_slug,
                    "role": role,
                },
            )

        # --- Branding ---
        await db.execute(text("DELETE FROM admin.org_branding WHERE tenant_id = :id"), {"id": str(ORG_ID)})
        await db.execute(
            text("""
                INSERT INTO admin.org_branding (id, tenant_id, header_logo, brand_color, email_footer, created_at, updated_at)
                VALUES (:id, :tenant_id, 'small', '#1E3A5F', 'Watar Partners | Dubai, UAE | support@watar.com', NOW(), NOW())
            """),
            {"id": str(uuid.uuid4()), "tenant_id": str(ORG_ID)},
        )

        # --- Preferences ---
        await db.execute(text("DELETE FROM admin.org_preferences WHERE tenant_id = :id"), {"id": str(ORG_ID)})
        await db.execute(
            text("""
                INSERT INTO admin.org_preferences (id, tenant_id, date_format, number_format, created_at, updated_at)
                VALUES (:id, :tenant_id, 'DD/MM/YYYY', 'en-US', NOW(), NOW())
            """),
            {"id": str(uuid.uuid4()), "tenant_id": str(ORG_ID)},
        )

        # --- Invitations ---
        await db.execute(text("DELETE FROM admin.invitations WHERE tenant_id = :id"), {"id": str(ORG_ID)})
        invitations = [
            ("alex@example.com", "Alex", "Turner", [{"moduleSlug": "deals", "role": "analyst"}, {"moduleSlug": "engage", "role": "analyst"}]),
            ("maria@example.com", "Maria", "Garcia", [{"moduleSlug": "insights", "role": "manager"}]),
        ]
        for email, first, last, module_roles in invitations:
            import json
            await db.execute(
                text("""
                    INSERT INTO admin.invitations (id, tenant_id, email, first_name, last_name, module_roles, status, invited_by, expires_at, created_at)
                    VALUES (:id, :tenant_id, :email, :first, :last, :roles, 'pending', :invited_by, :expires_at, NOW())
                """),
                {
                    "id": str(uuid.uuid4()),
                    "tenant_id": str(ORG_ID),
                    "email": email,
                    "first": first,
                    "last": last,
                    "roles": json.dumps(module_roles),
                    "invited_by": str(RAOOF_ID),
                    "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                },
            )

        await db.execute(text("SET session_replication_role = 'origin'"))
        await db.commit()

    await engine.dispose()
    print("Seed complete!")
    print(f"  Organization: Watar Partners ({ORG_ID})")
    print(f"  Users: 5 (login with raoof@watar.com / password123)")
    print(f"  Invitations: 2 pending")


if __name__ == "__main__":
    asyncio.run(seed())
```

- [ ] **Step 2: Commit**

```bash
git add scripts/seed.py
git commit -m "feat(server): seed script with test data matching frontend MSW mocks"
```

---

### Task 18: Test Setup & Integration Tests

**Files:**
- Create: `server/tests/__init__.py`
- Create: `server/tests/conftest.py`
- Create: `server/tests/unit/__init__.py`
- Create: `server/tests/unit/test_auth_service.py`
- Create: `server/tests/integration/__init__.py`
- Create: `server/tests/integration/test_auth_endpoints.py`
- Create: `server/tests/integration/test_admin_endpoints.py`
- Create: `server/tests/integration/test_account_endpoints.py`

- [ ] **Step 1: Create `server/tests/__init__.py`**

```python
```

- [ ] **Step 2: Create `server/tests/conftest.py`**

```python
import asyncio
import uuid
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.auth.service import create_access_token, hash_password
from app.config import settings
from app.database.base import Base
from app.database.session import get_db
from app.main import app

# Use a test database
TEST_DB_URL = settings.DATABASE_URL.replace("/invictus", "/invictus_test")

engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionFactory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Fixed IDs for tests
TEST_ORG_ID = uuid.UUID("10000000-0000-0000-0000-000000000001")
TEST_USER_ID = uuid.UUID("10000000-0000-0000-0000-000000000010")


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    """Create schemas and tables in test DB."""
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS admin"))
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS platform"))
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionFactory() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def seeded_db(db_session: AsyncSession) -> AsyncSession:
    """Seed test data into the session."""
    pw_hash = hash_password("testpass123")

    await db_session.execute(
        text("""
            INSERT INTO admin.organizations (id, name, currency, timezone, status, created_at, updated_at)
            VALUES (:id, 'Test Org', 'USD', 'UTC', 'active', NOW(), NOW())
            ON CONFLICT (id) DO NOTHING
        """),
        {"id": str(TEST_ORG_ID)},
    )

    await db_session.execute(
        text("""
            INSERT INTO admin.users (id, tenant_id, email, password_hash, first_name, last_name, status, created_at, updated_at)
            VALUES (:id, :tenant_id, 'test@test.com', :pw, 'Test', 'User', 'active', NOW(), NOW())
            ON CONFLICT DO NOTHING
        """),
        {"id": str(TEST_USER_ID), "tenant_id": str(TEST_ORG_ID), "pw": pw_hash},
    )

    await db_session.execute(
        text("""
            INSERT INTO admin.user_module_roles (id, tenant_id, user_id, module_slug, role, created_at)
            VALUES (:id, :tenant_id, :user_id, 'admin', 'owner', NOW())
            ON CONFLICT DO NOTHING
        """),
        {"id": str(uuid.uuid4()), "tenant_id": str(TEST_ORG_ID), "user_id": str(TEST_USER_ID)},
    )

    await db_session.flush()
    return db_session


@pytest.fixture
def auth_headers() -> dict[str, str]:
    """Generate auth headers for the test user."""
    token = create_access_token(
        user_id=TEST_USER_ID,
        tenant_id=TEST_ORG_ID,
        email="test@test.com",
        first_name="Test",
        last_name="User",
        module_roles={"admin": "owner"},
    )
    return {"Authorization": f"Bearer {token}"}
```

- [ ] **Step 3: Create `server/tests/unit/__init__.py`**

```python
```

- [ ] **Step 4: Create `server/tests/unit/test_auth_service.py`**

```python
from app.auth.service import (
    create_access_token,
    decode_access_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
import uuid


def test_hash_and_verify_password():
    password = "secret123"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong", hashed) is False


def test_create_and_decode_access_token():
    user_id = uuid.uuid4()
    tenant_id = uuid.uuid4()
    token = create_access_token(
        user_id=user_id,
        tenant_id=tenant_id,
        email="test@test.com",
        first_name="Test",
        last_name="User",
        module_roles={"admin": "owner"},
    )
    payload = decode_access_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["tenant_id"] == str(tenant_id)
    assert payload["email"] == "test@test.com"
    assert payload["module_roles"] == {"admin": "owner"}


def test_hash_refresh_token_deterministic():
    token = "some-random-token"
    h1 = hash_refresh_token(token)
    h2 = hash_refresh_token(token)
    assert h1 == h2
    assert h1 != token
```

- [ ] **Step 5: Create `server/tests/integration/__init__.py`**

```python
```

- [ ] **Step 6: Create `server/tests/integration/test_auth_endpoints.py`**

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, seeded_db):
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@test.com",
        "password": "testpass123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["token_type"] == "bearer"
    assert "refresh_token" in response.cookies


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, seeded_db):
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@test.com",
        "password": "wrongpass",
    })
    assert response.status_code == 401
    assert response.json()["success"] is False


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient, seeded_db):
    response = await client.post("/api/v1/auth/login", json={
        "email": "nobody@test.com",
        "password": "testpass123",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 7: Create `server/tests/integration/test_admin_endpoints.py`**

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_organization(client: AsyncClient, seeded_db, auth_headers):
    response = await client.get("/api/v1/admin/organization", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == "Test Org"


@pytest.mark.asyncio
async def test_update_organization(client: AsyncClient, seeded_db, auth_headers):
    response = await client.put(
        "/api/v1/admin/organization",
        headers=auth_headers,
        json={"name": "Updated Org"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["name"] == "Updated Org"


@pytest.mark.asyncio
async def test_list_users(client: AsyncClient, seeded_db, auth_headers):
    response = await client.get("/api/v1/admin/users", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 1


@pytest.mark.asyncio
async def test_get_branding_default(client: AsyncClient, seeded_db, auth_headers):
    response = await client.get("/api/v1/admin/branding", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["headerLogo"] == "small"
    assert data["brandColor"] == "#000000"


@pytest.mark.asyncio
async def test_update_branding(client: AsyncClient, seeded_db, auth_headers):
    response = await client.put(
        "/api/v1/admin/branding",
        headers=auth_headers,
        json={"brandColor": "#FF0000"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["brandColor"] == "#FF0000"


@pytest.mark.asyncio
async def test_unauthorized_without_token(client: AsyncClient, seeded_db):
    response = await client.get("/api/v1/admin/organization")
    assert response.status_code == 401
```

- [ ] **Step 8: Create `server/tests/integration/test_account_endpoints.py`**

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_profile(client: AsyncClient, seeded_db, auth_headers):
    response = await client.get("/api/v1/account/profile", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["email"] == "test@test.com"
    assert data["firstName"] == "Test"
    assert data["lastName"] == "User"


@pytest.mark.asyncio
async def test_update_profile(client: AsyncClient, seeded_db, auth_headers):
    response = await client.put(
        "/api/v1/account/profile",
        headers=auth_headers,
        json={"firstName": "Updated", "phone": "+1234567890"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["firstName"] == "Updated"
    assert data["phone"] == "+1234567890"


@pytest.mark.asyncio
async def test_change_password(client: AsyncClient, seeded_db, auth_headers):
    response = await client.put(
        "/api/v1/account/password",
        headers=auth_headers,
        json={"currentPassword": "testpass123", "newPassword": "newpass456"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["message"] == "Password updated"


@pytest.mark.asyncio
async def test_change_password_wrong_current(client: AsyncClient, seeded_db, auth_headers):
    response = await client.put(
        "/api/v1/account/password",
        headers=auth_headers,
        json={"currentPassword": "wrong", "newPassword": "newpass456"},
    )
    assert response.status_code == 422
```

- [ ] **Step 9: Run tests to verify**

Run: `cd server && pytest tests/ -v`
Expected: Unit tests pass. Integration tests require test DB — they will pass once Docker is running and `invictus_test` DB is created.

- [ ] **Step 10: Commit**

```bash
git add tests/
git commit -m "feat(server): test setup with conftest fixtures + unit and integration tests"
```

---

### Task 19: Frontend Integration — Vite Proxy, MSW Toggle, Auth Store

**Files:**
- Modify: `client/vite.config.ts`
- Modify: `client/src/main.tsx`
- Modify: `client/src/store/useAuthStore.ts`

- [ ] **Step 1: Update `client/vite.config.ts`** — add API proxy

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 2: Update `client/src/main.tsx`** — conditionally start MSW

Replace the `enableMocking` function and render call with:

```typescript
async function enableMocking() {
  if (import.meta.env.VITE_USE_REAL_API === 'true') {
    return
  }
  const { worker } = await import('./api/mock/browser')
  return worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
```

- [ ] **Step 3: Update `client/src/store/useAuthStore.ts`** — add real login flow

Update the `login` action to call the real API when `VITE_USE_REAL_API` is set:

```typescript
login: async (email: string, password: string) => {
  if (import.meta.env.VITE_USE_REAL_API === 'true') {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) {
      throw new Error('Invalid credentials')
    }
    const result = await response.json()
    const token = result.data.access_token
    localStorage.setItem('auth_token', token)

    // Decode JWT payload to get user info
    const payload = JSON.parse(atob(token.split('.')[1]))
    const user = {
      id: payload.sub,
      name: `${payload.first_name} ${payload.last_name}`,
      email: payload.email,
      initials: `${payload.first_name[0]}${payload.last_name[0]}`.toUpperCase(),
      firstName: payload.first_name,
      lastName: payload.last_name,
    }
    const moduleRoles = payload.module_roles

    localStorage.setItem('auth_user', JSON.stringify(user))
    localStorage.setItem('auth_module_roles', JSON.stringify(moduleRoles))

    set({
      isAuthenticated: true,
      user,
      tenantId: payload.tenant_id,
      moduleRoles,
    })
  } else {
    // Existing mock login logic (keep as-is for MSW mode)
    // ... existing mock implementation ...
  }
},
```

- [ ] **Step 4: Add `VITE_USE_REAL_API` to `client/.env.development`**

Add to the file (don't overwrite existing content):
```
VITE_USE_REAL_API=false
```

When ready to test against real backend, change to `true`.

- [ ] **Step 5: Commit**

```bash
cd ../client
git add vite.config.ts src/main.tsx src/store/useAuthStore.ts .env.development
git commit -m "feat(client): add Vite proxy, conditional MSW, and real auth login flow"
```

---

### Task 20: Add server/ to .gitignore and Final Wiring

**Files:**
- Modify: `.gitignore` (root)
- Create: `server/.gitignore`

- [ ] **Step 1: Create `server/.gitignore`**

```
__pycache__/
*.py[cod]
*$py.class
.venv/
*.egg-info/
dist/
.env
.ruff_cache/
.pytest_cache/
.mypy_cache/
```

- [ ] **Step 2: Verify the full project runs**

```bash
# Terminal 1: Start infra
cd server && docker compose up -d

# Terminal 2: Setup and run backend
cd server
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
python scripts/create_schemas.py
alembic upgrade head
python scripts/seed.py
uvicorn app.main:app --reload --port 8000

# Terminal 3: Start frontend (with real API)
cd client
# Set VITE_USE_REAL_API=true in .env.development
pnpm dev

# Terminal 4: Run tests
cd server
pytest tests/unit -v
```

- [ ] **Step 3: Commit**

```bash
git add server/.gitignore
git commit -m "chore: add server .gitignore"
```

---

## Verification Checklist

After all tasks are complete:

1. `docker compose up -d` starts PostgreSQL 16 + Redis 7
2. `alembic upgrade head` creates all tables with RLS policies
3. `python scripts/seed.py` populates test data
4. `uvicorn app.main:app --reload` starts the API on port 8000
5. `GET /api/health` returns `{"status": "ok"}`
6. `POST /api/v1/auth/login` with `raoof@watar.com` / `password123` returns JWT
7. All admin endpoints work with the JWT token
8. Frontend with `VITE_USE_REAL_API=true` can login and browse admin pages
9. `celery -A app.tasks.celery_app worker` starts without errors
10. `pytest tests/unit -v` passes
11. Swagger UI at `http://localhost:8000/docs` shows all endpoints
