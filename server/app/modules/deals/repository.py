import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.deals.models import (
    AssetManager,
    DocumentTemplate,
    InvestmentType,
    Mandate,
    NewsItem,
    Opportunity,
)


# --- Investment Types ---
async def list_investment_types(
    db: AsyncSession, tenant_id: uuid.UUID
) -> list[InvestmentType]:
    result = await db.execute(
        select(InvestmentType)
        .where(InvestmentType.tenant_id == tenant_id)
        .order_by(InvestmentType.sort_order, InvestmentType.name)
    )
    return list(result.scalars().all())


async def get_investment_type(
    db: AsyncSession, tenant_id: uuid.UUID, type_id: uuid.UUID
) -> InvestmentType | None:
    result = await db.execute(
        select(InvestmentType).where(
            InvestmentType.tenant_id == tenant_id, InvestmentType.id == type_id
        )
    )
    return result.scalar_one_or_none()


async def create_investment_type(
    db: AsyncSession, tenant_id: uuid.UUID, data: dict
) -> InvestmentType:
    inv_type = InvestmentType(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        name=data["name"],
        slug=data["slug"],
        snapshot_config=data["snapshot_config"],
    )
    db.add(inv_type)
    await db.flush()
    return inv_type


async def update_investment_type(
    db: AsyncSession, tenant_id: uuid.UUID, type_id: uuid.UUID, data: dict
) -> InvestmentType | None:
    inv_type = await get_investment_type(db, tenant_id, type_id)
    if not inv_type:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(inv_type, key, value)
    await db.flush()
    return inv_type


async def delete_investment_type(
    db: AsyncSession, tenant_id: uuid.UUID, type_id: uuid.UUID
) -> InvestmentType | None:
    inv_type = await get_investment_type(db, tenant_id, type_id)
    if not inv_type:
        return None
    await db.delete(inv_type)
    await db.flush()
    return inv_type


# --- Document Templates ---
async def list_templates(
    db: AsyncSession, tenant_id: uuid.UUID, investment_type_id: uuid.UUID | None = None
) -> list[DocumentTemplate]:
    stmt = select(DocumentTemplate).where(DocumentTemplate.tenant_id == tenant_id)
    if investment_type_id is not None:
        stmt = stmt.where(DocumentTemplate.investment_type_id == investment_type_id)
    stmt = stmt.order_by(DocumentTemplate.sort_order, DocumentTemplate.name)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_template(
    db: AsyncSession, tenant_id: uuid.UUID, template_id: uuid.UUID
) -> DocumentTemplate | None:
    result = await db.execute(
        select(DocumentTemplate).where(
            DocumentTemplate.tenant_id == tenant_id, DocumentTemplate.id == template_id
        )
    )
    return result.scalar_one_or_none()


async def update_template(
    db: AsyncSession, tenant_id: uuid.UUID, template_id: uuid.UUID, data: dict
) -> DocumentTemplate | None:
    template = await get_template(db, tenant_id, template_id)
    if not template:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(template, key, value)
    await db.flush()
    return template


# --- Mandates ---
async def list_mandates(
    db: AsyncSession, tenant_id: uuid.UUID, status: str | None = None
) -> list[Mandate]:
    stmt = select(Mandate).where(Mandate.tenant_id == tenant_id)
    if status is not None:
        stmt = stmt.where(Mandate.status == status)
    stmt = stmt.order_by(Mandate.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_mandate(
    db: AsyncSession, tenant_id: uuid.UUID, mandate_id: uuid.UUID
) -> Mandate | None:
    result = await db.execute(
        select(Mandate).where(
            Mandate.tenant_id == tenant_id, Mandate.id == mandate_id
        )
    )
    return result.scalar_one_or_none()


async def create_mandate(
    db: AsyncSession, tenant_id: uuid.UUID, data: dict
) -> Mandate:
    mandate = Mandate(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        **data,
    )
    db.add(mandate)
    await db.flush()
    return mandate


async def update_mandate(
    db: AsyncSession, tenant_id: uuid.UUID, mandate_id: uuid.UUID, data: dict
) -> Mandate | None:
    mandate = await get_mandate(db, tenant_id, mandate_id)
    if not mandate:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(mandate, key, value)
    await db.flush()
    return mandate


async def delete_mandate(
    db: AsyncSession, tenant_id: uuid.UUID, mandate_id: uuid.UUID
) -> Mandate | None:
    mandate = await get_mandate(db, tenant_id, mandate_id)
    if not mandate:
        return None
    await db.delete(mandate)
    await db.flush()
    return mandate


# --- Opportunities ---
async def list_opportunities(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    pipeline_status: str | None = None,
    assigned_to: uuid.UUID | None = None,
) -> list[Opportunity]:
    stmt = select(Opportunity).where(Opportunity.tenant_id == tenant_id)
    if pipeline_status is not None:
        stmt = stmt.where(Opportunity.pipeline_status == pipeline_status)
    if assigned_to is not None:
        stmt = stmt.where(Opportunity.assigned_to == assigned_to)
    stmt = stmt.order_by(Opportunity.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_opportunity(
    db: AsyncSession, tenant_id: uuid.UUID, opp_id: uuid.UUID
) -> Opportunity | None:
    result = await db.execute(
        select(Opportunity).where(
            Opportunity.tenant_id == tenant_id, Opportunity.id == opp_id
        )
    )
    return result.scalar_one_or_none()


async def create_opportunity(
    db: AsyncSession, tenant_id: uuid.UUID, data: dict
) -> Opportunity:
    opp = Opportunity(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        **data,
    )
    db.add(opp)
    await db.flush()
    await db.refresh(opp)
    return opp


async def update_opportunity(
    db: AsyncSession, tenant_id: uuid.UUID, opp_id: uuid.UUID, data: dict
) -> Opportunity | None:
    opp = await get_opportunity(db, tenant_id, opp_id)
    if not opp:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(opp, key, value)
    await db.flush()
    await db.refresh(opp)
    return opp


async def delete_opportunity(
    db: AsyncSession, tenant_id: uuid.UUID, opp_id: uuid.UUID
) -> Opportunity | None:
    opp = await get_opportunity(db, tenant_id, opp_id)
    if not opp:
        return None
    await db.delete(opp)
    await db.flush()
    return opp


async def count_opportunities_by_status(
    db: AsyncSession, tenant_id: uuid.UUID
) -> list[tuple[str, int]]:
    result = await db.execute(
        select(Opportunity.pipeline_status, func.count())
        .where(Opportunity.tenant_id == tenant_id)
        .group_by(Opportunity.pipeline_status)
    )
    return list(result.all())


# --- Asset Managers ---
async def list_asset_managers(
    db: AsyncSession, tenant_id: uuid.UUID, type_filter: str | None = None
) -> list[AssetManager]:
    stmt = select(AssetManager).where(AssetManager.tenant_id == tenant_id)
    if type_filter is not None:
        stmt = stmt.where(AssetManager.type == type_filter)
    stmt = stmt.order_by(AssetManager.name)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_asset_manager(
    db: AsyncSession, tenant_id: uuid.UUID, am_id: uuid.UUID
) -> AssetManager | None:
    result = await db.execute(
        select(AssetManager).where(
            AssetManager.tenant_id == tenant_id, AssetManager.id == am_id
        )
    )
    return result.scalar_one_or_none()


async def create_asset_manager(
    db: AsyncSession, am: AssetManager
) -> AssetManager:
    db.add(am)
    await db.flush()
    return am


async def update_asset_manager(
    db: AsyncSession, am: AssetManager, data: dict
) -> AssetManager:
    for key, value in data.items():
        if value is not None:
            setattr(am, key, value)
    await db.flush()
    return am


async def delete_asset_manager(
    db: AsyncSession, am: AssetManager
) -> AssetManager:
    await db.delete(am)
    await db.flush()
    return am


# --- News ---
async def list_news_items(
    db: AsyncSession, tenant_id: uuid.UUID, category: str | None = None, limit: int = 50
) -> list[NewsItem]:
    stmt = select(NewsItem).where(NewsItem.tenant_id == tenant_id)
    if category is not None:
        stmt = stmt.where(NewsItem.category == category)
    stmt = stmt.order_by(NewsItem.generated_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


# --- Dashboard helpers ---
async def get_mandate_allocation_summaries(
    db: AsyncSession, tenant_id: uuid.UUID
) -> list[tuple]:
    """Get active mandates with opportunity counts."""
    result = await db.execute(
        select(
            Mandate.id,
            Mandate.name,
            Mandate.target_allocation,
            func.count(Opportunity.id),
        )
        .outerjoin(
            Opportunity,
            (Opportunity.tenant_id == Mandate.tenant_id)
            & (Opportunity.pipeline_status != "rejected"),
        )
        .where(Mandate.tenant_id == tenant_id, Mandate.status == "active")
        .group_by(Mandate.id, Mandate.name, Mandate.target_allocation)
    )
    return list(result.all())
