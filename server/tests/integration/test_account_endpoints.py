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
