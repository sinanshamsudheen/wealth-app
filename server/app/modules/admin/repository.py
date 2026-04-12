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
