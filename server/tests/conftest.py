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
