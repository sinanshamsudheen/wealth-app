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
