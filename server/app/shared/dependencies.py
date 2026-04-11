import uuid
from dataclasses import dataclass

from fastapi import Cookie, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
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
        # tenant_id comes from JWT decode as str(uuid.UUID), re-parse to guarantee format
        validated_tid = str(uuid.UUID(tenant_id))
        await session.execute(text(f"SET LOCAL app.current_tenant = '{validated_tid}'"))
    return session
