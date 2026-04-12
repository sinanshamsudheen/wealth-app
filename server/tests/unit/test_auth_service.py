import uuid

from app.auth.service import (
    create_access_token,
    decode_access_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)


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
