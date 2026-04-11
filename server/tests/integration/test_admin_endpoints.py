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
