# Deals Module Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Deals module foundation — backend schema, models, API endpoints, and frontend pages for Settings, Mandates, and Opportunities pipeline. By the end, users can configure investment types, create mandates, and manage an opportunity pipeline.

**Architecture:** Backend follows the existing FastAPI layered pattern (router → service → repository → models → schemas) in `server/app/modules/deals/`. Frontend adds `client/src/modules/deals/` with pages, components, store, API client, and types following the admin module pattern. MSW mock handlers provide frontend data during development.

**Tech Stack:** Python 3.12+, FastAPI, SQLAlchemy 2.0 (async), Alembic, PostgreSQL 16, React 19, TypeScript, Zustand, shadcn/ui, Tailwind CSS, MSW 2

**Spec:** `docs/superpowers/specs/2026-04-11-deals-module-design.md`

**Phase scope:** Tasks 1-5 cover backend foundation, frontend foundation, settings, mandates, and opportunities. Later phases cover workspace, document collaboration, email hub, Google Drive, asset managers, news, and dashboard.

---

## File Map

### Backend (new files)

```
server/app/modules/deals/
  __init__.py
  models.py          — SQLAlchemy models for deals schema (investment_types, mandates, opportunities, asset_managers, etc.)
  schemas.py         — Pydantic request/response schemas
  repository.py      — Database queries
  service.py         — Business logic
  router.py          — FastAPI endpoint definitions
```

### Backend (modified files)

```
server/app/main.py                    — Register deals router
server/scripts/seed.py                — Add deals seed data
server/app/database/migrations/       — New Alembic migration for deals schema
```

### Frontend (new files)

```
client/src/modules/deals/
  types.ts                             — TypeScript interfaces
  api.ts                               — API client functions
  store.ts                             — Zustand store
  pages/
    DealsLayout.tsx                    — Module layout with Outlet
    DashboardPage.tsx                  — Placeholder for Phase 2
    MandateListPage.tsx                — List all mandates
    MandateDetailPage.tsx              — Mandate detail with tabs
    OpportunityListPage.tsx            — Pipeline list with status filters
    SettingsPage.tsx                   — Investment type + template config
  components/
    mandates/
      MandateCard.tsx                  — Mandate summary card
      StrategyOverview.tsx             — Structured mandate fields
      MandateForm.tsx                  — Create/edit mandate dialog
      AssetAllocationTable.tsx         — Asset class allocation editor
    opportunities/
      OpportunityTable.tsx             — Table with status tabs
      PipelineStatusBadge.tsx          — New/Active/Archived/Ignored badge
      FitScoreBadge.tsx                — Strong/Moderate/Weak indicator
      CreateOpportunityDialog.tsx      — Manual opportunity creation
    settings/
      InvestmentTypeList.tsx           — List of configured types
      SnapshotFieldEditor.tsx          — Sections + fields CRUD
      FieldConfigRow.tsx               — Single field config
      TemplateList.tsx                 — Document templates per type
      PromptEditor.tsx                 — Template prompt editing
```

### Frontend (modified files)

```
client/src/App.tsx                     — Add deals routes
client/src/hooks/useActiveModule.ts    — Update deals nav items
client/src/pages/ModulesHomePage.tsx    — Enable deals module (path no longer null)
```

---

## Task 1: Backend — Database Schema & Models

**Files:**
- Create: `server/app/modules/deals/__init__.py`
- Create: `server/app/modules/deals/models.py`
- Modify: `server/app/main.py` (import deals models for Alembic discovery)

### Steps

- [ ] **Step 1: Create the deals module package**

```bash
mkdir -p server/app/modules/deals
touch server/app/modules/deals/__init__.py
```

- [ ] **Step 2: Create SQLAlchemy models**

Create `server/app/modules/deals/models.py`:

```python
"""Deals module SQLAlchemy models.

All tables in the 'deals' schema with tenant isolation via TenantMixin.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TenantMixin, TimestampMixin


# ── Investment Types ────────────────────────────────────────────────


class InvestmentType(Base, TenantMixin, TimestampMixin):
    """Configurable investment type with snapshot field definitions."""

    __tablename__ = "investment_types"
    __table_args__ = (
        UniqueConstraint("tenant_id", "slug", name="uq_investment_types_tenant_slug"),
        {"schema": "deals"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    snapshot_config: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Relationships
    document_templates: Mapped[list[DocumentTemplate]] = relationship(
        back_populates="investment_type", lazy="selectin"
    )


# ── Document Templates ──────────────────────────────────────────────


class DocumentTemplate(Base, TenantMixin, TimestampMixin):
    """Prompt template for AI document generation, per investment type."""

    __tablename__ = "document_templates"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id", "investment_type_id", "slug",
            name="uq_document_templates_tenant_type_slug",
        ),
        {"schema": "deals"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    investment_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("deals.investment_types.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), nullable=False)
    prompt_template: Mapped[str] = mapped_column(Text, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    investment_type: Mapped[InvestmentType] = relationship(back_populates="document_templates")


# ── Mandates ────────────────────────────────────────────────────────


class Mandate(Base, TenantMixin, TimestampMixin):
    """Firm-wide investment criteria document."""

    __tablename__ = "mandates"
    __table_args__ = (
        Index("idx_mandates_tenant_status", "tenant_id", "status"),
        {"schema": "deals"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    target_allocation: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    expected_return: Mapped[str | None] = mapped_column(String(100), nullable=True)
    time_horizon: Mapped[str | None] = mapped_column(String(100), nullable=True)
    investment_types: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    asset_allocation: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    target_sectors: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    geographic_focus: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    investment_criteria: Mapped[str | None] = mapped_column(Text, nullable=True)
    investment_constraints: Mapped[str | None] = mapped_column(Text, nullable=True)
    investment_strategy: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)


# ── Asset Managers ──────────────────────────────────────────────────


class AssetManager(Base, TenantMixin, TimestampMixin):
    """Registry of external firms that send opportunities."""

    __tablename__ = "asset_managers"
    __table_args__ = (
        Index("idx_asset_managers_tenant", "tenant_id"),
        {"schema": "deals"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    fund_info: Mapped[dict] = mapped_column(JSONB, default=dict)
    firm_info: Mapped[dict] = mapped_column(JSONB, default=dict)
    strategy: Mapped[dict] = mapped_column(JSONB, default=dict)
    characteristics: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_by_type: Mapped[str] = mapped_column(String(50), default="system")


# ── Opportunities ───────────────────────────────────────────────────


class Opportunity(Base, TenantMixin, TimestampMixin):
    """A deal opportunity in the pipeline."""

    __tablename__ = "opportunities"
    __table_args__ = (
        Index("idx_opportunities_tenant_status", "tenant_id", "pipeline_status"),
        Index("idx_opportunities_tenant_assigned", "tenant_id", "assigned_to"),
        Index("idx_opportunities_asset_manager", "asset_manager_id"),
        {"schema": "deals"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    investment_type_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("deals.investment_types.id"),
        nullable=True,
    )
    pipeline_status: Mapped[str] = mapped_column(String(20), default="new")
    asset_manager_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("deals.asset_managers.id"),
        nullable=True,
    )
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    snapshot_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    snapshot_citations: Mapped[dict] = mapped_column(JSONB, default=dict)
    source_type: Mapped[str] = mapped_column(String(20), nullable=False, default="manual")
    source_email_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    mandate_fits: Mapped[list] = mapped_column(JSONB, default=list)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    # Relationships
    investment_type: Mapped[InvestmentType | None] = relationship(lazy="selectin")
    asset_manager: Mapped[AssetManager | None] = relationship(lazy="selectin")
```

- [ ] **Step 3: Create the deals PostgreSQL schema and generate Alembic migration**

```bash
cd server

# Create the 'deals' schema in PostgreSQL
python -c "
import asyncio
from sqlalchemy import text
from app.database.session import engine

async def create_schema():
    async with engine.begin() as conn:
        await conn.execute(text('CREATE SCHEMA IF NOT EXISTS deals'))
    print('deals schema created')

asyncio.run(create_schema())
"

# Generate migration
alembic revision --autogenerate -m "deals: add investment_types, document_templates, mandates, asset_managers, opportunities"
```

- [ ] **Step 4: Run the migration**

```bash
cd server
alembic upgrade head
```

Expected: Tables created in `deals` schema. Verify:
```bash
python -c "
import asyncio
from sqlalchemy import text
from app.database.session import engine

async def check():
    async with engine.begin() as conn:
        result = await conn.execute(text(\"SELECT table_name FROM information_schema.tables WHERE table_schema = 'deals' ORDER BY table_name\"))
        for row in result:
            print(row[0])

asyncio.run(check())
"
```

Expected output:
```
asset_managers
document_templates
investment_types
mandates
opportunities
```

- [ ] **Step 5: Ensure models are imported for Alembic discovery**

Modify `server/app/main.py` — add import near existing model imports:

```python
# After existing imports, add:
import app.modules.deals.models  # noqa: F401 — needed for Alembic model discovery
```

- [ ] **Step 6: Enable RLS on deals tables**

Add to the Alembic migration (or run manually for dev):

```bash
python -c "
import asyncio
from sqlalchemy import text
from app.database.session import engine

async def enable_rls():
    async with engine.begin() as conn:
        tables = ['investment_types', 'document_templates', 'mandates', 'asset_managers', 'opportunities']
        for table in tables:
            await conn.execute(text(f'ALTER TABLE deals.{table} ENABLE ROW LEVEL SECURITY'))
            await conn.execute(text(f\"\"\"
                CREATE POLICY tenant_isolation ON deals.{table}
                USING (tenant_id = current_setting('app.current_tenant')::uuid)
            \"\"\"))
            print(f'RLS enabled on deals.{table}')

asyncio.run(enable_rls())
"
```

- [ ] **Step 7: Commit**

```bash
cd server
git add app/modules/deals/ app/main.py app/database/migrations/versions/
git commit -m "feat(deals): add database schema and SQLAlchemy models

Add investment_types, document_templates, mandates, asset_managers,
and opportunities tables in the deals schema with RLS policies."
```

---

## Task 2: Backend — Schemas, Repository, Service, Router

**Files:**
- Create: `server/app/modules/deals/schemas.py`
- Create: `server/app/modules/deals/repository.py`
- Create: `server/app/modules/deals/service.py`
- Create: `server/app/modules/deals/router.py`
- Modify: `server/app/main.py` (register router)

### Steps

- [ ] **Step 1: Create Pydantic schemas**

Create `server/app/modules/deals/schemas.py`:

```python
"""Deals module Pydantic schemas for request/response validation."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


# ── Investment Types ────────────────────────────────────────────────


class SnapshotFieldSchema(BaseModel):
    name: str
    type: str  # text, number, currency, percentage, date, select, multi_select, textarea
    required: bool = False
    instruction: str = ""
    options: list[str] | None = None


class SnapshotSectionSchema(BaseModel):
    name: str
    sortOrder: int = 0
    fields: list[SnapshotFieldSchema] = []


class SnapshotConfigSchema(BaseModel):
    sections: list[SnapshotSectionSchema] = []


class InvestmentTypeResponse(BaseModel):
    id: str
    name: str
    slug: str
    isSystem: bool
    sortOrder: int
    snapshotConfig: SnapshotConfigSchema
    createdAt: datetime
    updatedAt: datetime


class InvestmentTypeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=50)
    snapshotConfig: SnapshotConfigSchema = SnapshotConfigSchema()


class InvestmentTypeUpdate(BaseModel):
    name: str | None = None
    snapshotConfig: SnapshotConfigSchema | None = None
    sortOrder: int | None = None


# ── Document Templates ──────────────────────────────────────────────


class DocumentTemplateResponse(BaseModel):
    id: str
    investmentTypeId: str
    name: str
    slug: str
    promptTemplate: str
    isSystem: bool
    sortOrder: int
    createdAt: datetime
    updatedAt: datetime


class DocumentTemplateUpdate(BaseModel):
    promptTemplate: str


# ── Mandates ────────────────────────────────────────────────────────


class AssetAllocationItem(BaseModel):
    assetClass: str
    allocationPct: float = 0.0
    targetReturn: str = ""


class MandateResponse(BaseModel):
    id: str
    name: str
    status: str
    targetAllocation: float | None
    expectedReturn: str | None
    timeHorizon: str | None
    investmentTypes: list[str] | None
    assetAllocation: list[AssetAllocationItem] | None
    targetSectors: list[str] | None
    geographicFocus: list[str] | None
    investmentCriteria: str | None
    investmentConstraints: str | None
    investmentStrategy: str | None
    createdBy: str | None
    createdAt: datetime
    updatedAt: datetime


class MandateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    status: str = "draft"
    targetAllocation: float | None = None
    expectedReturn: str | None = None
    timeHorizon: str | None = None
    investmentTypes: list[str] | None = None
    assetAllocation: list[AssetAllocationItem] | None = None
    targetSectors: list[str] | None = None
    geographicFocus: list[str] | None = None
    investmentCriteria: str | None = None
    investmentConstraints: str | None = None
    investmentStrategy: str | None = None


class MandateUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    targetAllocation: float | None = None
    expectedReturn: str | None = None
    timeHorizon: str | None = None
    investmentTypes: list[str] | None = None
    assetAllocation: list[AssetAllocationItem] | None = None
    targetSectors: list[str] | None = None
    geographicFocus: list[str] | None = None
    investmentCriteria: str | None = None
    investmentConstraints: str | None = None
    investmentStrategy: str | None = None


# ── Opportunities ───────────────────────────────────────────────────


class MandateFitSchema(BaseModel):
    mandateId: str
    fitScore: str  # 'strong', 'moderate', 'weak'
    reasoning: str = ""


class OpportunityResponse(BaseModel):
    id: str
    name: str
    investmentTypeId: str | None
    investmentTypeName: str | None
    pipelineStatus: str
    assetManagerId: str | None
    assetManagerName: str | None
    assignedTo: str | None
    snapshotData: dict
    snapshotCitations: dict
    sourceType: str
    mandateFits: list[MandateFitSchema]
    createdBy: str | None
    createdAt: datetime
    updatedAt: datetime


class OpportunityCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    investmentTypeId: str | None = None
    assetManagerId: str | None = None
    snapshotData: dict = {}
    sourceType: str = "manual"


class OpportunityUpdate(BaseModel):
    name: str | None = None
    investmentTypeId: str | None = None
    pipelineStatus: str | None = None
    assetManagerId: str | None = None
    assignedTo: str | None = None
    snapshotData: dict | None = None
```

- [ ] **Step 2: Create repository layer**

Create `server/app/modules/deals/repository.py`:

```python
"""Deals module database queries."""

from __future__ import annotations

import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.deals.models import (
    AssetManager,
    DocumentTemplate,
    InvestmentType,
    Mandate,
    Opportunity,
)


# ── Investment Types ────────────────────────────────────────────────


async def list_investment_types(db: AsyncSession, tenant_id: uuid.UUID) -> list[InvestmentType]:
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
            InvestmentType.tenant_id == tenant_id,
            InvestmentType.id == type_id,
        )
    )
    return result.scalar_one_or_none()


async def create_investment_type(db: AsyncSession, inv_type: InvestmentType) -> InvestmentType:
    db.add(inv_type)
    await db.flush()
    return inv_type


async def update_investment_type(
    db: AsyncSession, inv_type: InvestmentType, data: dict
) -> InvestmentType:
    for key, value in data.items():
        if value is not None:
            setattr(inv_type, key, value)
    await db.flush()
    return inv_type


async def delete_investment_type(db: AsyncSession, inv_type: InvestmentType) -> None:
    await db.delete(inv_type)
    await db.flush()


# ── Document Templates ──────────────────────────────────────────────


async def list_templates(
    db: AsyncSession, tenant_id: uuid.UUID, investment_type_id: uuid.UUID | None = None
) -> list[DocumentTemplate]:
    stmt = select(DocumentTemplate).where(DocumentTemplate.tenant_id == tenant_id)
    if investment_type_id:
        stmt = stmt.where(DocumentTemplate.investment_type_id == investment_type_id)
    stmt = stmt.order_by(DocumentTemplate.sort_order, DocumentTemplate.name)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_template(
    db: AsyncSession, tenant_id: uuid.UUID, template_id: uuid.UUID
) -> DocumentTemplate | None:
    result = await db.execute(
        select(DocumentTemplate).where(
            DocumentTemplate.tenant_id == tenant_id,
            DocumentTemplate.id == template_id,
        )
    )
    return result.scalar_one_or_none()


async def update_template(
    db: AsyncSession, template: DocumentTemplate, data: dict
) -> DocumentTemplate:
    for key, value in data.items():
        if value is not None:
            setattr(template, key, value)
    await db.flush()
    return template


# ── Mandates ────────────────────────────────────────────────────────


async def list_mandates(
    db: AsyncSession, tenant_id: uuid.UUID, status: str | None = None
) -> list[Mandate]:
    stmt = select(Mandate).where(Mandate.tenant_id == tenant_id)
    if status:
        stmt = stmt.where(Mandate.status == status)
    stmt = stmt.order_by(Mandate.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_mandate(
    db: AsyncSession, tenant_id: uuid.UUID, mandate_id: uuid.UUID
) -> Mandate | None:
    result = await db.execute(
        select(Mandate).where(Mandate.tenant_id == tenant_id, Mandate.id == mandate_id)
    )
    return result.scalar_one_or_none()


async def create_mandate(db: AsyncSession, mandate: Mandate) -> Mandate:
    db.add(mandate)
    await db.flush()
    return mandate


async def update_mandate(db: AsyncSession, mandate: Mandate, data: dict) -> Mandate:
    for key, value in data.items():
        if value is not None:
            setattr(mandate, key, value)
    await db.flush()
    return mandate


async def delete_mandate(db: AsyncSession, mandate: Mandate) -> None:
    await db.delete(mandate)
    await db.flush()


# ── Opportunities ───────────────────────────────────────────────────


async def list_opportunities(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    pipeline_status: str | None = None,
    assigned_to: uuid.UUID | None = None,
) -> list[Opportunity]:
    stmt = select(Opportunity).where(Opportunity.tenant_id == tenant_id)
    if pipeline_status:
        stmt = stmt.where(Opportunity.pipeline_status == pipeline_status)
    if assigned_to:
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


async def create_opportunity(db: AsyncSession, opp: Opportunity) -> Opportunity:
    db.add(opp)
    await db.flush()
    return opp


async def update_opportunity(db: AsyncSession, opp: Opportunity, data: dict) -> Opportunity:
    for key, value in data.items():
        if value is not None:
            setattr(opp, key, value)
    await db.flush()
    return opp


async def delete_opportunity(db: AsyncSession, opp: Opportunity) -> None:
    await db.delete(opp)
    await db.flush()


async def count_opportunities_by_status(
    db: AsyncSession, tenant_id: uuid.UUID
) -> dict[str, int]:
    result = await db.execute(
        select(Opportunity.pipeline_status, func.count())
        .where(Opportunity.tenant_id == tenant_id)
        .group_by(Opportunity.pipeline_status)
    )
    return {row[0]: row[1] for row in result.all()}
```

- [ ] **Step 3: Create service layer**

Create `server/app/modules/deals/service.py`:

```python
"""Deals module business logic."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.deals import repository as repo
from app.modules.deals.models import (
    InvestmentType,
    Mandate,
    Opportunity,
)
from app.modules.deals.schemas import (
    DocumentTemplateResponse,
    DocumentTemplateUpdate,
    InvestmentTypeCreate,
    InvestmentTypeResponse,
    InvestmentTypeUpdate,
    MandateCreate,
    MandateResponse,
    MandateUpdate,
    OpportunityCreate,
    OpportunityResponse,
    OpportunityUpdate,
)
from app.shared.exceptions import not_found, forbidden


# ── Helpers ─────────────────────────────────────────────────────────


def _investment_type_to_response(inv_type: InvestmentType) -> InvestmentTypeResponse:
    return InvestmentTypeResponse(
        id=str(inv_type.id),
        name=inv_type.name,
        slug=inv_type.slug,
        isSystem=inv_type.is_system,
        sortOrder=inv_type.sort_order,
        snapshotConfig=inv_type.snapshot_config,
        createdAt=inv_type.created_at,
        updatedAt=inv_type.updated_at,
    )


def _template_to_response(tpl) -> DocumentTemplateResponse:
    return DocumentTemplateResponse(
        id=str(tpl.id),
        investmentTypeId=str(tpl.investment_type_id),
        name=tpl.name,
        slug=tpl.slug,
        promptTemplate=tpl.prompt_template,
        isSystem=tpl.is_system,
        sortOrder=tpl.sort_order,
        createdAt=tpl.created_at,
        updatedAt=tpl.updated_at,
    )


def _mandate_to_response(mandate: Mandate) -> MandateResponse:
    return MandateResponse(
        id=str(mandate.id),
        name=mandate.name,
        status=mandate.status,
        targetAllocation=float(mandate.target_allocation) if mandate.target_allocation else None,
        expectedReturn=mandate.expected_return,
        timeHorizon=mandate.time_horizon,
        investmentTypes=mandate.investment_types,
        assetAllocation=mandate.asset_allocation,
        targetSectors=mandate.target_sectors,
        geographicFocus=mandate.geographic_focus,
        investmentCriteria=mandate.investment_criteria,
        investmentConstraints=mandate.investment_constraints,
        investmentStrategy=mandate.investment_strategy,
        createdBy=str(mandate.created_by) if mandate.created_by else None,
        createdAt=mandate.created_at,
        updatedAt=mandate.updated_at,
    )


def _opportunity_to_response(opp: Opportunity) -> OpportunityResponse:
    return OpportunityResponse(
        id=str(opp.id),
        name=opp.name,
        investmentTypeId=str(opp.investment_type_id) if opp.investment_type_id else None,
        investmentTypeName=opp.investment_type.name if opp.investment_type else None,
        pipelineStatus=opp.pipeline_status,
        assetManagerId=str(opp.asset_manager_id) if opp.asset_manager_id else None,
        assetManagerName=opp.asset_manager.name if opp.asset_manager else None,
        assignedTo=str(opp.assigned_to) if opp.assigned_to else None,
        snapshotData=opp.snapshot_data,
        snapshotCitations=opp.snapshot_citations,
        sourceType=opp.source_type,
        mandateFits=opp.mandate_fits or [],
        createdBy=str(opp.created_by) if opp.created_by else None,
        createdAt=opp.created_at,
        updatedAt=opp.updated_at,
    )


# ── Investment Types ────────────────────────────────────────────────


async def list_investment_types(
    db: AsyncSession, tenant_id: uuid.UUID
) -> list[InvestmentTypeResponse]:
    types = await repo.list_investment_types(db, tenant_id)
    return [_investment_type_to_response(t) for t in types]


async def get_investment_type(
    db: AsyncSession, tenant_id: uuid.UUID, type_id: uuid.UUID
) -> InvestmentTypeResponse:
    inv_type = await repo.get_investment_type(db, tenant_id, type_id)
    if not inv_type:
        raise not_found("Investment type not found")
    return _investment_type_to_response(inv_type)


async def create_investment_type(
    db: AsyncSession, tenant_id: uuid.UUID, data: InvestmentTypeCreate
) -> InvestmentTypeResponse:
    inv_type = InvestmentType(
        tenant_id=tenant_id,
        name=data.name,
        slug=data.slug,
        is_system=False,
        snapshot_config=data.snapshotConfig.model_dump(),
    )
    created = await repo.create_investment_type(db, inv_type)
    return _investment_type_to_response(created)


async def update_investment_type(
    db: AsyncSession, tenant_id: uuid.UUID, type_id: uuid.UUID, data: InvestmentTypeUpdate
) -> InvestmentTypeResponse:
    inv_type = await repo.get_investment_type(db, tenant_id, type_id)
    if not inv_type:
        raise not_found("Investment type not found")
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.snapshotConfig is not None:
        update_data["snapshot_config"] = data.snapshotConfig.model_dump()
    if data.sortOrder is not None:
        update_data["sort_order"] = data.sortOrder
    updated = await repo.update_investment_type(db, inv_type, update_data)
    return _investment_type_to_response(updated)


async def delete_investment_type(
    db: AsyncSession, tenant_id: uuid.UUID, type_id: uuid.UUID
) -> None:
    inv_type = await repo.get_investment_type(db, tenant_id, type_id)
    if not inv_type:
        raise not_found("Investment type not found")
    if inv_type.is_system:
        raise forbidden("Cannot delete system investment types")
    await repo.delete_investment_type(db, inv_type)


# ── Document Templates ──────────────────────────────────────────────


async def list_templates(
    db: AsyncSession, tenant_id: uuid.UUID, investment_type_id: uuid.UUID | None = None
) -> list[DocumentTemplateResponse]:
    templates = await repo.list_templates(db, tenant_id, investment_type_id)
    return [_template_to_response(t) for t in templates]


async def get_template(
    db: AsyncSession, tenant_id: uuid.UUID, template_id: uuid.UUID
) -> DocumentTemplateResponse:
    tpl = await repo.get_template(db, tenant_id, template_id)
    if not tpl:
        raise not_found("Document template not found")
    return _template_to_response(tpl)


async def update_template(
    db: AsyncSession, tenant_id: uuid.UUID, template_id: uuid.UUID, data: DocumentTemplateUpdate
) -> DocumentTemplateResponse:
    tpl = await repo.get_template(db, tenant_id, template_id)
    if not tpl:
        raise not_found("Document template not found")
    updated = await repo.update_template(db, tpl, {"prompt_template": data.promptTemplate})
    return _template_to_response(updated)


# ── Mandates ────────────────────────────────────────────────────────


async def list_mandates(
    db: AsyncSession, tenant_id: uuid.UUID, status: str | None = None
) -> list[MandateResponse]:
    mandates = await repo.list_mandates(db, tenant_id, status)
    return [_mandate_to_response(m) for m in mandates]


async def get_mandate(
    db: AsyncSession, tenant_id: uuid.UUID, mandate_id: uuid.UUID
) -> MandateResponse:
    mandate = await repo.get_mandate(db, tenant_id, mandate_id)
    if not mandate:
        raise not_found("Mandate not found")
    return _mandate_to_response(mandate)


async def create_mandate(
    db: AsyncSession, tenant_id: uuid.UUID, user_id: uuid.UUID, data: MandateCreate
) -> MandateResponse:
    mandate = Mandate(
        tenant_id=tenant_id,
        name=data.name,
        status=data.status,
        target_allocation=data.targetAllocation,
        expected_return=data.expectedReturn,
        time_horizon=data.timeHorizon,
        investment_types=data.investmentTypes,
        asset_allocation=[a.model_dump() for a in data.assetAllocation] if data.assetAllocation else None,
        target_sectors=data.targetSectors,
        geographic_focus=data.geographicFocus,
        investment_criteria=data.investmentCriteria,
        investment_constraints=data.investmentConstraints,
        investment_strategy=data.investmentStrategy,
        created_by=user_id,
    )
    created = await repo.create_mandate(db, mandate)
    return _mandate_to_response(created)


async def update_mandate(
    db: AsyncSession, tenant_id: uuid.UUID, mandate_id: uuid.UUID, data: MandateUpdate
) -> MandateResponse:
    mandate = await repo.get_mandate(db, tenant_id, mandate_id)
    if not mandate:
        raise not_found("Mandate not found")
    update_data = {}
    for field in ["name", "status", "expected_return", "time_horizon", "investment_criteria",
                   "investment_constraints", "investment_strategy"]:
        camel = _snake_to_camel(field)
        val = getattr(data, camel, None)
        if val is not None:
            update_data[field] = val
    if data.targetAllocation is not None:
        update_data["target_allocation"] = data.targetAllocation
    if data.investmentTypes is not None:
        update_data["investment_types"] = data.investmentTypes
    if data.assetAllocation is not None:
        update_data["asset_allocation"] = [a.model_dump() for a in data.assetAllocation]
    if data.targetSectors is not None:
        update_data["target_sectors"] = data.targetSectors
    if data.geographicFocus is not None:
        update_data["geographic_focus"] = data.geographicFocus
    updated = await repo.update_mandate(db, mandate, update_data)
    return _mandate_to_response(updated)


async def delete_mandate(
    db: AsyncSession, tenant_id: uuid.UUID, mandate_id: uuid.UUID
) -> None:
    mandate = await repo.get_mandate(db, tenant_id, mandate_id)
    if not mandate:
        raise not_found("Mandate not found")
    await repo.delete_mandate(db, mandate)


# ── Opportunities ───────────────────────────────────────────────────


async def list_opportunities(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    pipeline_status: str | None = None,
    assigned_to: uuid.UUID | None = None,
) -> list[OpportunityResponse]:
    opps = await repo.list_opportunities(db, tenant_id, pipeline_status, assigned_to)
    return [_opportunity_to_response(o) for o in opps]


async def get_opportunity(
    db: AsyncSession, tenant_id: uuid.UUID, opp_id: uuid.UUID
) -> OpportunityResponse:
    opp = await repo.get_opportunity(db, tenant_id, opp_id)
    if not opp:
        raise not_found("Opportunity not found")
    return _opportunity_to_response(opp)


async def create_opportunity(
    db: AsyncSession, tenant_id: uuid.UUID, user_id: uuid.UUID, data: OpportunityCreate
) -> OpportunityResponse:
    opp = Opportunity(
        tenant_id=tenant_id,
        name=data.name,
        investment_type_id=uuid.UUID(data.investmentTypeId) if data.investmentTypeId else None,
        asset_manager_id=uuid.UUID(data.assetManagerId) if data.assetManagerId else None,
        snapshot_data=data.snapshotData,
        source_type=data.sourceType,
        created_by=user_id,
    )
    created = await repo.create_opportunity(db, opp)
    # Re-fetch to get relationships loaded
    return await get_opportunity(db, tenant_id, created.id)


async def update_opportunity(
    db: AsyncSession, tenant_id: uuid.UUID, opp_id: uuid.UUID, data: OpportunityUpdate
) -> OpportunityResponse:
    opp = await repo.get_opportunity(db, tenant_id, opp_id)
    if not opp:
        raise not_found("Opportunity not found")
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.pipelineStatus is not None:
        update_data["pipeline_status"] = data.pipelineStatus
    if data.investmentTypeId is not None:
        update_data["investment_type_id"] = uuid.UUID(data.investmentTypeId)
    if data.assetManagerId is not None:
        update_data["asset_manager_id"] = uuid.UUID(data.assetManagerId)
    if data.assignedTo is not None:
        update_data["assigned_to"] = uuid.UUID(data.assignedTo)
    if data.snapshotData is not None:
        update_data["snapshot_data"] = data.snapshotData
    updated = await repo.update_opportunity(db, opp, update_data)
    return await get_opportunity(db, tenant_id, updated.id)


async def delete_opportunity(
    db: AsyncSession, tenant_id: uuid.UUID, opp_id: uuid.UUID
) -> None:
    opp = await repo.get_opportunity(db, tenant_id, opp_id)
    if not opp:
        raise not_found("Opportunity not found")
    await repo.delete_opportunity(db, opp)


# ── Utils ───────────────────────────────────────────────────────────

def _snake_to_camel(name: str) -> str:
    components = name.split("_")
    return components[0] + "".join(x.title() for x in components[1:])
```

- [ ] **Step 4: Create router**

Create `server/app/modules/deals/router.py`:

```python
"""Deals module API endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query

from app.modules.deals import service
from app.modules.deals.schemas import (
    DocumentTemplateUpdate,
    InvestmentTypeCreate,
    InvestmentTypeUpdate,
    MandateCreate,
    MandateUpdate,
    OpportunityCreate,
    OpportunityUpdate,
)
from app.shared.dependencies import CurrentUser, get_db_with_tenant, require_role
from app.shared.schemas import SuccessResponse

router = APIRouter(prefix="/api/v1/deals", tags=["Deals"])

# Shorthand dependencies
_any_role = Depends(require_role(module="deals", roles=["owner", "manager", "analyst"]))
_manager_plus = Depends(require_role(module="deals", roles=["owner", "manager"]))
_owner_only = Depends(require_role(module="deals", roles=["owner"]))


# ── Settings: Investment Types ──────────────────────────────────────


@router.get("/settings/investment-types")
async def list_investment_types(
    user: CurrentUser = _any_role,
    db=Depends(get_db_with_tenant),
):
    data = await service.list_investment_types(db, user.tenant_id)
    return SuccessResponse(data=data)


@router.get("/settings/investment-types/{type_id}")
async def get_investment_type(
    type_id: uuid.UUID,
    user: CurrentUser = _any_role,
    db=Depends(get_db_with_tenant),
):
    data = await service.get_investment_type(db, user.tenant_id, type_id)
    return SuccessResponse(data=data)


@router.post("/settings/investment-types", status_code=201)
async def create_investment_type(
    body: InvestmentTypeCreate,
    user: CurrentUser = _owner_only,
    db=Depends(get_db_with_tenant),
):
    data = await service.create_investment_type(db, user.tenant_id, body)
    return SuccessResponse(data=data)


@router.put("/settings/investment-types/{type_id}")
async def update_investment_type(
    type_id: uuid.UUID,
    body: InvestmentTypeUpdate,
    user: CurrentUser = _owner_only,
    db=Depends(get_db_with_tenant),
):
    data = await service.update_investment_type(db, user.tenant_id, type_id, body)
    return SuccessResponse(data=data)


@router.delete("/settings/investment-types/{type_id}", status_code=204)
async def delete_investment_type(
    type_id: uuid.UUID,
    user: CurrentUser = _owner_only,
    db=Depends(get_db_with_tenant),
):
    await service.delete_investment_type(db, user.tenant_id, type_id)


# ── Settings: Document Templates ────────────────────────────────────


@router.get("/settings/templates")
async def list_templates(
    investment_type_id: uuid.UUID | None = Query(None),
    user: CurrentUser = _any_role,
    db=Depends(get_db_with_tenant),
):
    data = await service.list_templates(db, user.tenant_id, investment_type_id)
    return SuccessResponse(data=data)


@router.get("/settings/templates/{template_id}")
async def get_template(
    template_id: uuid.UUID,
    user: CurrentUser = _any_role,
    db=Depends(get_db_with_tenant),
):
    data = await service.get_template(db, user.tenant_id, template_id)
    return SuccessResponse(data=data)


@router.put("/settings/templates/{template_id}")
async def update_template(
    template_id: uuid.UUID,
    body: DocumentTemplateUpdate,
    user: CurrentUser = _owner_only,
    db=Depends(get_db_with_tenant),
):
    data = await service.update_template(db, user.tenant_id, template_id, body)
    return SuccessResponse(data=data)


# ── Mandates ────────────────────────────────────────────────────────


@router.get("/mandates")
async def list_mandates(
    status: str | None = Query(None),
    user: CurrentUser = _any_role,
    db=Depends(get_db_with_tenant),
):
    data = await service.list_mandates(db, user.tenant_id, status)
    return SuccessResponse(data=data)


@router.get("/mandates/{mandate_id}")
async def get_mandate(
    mandate_id: uuid.UUID,
    user: CurrentUser = _any_role,
    db=Depends(get_db_with_tenant),
):
    data = await service.get_mandate(db, user.tenant_id, mandate_id)
    return SuccessResponse(data=data)


@router.post("/mandates", status_code=201)
async def create_mandate(
    body: MandateCreate,
    user: CurrentUser = _any_role,
    db=Depends(get_db_with_tenant),
):
    data = await service.create_mandate(db, user.tenant_id, user.id, body)
    return SuccessResponse(data=data)


@router.put("/mandates/{mandate_id}")
async def update_mandate(
    mandate_id: uuid.UUID,
    body: MandateUpdate,
    user: CurrentUser = _any_role,
    db=Depends(get_db_with_tenant),
):
    data = await service.update_mandate(db, user.tenant_id, mandate_id, body)
    return SuccessResponse(data=data)


@router.delete("/mandates/{mandate_id}", status_code=204)
async def delete_mandate(
    mandate_id: uuid.UUID,
    user: CurrentUser = _owner_only,
    db=Depends(get_db_with_tenant),
):
    await service.delete_mandate(db, user.tenant_id, mandate_id)


# ── Opportunities ───────────────────────────────────────────────────


@router.get("/opportunities")
async def list_opportunities(
    pipeline_status: str | None = Query(None),
    assigned_to: uuid.UUID | None = Query(None),
    user: CurrentUser = _any_role,
    db=Depends(get_db_with_tenant),
):
    data = await service.list_opportunities(db, user.tenant_id, pipeline_status, assigned_to)
    return SuccessResponse(data=data)


@router.get("/opportunities/{opp_id}")
async def get_opportunity(
    opp_id: uuid.UUID,
    user: CurrentUser = _any_role,
    db=Depends(get_db_with_tenant),
):
    data = await service.get_opportunity(db, user.tenant_id, opp_id)
    return SuccessResponse(data=data)


@router.post("/opportunities", status_code=201)
async def create_opportunity(
    body: OpportunityCreate,
    user: CurrentUser = _any_role,
    db=Depends(get_db_with_tenant),
):
    data = await service.create_opportunity(db, user.tenant_id, user.id, body)
    return SuccessResponse(data=data)


@router.put("/opportunities/{opp_id}")
async def update_opportunity(
    opp_id: uuid.UUID,
    body: OpportunityUpdate,
    user: CurrentUser = _any_role,
    db=Depends(get_db_with_tenant),
):
    data = await service.update_opportunity(db, user.tenant_id, opp_id, body)
    return SuccessResponse(data=data)


@router.delete("/opportunities/{opp_id}", status_code=204)
async def delete_opportunity(
    opp_id: uuid.UUID,
    user: CurrentUser = _owner_only,
    db=Depends(get_db_with_tenant),
):
    await service.delete_opportunity(db, user.tenant_id, opp_id)
```

- [ ] **Step 5: Register the deals router in main.py**

Modify `server/app/main.py` — add after existing router includes:

```python
from app.modules.deals.router import router as deals_router

# Add after existing app.include_router lines:
app.include_router(deals_router)
```

- [ ] **Step 6: Verify the server starts and endpoints are listed**

```bash
cd server
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` and verify the Deals tag appears with all endpoints.

- [ ] **Step 7: Commit**

```bash
cd server
git add app/modules/deals/schemas.py app/modules/deals/repository.py app/modules/deals/service.py app/modules/deals/router.py app/main.py
git commit -m "feat(deals): add schemas, repository, service, and router

Complete backend CRUD for investment types, document templates,
mandates, and opportunities with RBAC via require_role."
```

---

## Task 3: Backend — Seed Data

**Files:**
- Modify: `server/scripts/seed.py`

### Steps

- [ ] **Step 1: Add deals seed data to the seed script**

Add the following to the end of `server/scripts/seed.py` (inside the existing `async def seed()` function, after the admin seed data):

```python
    # ── Deals Module Seed Data ──────────────────────────────────────

    from app.modules.deals.models import InvestmentType, DocumentTemplate, Mandate, AssetManager, Opportunity

    # Create deals schema if not exists
    await conn.execute(text("CREATE SCHEMA IF NOT EXISTS deals"))

    org_id = uuid.UUID("00000000-0000-0000-0000-000000000001")  # Watar Partners
    raoof_id = uuid.UUID("00000000-0000-0000-0000-000000000005")  # raoof@watar.com
    pine_id = uuid.UUID("00000000-0000-0000-0000-000000000002")   # pine@watar.com
    john_id = uuid.UUID("00000000-0000-0000-0000-000000000003")   # john@watar.com

    # ── Investment Types ─────────────────────────────────────────

    fund_type_id = uuid.UUID("10000000-0000-0000-0000-000000000001")
    direct_type_id = uuid.UUID("10000000-0000-0000-0000-000000000002")
    coinvest_type_id = uuid.UUID("10000000-0000-0000-0000-000000000003")
    other_type_id = uuid.UUID("10000000-0000-0000-0000-000000000004")

    fund_snapshot_config = {
        "sections": [
            {
                "name": "Deal Overview",
                "sortOrder": 0,
                "fields": [
                    {"name": "Deal Name", "type": "text", "required": True, "instruction": "Extract the fund name from headers or subject lines."},
                    {"name": "Fund Manager / GP", "type": "text", "required": True, "instruction": "Identify the general partner or management company."},
                    {"name": "Fund Strategy", "type": "select", "required": True, "instruction": "Classify the investment strategy.", "options": ["PE", "VC", "Growth Equity", "Hedge Fund", "Real Estate", "Infrastructure", "Credit/Debt", "Multi-Strategy", "Fund of Funds", "Secondaries", "Other"]},
                    {"name": "Geographic Focus", "type": "multi_select", "required": True, "instruction": "Determine primary investment geography.", "options": ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa", "Global"]},
                    {"name": "Source / Referral", "type": "text", "required": True, "instruction": "Identify who sent or introduced the opportunity."},
                    {"name": "Date Received", "type": "date", "required": True, "instruction": "Use the email date or document date."},
                ],
            },
            {
                "name": "Fund Terms",
                "sortOrder": 1,
                "fields": [
                    {"name": "Target Fund Size", "type": "currency", "required": True, "instruction": "Extract the target AUM for the fund."},
                    {"name": "Minimum Commitment", "type": "currency", "required": True, "instruction": "Extract the minimum LP commitment."},
                    {"name": "Management Fee (%)", "type": "percentage", "required": True, "instruction": "Extract the annual management fee rate."},
                    {"name": "Carried Interest (%)", "type": "percentage", "required": True, "instruction": "Extract the GP performance fee."},
                    {"name": "Preferred Return (%)", "type": "percentage", "required": True, "instruction": "Extract the hurdle rate."},
                ],
            },
            {
                "name": "Target Economics",
                "sortOrder": 2,
                "fields": [
                    {"name": "Target Net IRR (%)", "type": "percentage", "required": False, "instruction": "Extract the GP's stated target net return."},
                    {"name": "Target Net MOIC", "type": "number", "required": False, "instruction": "Extract the target multiple on invested capital."},
                ],
            },
        ],
    }

    direct_snapshot_config = {
        "sections": [
            {
                "name": "Deal Overview",
                "sortOrder": 0,
                "fields": [
                    {"name": "Deal Name", "type": "text", "required": True, "instruction": "Use the target company name."},
                    {"name": "Target Company", "type": "text", "required": True, "instruction": "Extract the legal or operating name."},
                    {"name": "Transaction Type", "type": "select", "required": True, "instruction": "Classify the transaction structure.", "options": ["Majority Buyout", "Minority Equity", "Growth Equity", "Recapitalization", "PIPE", "Take-Private", "Carve-Out", "Other"]},
                    {"name": "Industry / Sector", "type": "select", "required": True, "instruction": "Classify the target company's primary industry.", "options": ["Technology", "Healthcare", "Financial Services", "Consumer & Retail", "Industrials", "Energy", "Real Estate", "Business Services", "Other"]},
                    {"name": "Source / Referral", "type": "text", "required": True, "instruction": "Identify the deal source."},
                    {"name": "Date Received", "type": "date", "required": True, "instruction": "Use the email receipt date."},
                ],
            },
            {
                "name": "Financial Overview",
                "sortOrder": 1,
                "fields": [
                    {"name": "LTM Revenue", "type": "currency", "required": True, "instruction": "Extract last twelve months revenue."},
                    {"name": "LTM EBITDA", "type": "currency", "required": True, "instruction": "Extract LTM EBITDA."},
                    {"name": "Enterprise Value", "type": "currency", "required": True, "instruction": "Extract the stated or implied enterprise value."},
                    {"name": "EV / EBITDA Multiple", "type": "number", "required": False, "instruction": "Calculate or extract the valuation multiple."},
                ],
            },
        ],
    }

    coinvest_snapshot_config = {
        "sections": [
            {
                "name": "Deal Overview",
                "sortOrder": 0,
                "fields": [
                    {"name": "Deal Name", "type": "text", "required": True, "instruction": "Use the target company name."},
                    {"name": "Target Company", "type": "text", "required": True, "instruction": "Extract the name of the company being invested in."},
                    {"name": "Lead GP / Sponsor", "type": "text", "required": True, "instruction": "Identify the lead general partner offering the co-investment."},
                    {"name": "Co-Investment Equity Available", "type": "currency", "required": True, "instruction": "Extract the total co-investment equity pool."},
                    {"name": "Response Deadline", "type": "date", "required": True, "instruction": "Extract the deadline for expressing interest."},
                ],
            },
        ],
    }

    other_snapshot_config = {
        "sections": [
            {
                "name": "Deal Overview",
                "sortOrder": 0,
                "fields": [
                    {"name": "Deal Name", "type": "text", "required": True, "instruction": "Extract or construct a descriptive name."},
                    {"name": "Investment Type", "type": "text", "required": True, "instruction": "Describe the investment type in free text."},
                    {"name": "Counterparty / Issuer", "type": "text", "required": True, "instruction": "Identify the other party."},
                    {"name": "Description", "type": "textarea", "required": True, "instruction": "Provide a 2-4 sentence summary."},
                ],
            },
        ],
    }

    investment_types = [
        InvestmentType(id=fund_type_id, tenant_id=org_id, name="Fund", slug="fund", is_system=True, sort_order=0, snapshot_config=fund_snapshot_config),
        InvestmentType(id=direct_type_id, tenant_id=org_id, name="Direct", slug="direct", is_system=True, sort_order=1, snapshot_config=direct_snapshot_config),
        InvestmentType(id=coinvest_type_id, tenant_id=org_id, name="Co-Investment", slug="co-investment", is_system=True, sort_order=2, snapshot_config=coinvest_snapshot_config),
        InvestmentType(id=other_type_id, tenant_id=org_id, name="Other", slug="other", is_system=True, sort_order=3, snapshot_config=other_snapshot_config),
    ]
    for it in investment_types:
        db_session.add(it)
    await db_session.flush()

    # ── Document Templates (abbreviated — one per type) ──────────

    memo_prompt = "You are a senior investment analyst. Generate a formal Investment Memorandum for the investment committee. Use the deal snapshot data to populate the memo. Structure: Executive Summary, Overview, Assessment, Terms, Risk Factors, Recommendation."
    prescreening_prompt = "You are an investment analyst preparing a brief pre-screening summary for the team's weekly pipeline review. Keep to 2-3 pages. Structure: Snapshot, Quick Assessment Matrix, What's Interesting, Key Concerns, Recommendation."

    for type_obj in investment_types:
        templates = [
            DocumentTemplate(tenant_id=org_id, investment_type_id=type_obj.id, name="Investment Memo", slug="investment-memo", prompt_template=memo_prompt, is_system=True, sort_order=0),
            DocumentTemplate(tenant_id=org_id, investment_type_id=type_obj.id, name="Pre-Screening Report", slug="pre-screening", prompt_template=prescreening_prompt, is_system=True, sort_order=1),
            DocumentTemplate(tenant_id=org_id, investment_type_id=type_obj.id, name="DDQ", slug="ddq", prompt_template="Generate a Due Diligence Questionnaire based on the deal snapshot.", is_system=True, sort_order=2),
            DocumentTemplate(tenant_id=org_id, investment_type_id=type_obj.id, name="Market Analysis", slug="market-analysis", prompt_template="Generate a market analysis based on the deal snapshot data.", is_system=True, sort_order=3),
            DocumentTemplate(tenant_id=org_id, investment_type_id=type_obj.id, name="News / Insights", slug="news", prompt_template="Generate contextual news and insights about this opportunity.", is_system=True, sort_order=4),
        ]
        for tpl in templates:
            db_session.add(tpl)
    await db_session.flush()

    # ── Mandates ─────────────────────────────────────────────────

    mandate1_id = uuid.UUID("20000000-0000-0000-0000-000000000001")
    mandate2_id = uuid.UUID("20000000-0000-0000-0000-000000000002")

    mandates = [
        Mandate(
            id=mandate1_id, tenant_id=org_id, name="Growth Equity Mandate 2026",
            status="active", target_allocation=50000000,
            expected_return="15%+ IRR", time_horizon="5-7 years",
            investment_types=["fund", "co-investment", "direct"],
            asset_allocation=[
                {"assetClass": "Private Equity", "allocationPct": 40, "targetReturn": "15%+"},
                {"assetClass": "Venture Capital", "allocationPct": 30, "targetReturn": "20%+"},
                {"assetClass": "Real Estate", "allocationPct": 20, "targetReturn": "12%+"},
                {"assetClass": "Private Debt", "allocationPct": 10, "targetReturn": "8%+"},
            ],
            target_sectors=["Technology", "Healthcare", "Financial Services"],
            geographic_focus=["North America", "Europe"],
            investment_strategy="Focus on growth-stage companies with proven revenue models and path to profitability.",
            created_by=raoof_id,
        ),
        Mandate(
            id=mandate2_id, tenant_id=org_id, name="Real Assets Fund II",
            status="active", target_allocation=100000000,
            expected_return="10%+ IRR / 6%+ yield", time_horizon="3-10 years",
            investment_types=["fund", "direct"],
            asset_allocation=[
                {"assetClass": "Real Estate", "allocationPct": 50, "targetReturn": "10%+"},
                {"assetClass": "Infrastructure", "allocationPct": 30, "targetReturn": "8%+"},
                {"assetClass": "Private Debt", "allocationPct": 20, "targetReturn": "7%+"},
            ],
            target_sectors=["Real Estate", "Infrastructure", "Energy"],
            geographic_focus=["Middle East & Africa", "Asia-Pacific"],
            created_by=raoof_id,
        ),
    ]
    for m in mandates:
        db_session.add(m)
    await db_session.flush()

    # ── Asset Managers ───────────────────────────────────────────

    am1_id = uuid.UUID("30000000-0000-0000-0000-000000000001")
    am2_id = uuid.UUID("30000000-0000-0000-0000-000000000002")
    am3_id = uuid.UUID("30000000-0000-0000-0000-000000000003")

    asset_managers = [
        AssetManager(id=am1_id, tenant_id=org_id, name="Abingworth", type="Venture Capital", location="US, Europe", description="Specialized venture capital fund focusing on biotechnology and life sciences.", fund_info={"fund_size": "$600M"}, firm_info={"firm_aum": "$2.5B", "years_in_business": "37"}, strategy={"fund_strategy": "Early-stage to development-stage biotech"}, created_by_type="system"),
        AssetManager(id=am2_id, tenant_id=org_id, name="Blackstone Real Estate", type="Real Estate", location="Global", description="Largest real estate private equity firm globally.", fund_info={"fund_size": "$30B"}, firm_info={"firm_aum": "$300B+", "years_in_business": "38"}, strategy={"fund_strategy": "Opportunistic and core-plus real estate"}, created_by_type="manual"),
        AssetManager(id=am3_id, tenant_id=org_id, name="Sequoia Capital", type="Venture Capital", location="US, India, SEA, China", description="Leading venture capital firm investing in technology companies.", fund_info={"fund_size": "$15B+"}, firm_info={"firm_aum": "$85B+"}, strategy={"fund_strategy": "Seed to growth-stage technology"}, created_by_type="system"),
    ]
    for am in asset_managers:
        db_session.add(am)
    await db_session.flush()

    # ── Opportunities ────────────────────────────────────────────

    opportunities = [
        Opportunity(tenant_id=org_id, name="Abingworth ABV 9 Fund", investment_type_id=fund_type_id, pipeline_status="active", asset_manager_id=am1_id, assigned_to=john_id, source_type="email", snapshot_data={"Deal Name": "Abingworth ABV 9", "Fund Manager / GP": "Abingworth", "Fund Strategy": "VC", "Target Fund Size": "$600M", "Management Fee (%)": "2.0%"}, mandate_fits=[{"mandateId": str(mandate1_id), "fitScore": "moderate", "reasoning": "Biotech VC aligns with healthcare sector focus"}], created_by=john_id),
        Opportunity(tenant_id=org_id, name="Blackstone RE Partners X", investment_type_id=fund_type_id, pipeline_status="active", asset_manager_id=am2_id, assigned_to=pine_id, source_type="email", snapshot_data={"Deal Name": "Blackstone RE Partners X", "Fund Manager / GP": "Blackstone", "Fund Strategy": "Real Estate", "Target Fund Size": "$30B"}, mandate_fits=[{"mandateId": str(mandate2_id), "fitScore": "strong", "reasoning": "Direct real estate fund alignment"}], created_by=pine_id),
        Opportunity(tenant_id=org_id, name="TechCo Series C", investment_type_id=direct_type_id, pipeline_status="new", asset_manager_id=None, assigned_to=None, source_type="manual", snapshot_data={"Deal Name": "TechCo Series C", "Target Company": "TechCo Inc", "Transaction Type": "Growth Equity", "LTM Revenue": "$45M"}, mandate_fits=[{"mandateId": str(mandate1_id), "fitScore": "strong", "reasoning": "Growth tech, strong revenue"}], created_by=raoof_id),
        Opportunity(tenant_id=org_id, name="InfraFund Co-Invest", investment_type_id=coinvest_type_id, pipeline_status="new", assigned_to=None, source_type="manual", snapshot_data={"Deal Name": "InfraFund Co-Invest", "Lead GP / Sponsor": "Brookfield"}, mandate_fits=[{"mandateId": str(mandate2_id), "fitScore": "moderate", "reasoning": "Infrastructure co-invest, geographic TBD"}], created_by=raoof_id),
        Opportunity(tenant_id=org_id, name="Old Deal Alpha", investment_type_id=fund_type_id, pipeline_status="archived", asset_manager_id=am3_id, assigned_to=john_id, source_type="email", snapshot_data={"Deal Name": "Sequoia Growth Fund IV"}, created_by=john_id),
        Opportunity(tenant_id=org_id, name="Passed Opportunity", investment_type_id=direct_type_id, pipeline_status="ignored", assigned_to=john_id, source_type="manual", snapshot_data={"Deal Name": "SmallCo Buyout"}, created_by=john_id),
    ]
    for opp in opportunities:
        db_session.add(opp)
    await db_session.flush()

    print("Deals seed data created successfully")
```

- [ ] **Step 2: Run the seed script**

```bash
cd server
python scripts/seed.py
```

- [ ] **Step 3: Verify seed data via API**

```bash
# Start server
uvicorn app.main:app --reload --port 8000 &

# Login to get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"raoof@watar.com","password":"password123"}' | python -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# Test endpoints
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/deals/settings/investment-types | python -m json.tool
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/deals/mandates | python -m json.tool
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/deals/opportunities | python -m json.tool
```

Expected: JSON responses with seeded data.

- [ ] **Step 4: Commit**

```bash
git add server/scripts/seed.py
git commit -m "feat(deals): add seed data for investment types, mandates, and opportunities"
```

---

## Task 4: Frontend — Module Scaffolding & Routing

**Files:**
- Create: `client/src/modules/deals/types.ts`
- Create: `client/src/modules/deals/api.ts`
- Create: `client/src/modules/deals/store.ts`
- Create: `client/src/modules/deals/pages/DealsLayout.tsx`
- Create: `client/src/modules/deals/pages/DashboardPage.tsx`
- Modify: `client/src/App.tsx` (add deals routes)
- Modify: `client/src/hooks/useActiveModule.ts` (update deals nav items)
- Modify: `client/src/pages/ModulesHomePage.tsx` (enable deals module)

### Steps

- [ ] **Step 1: Create deals types**

Create `client/src/modules/deals/types.ts`:

```typescript
// ── Investment Types ────────────────────────────────────────────────

export interface SnapshotField {
  name: string
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'select' | 'multi_select' | 'textarea'
  required: boolean
  instruction: string
  options?: string[]
}

export interface SnapshotSection {
  name: string
  sortOrder: number
  fields: SnapshotField[]
}

export interface SnapshotConfig {
  sections: SnapshotSection[]
}

export interface InvestmentType {
  id: string
  name: string
  slug: string
  isSystem: boolean
  sortOrder: number
  snapshotConfig: SnapshotConfig
  createdAt: string
  updatedAt: string
}

// ── Document Templates ──────────────────────────────────────────────

export interface DocumentTemplate {
  id: string
  investmentTypeId: string
  name: string
  slug: string
  promptTemplate: string
  isSystem: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ── Mandates ────────────────────────────────────────────────────────

export interface AssetAllocationItem {
  assetClass: string
  allocationPct: number
  targetReturn: string
}

export interface Mandate {
  id: string
  name: string
  status: 'draft' | 'active' | 'closed'
  targetAllocation: number | null
  expectedReturn: string | null
  timeHorizon: string | null
  investmentTypes: string[] | null
  assetAllocation: AssetAllocationItem[] | null
  targetSectors: string[] | null
  geographicFocus: string[] | null
  investmentCriteria: string | null
  investmentConstraints: string | null
  investmentStrategy: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

// ── Opportunities ───────────────────────────────────────────────────

export type PipelineStatus = 'new' | 'active' | 'archived' | 'ignored'
export type FitScore = 'strong' | 'moderate' | 'weak'

export interface MandateFit {
  mandateId: string
  fitScore: FitScore
  reasoning: string
}

export interface Opportunity {
  id: string
  name: string
  investmentTypeId: string | null
  investmentTypeName: string | null
  pipelineStatus: PipelineStatus
  assetManagerId: string | null
  assetManagerName: string | null
  assignedTo: string | null
  snapshotData: Record<string, unknown>
  snapshotCitations: Record<string, unknown>
  sourceType: 'email' | 'upload' | 'manual' | 'google_drive'
  mandateFits: MandateFit[]
  createdBy: string | null
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Create deals API client**

Create `client/src/modules/deals/api.ts`:

```typescript
import { api } from '@/api/client'
import type {
  InvestmentType,
  DocumentTemplate,
  Mandate,
  Opportunity,
  SnapshotConfig,
  AssetAllocationItem,
} from './types'

export const dealsApi = {
  // Settings: Investment Types
  listInvestmentTypes: () => api.get<InvestmentType[]>('/deals/settings/investment-types'),
  getInvestmentType: (id: string) => api.get<InvestmentType>(`/deals/settings/investment-types/${id}`),
  createInvestmentType: (data: { name: string; slug: string; snapshotConfig?: SnapshotConfig }) =>
    api.post<InvestmentType>('/deals/settings/investment-types', data),
  updateInvestmentType: (id: string, data: { name?: string; snapshotConfig?: SnapshotConfig; sortOrder?: number }) =>
    api.put<InvestmentType>(`/deals/settings/investment-types/${id}`, data),
  deleteInvestmentType: (id: string) => api.delete<void>(`/deals/settings/investment-types/${id}`),

  // Settings: Document Templates
  listTemplates: (investmentTypeId?: string) => {
    const params = investmentTypeId ? `?investment_type_id=${investmentTypeId}` : ''
    return api.get<DocumentTemplate[]>(`/deals/settings/templates${params}`)
  },
  getTemplate: (id: string) => api.get<DocumentTemplate>(`/deals/settings/templates/${id}`),
  updateTemplate: (id: string, data: { promptTemplate: string }) =>
    api.put<DocumentTemplate>(`/deals/settings/templates/${id}`, data),

  // Mandates
  listMandates: (status?: string) => {
    const params = status ? `?status=${status}` : ''
    return api.get<Mandate[]>(`/deals/mandates${params}`)
  },
  getMandate: (id: string) => api.get<Mandate>(`/deals/mandates/${id}`),
  createMandate: (data: {
    name: string
    status?: string
    targetAllocation?: number | null
    expectedReturn?: string | null
    timeHorizon?: string | null
    investmentTypes?: string[] | null
    assetAllocation?: AssetAllocationItem[] | null
    targetSectors?: string[] | null
    geographicFocus?: string[] | null
    investmentCriteria?: string | null
    investmentConstraints?: string | null
    investmentStrategy?: string | null
  }) => api.post<Mandate>('/deals/mandates', data),
  updateMandate: (id: string, data: Partial<Mandate>) =>
    api.put<Mandate>(`/deals/mandates/${id}`, data),
  deleteMandate: (id: string) => api.delete<void>(`/deals/mandates/${id}`),

  // Opportunities
  listOpportunities: (pipelineStatus?: string, assignedTo?: string) => {
    const params = new URLSearchParams()
    if (pipelineStatus) params.set('pipeline_status', pipelineStatus)
    if (assignedTo) params.set('assigned_to', assignedTo)
    const qs = params.toString()
    return api.get<Opportunity[]>(`/deals/opportunities${qs ? `?${qs}` : ''}`)
  },
  getOpportunity: (id: string) => api.get<Opportunity>(`/deals/opportunities/${id}`),
  createOpportunity: (data: {
    name: string
    investmentTypeId?: string | null
    assetManagerId?: string | null
    snapshotData?: Record<string, unknown>
    sourceType?: string
  }) => api.post<Opportunity>('/deals/opportunities', data),
  updateOpportunity: (id: string, data: Partial<Opportunity>) =>
    api.put<Opportunity>(`/deals/opportunities/${id}`, data),
  deleteOpportunity: (id: string) => api.delete<void>(`/deals/opportunities/${id}`),
}
```

- [ ] **Step 3: Create Zustand store**

Create `client/src/modules/deals/store.ts`:

```typescript
import { create } from 'zustand'
import { dealsApi } from './api'
import type {
  InvestmentType,
  DocumentTemplate,
  Mandate,
  Opportunity,
  PipelineStatus,
} from './types'

interface DealsState {
  // Investment Types
  investmentTypes: InvestmentType[]
  isInvestmentTypesLoading: boolean

  // Templates
  templates: DocumentTemplate[]
  isTemplatesLoading: boolean

  // Mandates
  mandates: Mandate[]
  isMandatesLoading: boolean

  // Opportunities
  opportunities: Opportunity[]
  pipelineFilter: PipelineStatus | null
  isOpportunitiesLoading: boolean

  // Actions
  fetchInvestmentTypes: () => Promise<void>
  fetchTemplates: (investmentTypeId?: string) => Promise<void>
  fetchMandates: (status?: string) => Promise<void>
  fetchOpportunities: (pipelineStatus?: string) => Promise<void>
}

export const useDealsStore = create<DealsState>((set) => ({
  investmentTypes: [],
  isInvestmentTypesLoading: false,

  templates: [],
  isTemplatesLoading: false,

  mandates: [],
  isMandatesLoading: false,

  opportunities: [],
  pipelineFilter: null,
  isOpportunitiesLoading: false,

  fetchInvestmentTypes: async () => {
    set({ isInvestmentTypesLoading: true })
    try {
      const res = await dealsApi.listInvestmentTypes()
      set({ investmentTypes: res, isInvestmentTypesLoading: false })
    } catch {
      set({ isInvestmentTypesLoading: false })
    }
  },

  fetchTemplates: async (investmentTypeId?: string) => {
    set({ isTemplatesLoading: true })
    try {
      const res = await dealsApi.listTemplates(investmentTypeId)
      set({ templates: res, isTemplatesLoading: false })
    } catch {
      set({ isTemplatesLoading: false })
    }
  },

  fetchMandates: async (status?: string) => {
    set({ isMandatesLoading: true })
    try {
      const res = await dealsApi.listMandates(status)
      set({ mandates: res, isMandatesLoading: false })
    } catch {
      set({ isMandatesLoading: false })
    }
  },

  fetchOpportunities: async (pipelineStatus?: string) => {
    set({ isOpportunitiesLoading: true, pipelineFilter: (pipelineStatus as PipelineStatus) ?? null })
    try {
      const res = await dealsApi.listOpportunities(pipelineStatus)
      set({ opportunities: res, isOpportunitiesLoading: false })
    } catch {
      set({ isOpportunitiesLoading: false })
    }
  },
}))
```

- [ ] **Step 4: Create DealsLayout and placeholder DashboardPage**

Create `client/src/modules/deals/pages/DealsLayout.tsx`:

```typescript
import { Outlet } from 'react-router-dom'

export function DealsLayout() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Outlet />
    </div>
  )
}
```

Create `client/src/modules/deals/pages/DashboardPage.tsx`:

```typescript
export function DealsDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Deals Dashboard</h1>
      <p className="text-muted-foreground">Dashboard coming in Phase 2.</p>
    </div>
  )
}
```

- [ ] **Step 5: Update useActiveModule.ts — update deals nav items**

In `client/src/hooks/useActiveModule.ts`, replace the existing `deals` entry in `MODULE_NAV_CONFIG`:

```typescript
  // Add these imports at the top (alongside existing ones):
  // Mail, Building2, Newspaper, Settings (Settings already imported)
  import {
    // ... existing imports ...
    Mail,
    Building2,
    Newspaper,
  } from 'lucide-react'

  // Replace the deals entry:
  deals: {
    slug: 'deals',
    label: 'Deals',
    icon: TrendingUp,
    accentColor: 'text-amber-500',
    navItems: [
      { label: 'Dashboard', path: '/home/deals', icon: LayoutDashboard },
      { label: 'Mandates', path: '/home/deals/mandates', icon: FileText },
      { label: 'Opportunities', path: '/home/deals/opportunities', icon: Target },
      { label: 'Email Hub', path: '/home/deals/email', icon: Mail },
      { label: 'Asset Managers', path: '/home/deals/asset-managers', icon: Building2 },
      { label: 'News', path: '/home/deals/news', icon: Newspaper },
      { label: 'Settings', path: '/home/deals/settings', icon: Settings },
    ],
  },
```

- [ ] **Step 6: Update App.tsx — add deals routes**

In `client/src/App.tsx`, add imports and routes:

```typescript
// Add imports after admin module imports:
import { DealsLayout } from '@/modules/deals/pages/DealsLayout'
import { DealsDashboardPage } from '@/modules/deals/pages/DashboardPage'

// Add inside the <Route path="/home" ...> block, after the admin routes:
          {/* Deals module */}
          <Route path="deals" element={<DealsLayout />}>
            <Route index element={<DealsDashboardPage />} />
          </Route>
```

- [ ] **Step 7: Update ModulesHomePage.tsx — enable deals module**

In `client/src/pages/ModulesHomePage.tsx`, find the Deals module config and change `path: null` to `path: '/home/deals'`.

- [ ] **Step 8: Verify the deals module loads in the browser**

```bash
cd client
pnpm dev
```

Navigate to `http://localhost:5173/home/deals`. Expected: Deals Dashboard placeholder page with the contextual sidebar showing Deals nav items.

- [ ] **Step 9: Commit**

```bash
git add client/src/modules/deals/ client/src/App.tsx client/src/hooks/useActiveModule.ts client/src/pages/ModulesHomePage.tsx
git commit -m "feat(deals): scaffold frontend module with routing and store

Add types, API client, Zustand store, DealsLayout, placeholder
dashboard, contextual sidebar nav, and route registration."
```

---

## Task 5: Frontend — Settings Page (Investment Types & Templates)

**Files:**
- Create: `client/src/modules/deals/pages/SettingsPage.tsx`
- Create: `client/src/modules/deals/components/settings/InvestmentTypeList.tsx`
- Create: `client/src/modules/deals/components/settings/SnapshotFieldEditor.tsx`
- Create: `client/src/modules/deals/components/settings/FieldConfigRow.tsx`
- Create: `client/src/modules/deals/components/settings/TemplateList.tsx`
- Create: `client/src/modules/deals/components/settings/PromptEditor.tsx`
- Modify: `client/src/App.tsx` (add settings route)

This task creates the Settings page where Owners configure snapshot fields per investment type and edit document generation prompt templates. Due to the size of these components, the plan provides the structure and key patterns — the implementing agent should follow the existing admin module's component patterns (inline editing, shadcn/ui components, form patterns).

### Steps

- [ ] **Step 1: Create the SettingsPage with tab navigation**

Create `client/src/modules/deals/pages/SettingsPage.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { useDealsStore } from '../store'
import { InvestmentTypeList } from '../components/settings/InvestmentTypeList'
import { TemplateList } from '../components/settings/TemplateList'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'snapshots' | 'templates'>('snapshots')
  const { fetchInvestmentTypes, fetchTemplates } = useDealsStore()

  useEffect(() => {
    fetchInvestmentTypes()
    fetchTemplates()
  }, [fetchInvestmentTypes, fetchTemplates])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Deals Settings</h1>

      <div className="flex gap-1 border-b mb-6">
        <button
          onClick={() => setActiveTab('snapshots')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'snapshots'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Snapshot Configuration
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'templates'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Document Templates
        </button>
      </div>

      {activeTab === 'snapshots' && <InvestmentTypeList />}
      {activeTab === 'templates' && <TemplateList />}
    </div>
  )
}
```

- [ ] **Step 2: Create InvestmentTypeList component**

Create `client/src/modules/deals/components/settings/InvestmentTypeList.tsx`:

This component displays all investment types as cards. Clicking one opens the SnapshotFieldEditor. Uses `useDealsStore` for data. Shows name, slug, field count, isSystem badge. "Add Investment Type" button for custom types (Owner only).

Key patterns:
- Use `Card` from shadcn/ui
- Use `Badge` for system/custom indicator
- Use `Dialog` for creating new investment types
- Follow the admin module's component patterns

```typescript
import { useState } from 'react'
import { useDealsStore } from '../../store'
import { SnapshotFieldEditor } from './SnapshotFieldEditor'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { InvestmentType } from '../../types'

export function InvestmentTypeList() {
  const { investmentTypes, isInvestmentTypesLoading } = useDealsStore()
  const [selectedType, setSelectedType] = useState<InvestmentType | null>(null)

  if (selectedType) {
    return (
      <SnapshotFieldEditor
        investmentType={selectedType}
        onBack={() => setSelectedType(null)}
      />
    )
  }

  if (isInvestmentTypesLoading) {
    return <div className="text-muted-foreground">Loading investment types...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Configure snapshot fields per investment type. These fields are used for AI extraction when processing opportunities.
        </p>
        <Button size="sm">Add Investment Type</Button>
      </div>

      <div className="grid gap-3">
        {investmentTypes.map((type) => {
          const fieldCount = type.snapshotConfig.sections.reduce(
            (sum, s) => sum + s.fields.length, 0
          )
          return (
            <Card
              key={type.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedType(type)}
            >
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{type.name}</CardTitle>
                    <CardDescription>
                      {type.snapshotConfig.sections.length} sections, {fieldCount} fields
                    </CardDescription>
                  </div>
                  <Badge variant={type.isSystem ? 'secondary' : 'outline'}>
                    {type.isSystem ? 'System' : 'Custom'}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create SnapshotFieldEditor component**

Create `client/src/modules/deals/components/settings/SnapshotFieldEditor.tsx`:

This is the core settings editor. Shows sections with fields, each editable. Uses FieldConfigRow for individual fields. Supports add/remove/reorder sections and fields. Saves via API.

```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, GripVertical, Trash2 } from 'lucide-react'
import { FieldConfigRow } from './FieldConfigRow'
import { dealsApi } from '../../api'
import { useDealsStore } from '../../store'
import type { InvestmentType, SnapshotSection, SnapshotField } from '../../types'

interface SnapshotFieldEditorProps {
  investmentType: InvestmentType
  onBack: () => void
}

export function SnapshotFieldEditor({ investmentType, onBack }: SnapshotFieldEditorProps) {
  const [sections, setSections] = useState<SnapshotSection[]>(
    investmentType.snapshotConfig.sections
  )
  const [isSaving, setIsSaving] = useState(false)
  const { fetchInvestmentTypes } = useDealsStore()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await dealsApi.updateInvestmentType(investmentType.id, {
        snapshotConfig: { sections },
      })
      await fetchInvestmentTypes()
      onBack()
    } finally {
      setIsSaving(false)
    }
  }

  const addSection = () => {
    setSections([
      ...sections,
      { name: 'New Section', sortOrder: sections.length, fields: [] },
    ])
  }

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index))
  }

  const updateSectionName = (index: number, name: string) => {
    const updated = [...sections]
    updated[index] = { ...updated[index], name }
    setSections(updated)
  }

  const addField = (sectionIndex: number) => {
    const updated = [...sections]
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      fields: [
        ...updated[sectionIndex].fields,
        { name: 'New Field', type: 'text', required: false, instruction: '' },
      ],
    }
    setSections(updated)
  }

  const updateField = (sectionIndex: number, fieldIndex: number, field: SnapshotField) => {
    const updated = [...sections]
    const fields = [...updated[sectionIndex].fields]
    fields[fieldIndex] = field
    updated[sectionIndex] = { ...updated[sectionIndex], fields }
    setSections(updated)
  }

  const removeField = (sectionIndex: number, fieldIndex: number) => {
    const updated = [...sections]
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      fields: updated[sectionIndex].fields.filter((_, i) => i !== fieldIndex),
    }
    setSections(updated)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-xl font-semibold">{investmentType.name} — Snapshot Fields</h2>
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((section, sectionIdx) => (
          <Card key={sectionIdx}>
            <CardHeader className="py-3">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <input
                  value={section.name}
                  onChange={(e) => updateSectionName(sectionIdx, e.target.value)}
                  className="text-base font-semibold bg-transparent border-none outline-none flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeSection(sectionIdx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {section.fields.map((field, fieldIdx) => (
                  <FieldConfigRow
                    key={fieldIdx}
                    field={field}
                    onChange={(f) => updateField(sectionIdx, fieldIdx, f)}
                    onRemove={() => removeField(sectionIdx, fieldIdx)}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => addField(sectionIdx)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Field
              </Button>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={addSection}>
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create FieldConfigRow component**

Create `client/src/modules/deals/components/settings/FieldConfigRow.tsx`:

```typescript
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { SnapshotField } from '../../types'

interface FieldConfigRowProps {
  field: SnapshotField
  onChange: (field: SnapshotField) => void
  onRemove: () => void
}

const FIELD_TYPES = [
  'text', 'number', 'currency', 'percentage', 'date', 'select', 'multi_select', 'textarea',
] as const

export function FieldConfigRow({ field, onChange, onRemove }: FieldConfigRowProps) {
  return (
    <div className="flex items-start gap-2 p-2 rounded border bg-muted/30">
      <div className="flex-1 grid grid-cols-[1fr_120px_80px] gap-2">
        <Input
          value={field.name}
          onChange={(e) => onChange({ ...field, name: e.target.value })}
          placeholder="Field name"
          className="h-8 text-sm"
        />
        <select
          value={field.type}
          onChange={(e) => onChange({ ...field, type: e.target.value as SnapshotField['type'] })}
          className="h-8 text-sm rounded border px-2 bg-background"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ ...field, required: e.target.checked })}
          />
          Required
        </label>
      </div>
      <div className="flex-1">
        <Input
          value={field.instruction}
          onChange={(e) => onChange({ ...field, instruction: e.target.value })}
          placeholder="AI extraction instruction"
          className="h-8 text-sm"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}
```

- [ ] **Step 5: Create TemplateList and PromptEditor components**

Create `client/src/modules/deals/components/settings/TemplateList.tsx`:

```typescript
import { useState } from 'react'
import { useDealsStore } from '../../store'
import { PromptEditor } from './PromptEditor'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DocumentTemplate } from '../../types'

export function TemplateList() {
  const { templates, investmentTypes, isTemplatesLoading } = useDealsStore()
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)

  if (selectedTemplate) {
    return (
      <PromptEditor
        template={selectedTemplate}
        onBack={() => setSelectedTemplate(null)}
      />
    )
  }

  if (isTemplatesLoading) {
    return <div className="text-muted-foreground">Loading templates...</div>
  }

  // Group templates by investment type
  const grouped = investmentTypes.map((type) => ({
    type,
    templates: templates.filter((t) => t.investmentTypeId === type.id),
  }))

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Configure AI prompts for document generation. Templates use {'{{variable}}'} placeholders populated from snapshot data.
      </p>

      <div className="space-y-6">
        {grouped.map(({ type, templates: typeTemplates }) => (
          <div key={type.id}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {type.name}
            </h3>
            <div className="grid gap-2">
              {typeTemplates.map((tpl) => (
                <Card
                  key={tpl.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedTemplate(tpl)}
                >
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{tpl.name}</CardTitle>
                      <Badge variant="secondary">{tpl.slug}</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Create `client/src/modules/deals/components/settings/PromptEditor.tsx`:

```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { dealsApi } from '../../api'
import { useDealsStore } from '../../store'
import type { DocumentTemplate } from '../../types'

interface PromptEditorProps {
  template: DocumentTemplate
  onBack: () => void
}

export function PromptEditor({ template, onBack }: PromptEditorProps) {
  const [prompt, setPrompt] = useState(template.promptTemplate)
  const [isSaving, setIsSaving] = useState(false)
  const { fetchTemplates } = useDealsStore()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await dealsApi.updateTemplate(template.id, { promptTemplate: prompt })
      await fetchTemplates()
      onBack()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-xl font-semibold">{template.name}</h2>
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full h-96 p-4 text-sm font-mono rounded-lg border bg-muted/30 resize-y"
        placeholder="Enter the prompt template..."
      />

      <p className="text-xs text-muted-foreground mt-2">
        Use {'{{fieldName}}'} syntax for dynamic placeholders. These will be replaced with snapshot data at generation time.
      </p>
    </div>
  )
}
```

- [ ] **Step 6: Add settings route to App.tsx**

In `client/src/App.tsx`, add the import and route:

```typescript
import { SettingsPage } from '@/modules/deals/pages/SettingsPage'

// Inside the deals Route block:
<Route path="deals" element={<DealsLayout />}>
  <Route index element={<DealsDashboardPage />} />
  <Route path="settings" element={<SettingsPage />} />
</Route>
```

- [ ] **Step 7: Verify settings page works**

Navigate to `http://localhost:5173/home/deals/settings`. Expected: Tab view with Snapshot Configuration showing 4 investment types, and Document Templates showing templates grouped by type. Click a type to edit fields, click a template to edit prompt.

- [ ] **Step 8: Commit**

```bash
git add client/src/modules/deals/
git commit -m "feat(deals): add settings page with snapshot field editor and template management"
```

---

## Task 6: Frontend — Mandate List & Detail Pages

**Files:**
- Create: `client/src/modules/deals/pages/MandateListPage.tsx`
- Create: `client/src/modules/deals/pages/MandateDetailPage.tsx`
- Create: `client/src/modules/deals/components/mandates/MandateCard.tsx`
- Create: `client/src/modules/deals/components/mandates/StrategyOverview.tsx`
- Create: `client/src/modules/deals/components/mandates/MandateForm.tsx`
- Create: `client/src/modules/deals/components/mandates/AssetAllocationTable.tsx`
- Modify: `client/src/App.tsx` (add mandate routes)

### Steps

- [ ] **Step 1: Create MandateCard component**

Create `client/src/modules/deals/components/mandates/MandateCard.tsx`:

```typescript
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Mandate } from '../../types'

interface MandateCardProps {
  mandate: Mandate
  onClick: () => void
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500',
  draft: 'bg-amber-500',
  closed: 'bg-slate-400',
}

export function MandateCard({ mandate, onClick }: MandateCardProps) {
  const allocationPct = mandate.targetAllocation
    ? Math.round(((mandate.assetAllocation ?? []).reduce((sum, a) => sum + a.allocationPct, 0)))
    : 0

  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={onClick}>
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{mandate.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              {mandate.targetAllocation && (
                <span>${(mandate.targetAllocation / 1_000_000).toFixed(0)}M target</span>
              )}
              {mandate.expectedReturn && <span>· {mandate.expectedReturn}</span>}
              {mandate.timeHorizon && <span>· {mandate.timeHorizon}</span>}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {mandate.investmentTypes?.map((t) => (
              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
            ))}
            <Badge className={STATUS_COLORS[mandate.status] ?? 'bg-slate-400'}>
              {mandate.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
```

- [ ] **Step 2: Create MandateListPage**

Create `client/src/modules/deals/pages/MandateListPage.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDealsStore } from '../store'
import { MandateCard } from '../components/mandates/MandateCard'
import { MandateForm } from '../components/mandates/MandateForm'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function MandateListPage() {
  const navigate = useNavigate()
  const { mandates, isMandatesLoading, fetchMandates } = useDealsStore()
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchMandates(statusFilter)
  }, [fetchMandates, statusFilter])

  const tabs = [
    { label: 'All', value: undefined },
    { label: 'Active', value: 'active' },
    { label: 'Draft', value: 'draft' },
    { label: 'Closed', value: 'closed' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Mandates</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Mandate
        </Button>
      </div>

      <div className="flex gap-1 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              statusFilter === tab.value
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isMandatesLoading ? (
        <div className="text-muted-foreground">Loading mandates...</div>
      ) : mandates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No mandates found. Create your first mandate to get started.
        </div>
      ) : (
        <div className="grid gap-3">
          {mandates.map((m) => (
            <MandateCard
              key={m.id}
              mandate={m}
              onClick={() => navigate(`/home/deals/mandates/${m.id}`)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <MandateForm onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create MandateForm dialog**

Create `client/src/modules/deals/components/mandates/MandateForm.tsx`:

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { dealsApi } from '../../api'
import { useDealsStore } from '../../store'

interface MandateFormProps {
  onClose: () => void
}

export function MandateForm({ onClose }: MandateFormProps) {
  const navigate = useNavigate()
  const { fetchMandates } = useDealsStore()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const created = await dealsApi.createMandate({ name, status: 'draft' })
      await fetchMandates()
      onClose()
      navigate(`/home/deals/mandates/${created.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Mandate</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Mandate Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Growth Equity Mandate 2026"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Create AssetAllocationTable component**

Create `client/src/modules/deals/components/mandates/AssetAllocationTable.tsx`:

```typescript
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import type { AssetAllocationItem } from '../../types'

interface AssetAllocationTableProps {
  items: AssetAllocationItem[]
  onChange: (items: AssetAllocationItem[]) => void
  readOnly?: boolean
}

export function AssetAllocationTable({ items, onChange, readOnly }: AssetAllocationTableProps) {
  const updateItem = (index: number, field: keyof AssetAllocationItem, value: string | number) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const addItem = () => {
    onChange([...items, { assetClass: '', allocationPct: 0, targetReturn: '' }])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
          <div className="flex-1">
            {readOnly ? (
              <span className="text-sm font-medium">{item.assetClass}</span>
            ) : (
              <Input
                value={item.assetClass}
                onChange={(e) => updateItem(idx, 'assetClass', e.target.value)}
                placeholder="Asset class"
                className="h-8 text-sm"
              />
            )}
          </div>
          <div className="text-right text-sm text-muted-foreground w-32">
            {readOnly ? (
              <span>{item.allocationPct}% allocation</span>
            ) : (
              <Input
                type="number"
                value={item.allocationPct}
                onChange={(e) => updateItem(idx, 'allocationPct', Number(e.target.value))}
                className="h-8 text-sm text-right"
              />
            )}
          </div>
          <div className="text-right text-sm text-muted-foreground w-32">
            {readOnly ? (
              <span>{item.targetReturn} target return</span>
            ) : (
              <Input
                value={item.targetReturn}
                onChange={(e) => updateItem(idx, 'targetReturn', e.target.value)}
                placeholder="e.g., 15%+"
                className="h-8 text-sm text-right"
              />
            )}
          </div>
          {!readOnly && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(idx)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      {!readOnly && (
        <Button variant="ghost" size="sm" onClick={addItem}>
          <Plus className="h-3 w-3 mr-1" /> Add Asset Class
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create StrategyOverview component**

Create `client/src/modules/deals/components/mandates/StrategyOverview.tsx`:

This component renders the Strategy Overview tab of the mandate detail page — metric cards, allocation progress, investment summary, asset allocation table, and free text sections. It fetches the mandate data and allows inline editing with save.

The implementing agent should build this following the mandate detail layout from the spec screenshots: header metrics row (Target Allocation, Expected Return, Time Horizon), Allocation Progress bar, Investment Summary counts, Investment Strategy text, Investment Type tags, Asset Allocation & Target Returns table, Target Sectors, Geographic Focus, Investment Criteria, Investment Constraints.

Use `Card` components for each section, `Badge` for tags, and `AssetAllocationTable` for the allocation editor. Save changes via `dealsApi.updateMandate()`.

- [ ] **Step 6: Create MandateDetailPage**

Create `client/src/modules/deals/pages/MandateDetailPage.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { dealsApi } from '../api'
import { StrategyOverview } from '../components/mandates/StrategyOverview'
import type { Mandate } from '../types'

export function MandateDetailPage() {
  const { mandateId } = useParams<{ mandateId: string }>()
  const [mandate, setMandate] = useState<Mandate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'strategy' | 'opportunities'>('strategy')

  useEffect(() => {
    if (!mandateId) return
    setIsLoading(true)
    dealsApi.getMandate(mandateId).then((data) => {
      setMandate(data)
      setIsLoading(false)
    })
  }, [mandateId])

  if (isLoading || !mandate) {
    return <div className="text-muted-foreground">Loading mandate...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{mandate.name}</h1>

      <div className="flex gap-1 border-b mb-6">
        <button
          onClick={() => setActiveTab('strategy')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'strategy'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Strategy Overview
        </button>
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'opportunities'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Opportunities
        </button>
      </div>

      {activeTab === 'strategy' && (
        <StrategyOverview mandate={mandate} onUpdate={setMandate} />
      )}
      {activeTab === 'opportunities' && (
        <div className="text-muted-foreground">
          Matched opportunities will appear here once mandate matching is implemented.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Add mandate routes to App.tsx**

```typescript
import { MandateListPage } from '@/modules/deals/pages/MandateListPage'
import { MandateDetailPage } from '@/modules/deals/pages/MandateDetailPage'

// Inside the deals Route block:
<Route path="deals" element={<DealsLayout />}>
  <Route index element={<DealsDashboardPage />} />
  <Route path="mandates" element={<MandateListPage />} />
  <Route path="mandates/:mandateId" element={<MandateDetailPage />} />
  <Route path="settings" element={<SettingsPage />} />
</Route>
```

- [ ] **Step 8: Verify mandate pages work**

Navigate to `http://localhost:5173/home/deals/mandates`. Expected: List of 2 mandates from seed data. Click one to see strategy overview with metrics and asset allocation table.

- [ ] **Step 9: Commit**

```bash
git add client/src/modules/deals/ client/src/App.tsx
git commit -m "feat(deals): add mandate list and detail pages with strategy overview"
```

---

## Task 7: Frontend — Opportunity List Page

**Files:**
- Create: `client/src/modules/deals/pages/OpportunityListPage.tsx`
- Create: `client/src/modules/deals/components/opportunities/OpportunityTable.tsx`
- Create: `client/src/modules/deals/components/opportunities/PipelineStatusBadge.tsx`
- Create: `client/src/modules/deals/components/opportunities/FitScoreBadge.tsx`
- Create: `client/src/modules/deals/components/opportunities/CreateOpportunityDialog.tsx`
- Modify: `client/src/App.tsx` (add opportunities route)

### Steps

- [ ] **Step 1: Create PipelineStatusBadge component**

Create `client/src/modules/deals/components/opportunities/PipelineStatusBadge.tsx`:

```typescript
import { Badge } from '@/components/ui/badge'
import type { PipelineStatus } from '../../types'

const STATUS_CONFIG: Record<PipelineStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  archived: { label: 'Archived', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  ignored: { label: 'Ignored', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
}

export function PipelineStatusBadge({ status }: { status: PipelineStatus }) {
  const config = STATUS_CONFIG[status]
  return <Badge className={config.className}>{config.label}</Badge>
}
```

- [ ] **Step 2: Create FitScoreBadge component**

Create `client/src/modules/deals/components/opportunities/FitScoreBadge.tsx`:

```typescript
import { Badge } from '@/components/ui/badge'
import type { FitScore } from '../../types'

const FIT_CONFIG: Record<FitScore, { label: string; className: string }> = {
  strong: { label: 'Strong Fit', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  moderate: { label: 'Moderate Fit', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  weak: { label: 'Weak Fit', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
}

export function FitScoreBadge({ score }: { score: FitScore }) {
  const config = FIT_CONFIG[score]
  return <Badge className={config.className}>{config.label}</Badge>
}
```

- [ ] **Step 3: Create OpportunityTable component**

Create `client/src/modules/deals/components/opportunities/OpportunityTable.tsx`:

```typescript
import { useNavigate } from 'react-router-dom'
import { PipelineStatusBadge } from './PipelineStatusBadge'
import { FitScoreBadge } from './FitScoreBadge'
import type { Opportunity } from '../../types'

interface OpportunityTableProps {
  opportunities: Opportunity[]
}

export function OpportunityTable({ opportunities }: OpportunityTableProps) {
  const navigate = useNavigate()

  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No opportunities found.
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Asset Manager</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Fit</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp) => {
            const bestFit = opp.mandateFits?.[0]
            return (
              <tr
                key={opp.id}
                className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => navigate(`/home/deals/opportunities/${opp.id}`)}
              >
                <td className="p-3 text-sm font-medium">{opp.name}</td>
                <td className="p-3 text-sm text-muted-foreground">{opp.investmentTypeName ?? '—'}</td>
                <td className="p-3 text-sm text-muted-foreground">{opp.assetManagerName ?? '—'}</td>
                <td className="p-3"><PipelineStatusBadge status={opp.pipelineStatus} /></td>
                <td className="p-3">
                  {bestFit ? <FitScoreBadge score={bestFit.fitScore} /> : <span className="text-sm text-muted-foreground">—</span>}
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {new Date(opp.createdAt).toLocaleDateString()}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Create CreateOpportunityDialog**

Create `client/src/modules/deals/components/opportunities/CreateOpportunityDialog.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { dealsApi } from '../../api'
import { useDealsStore } from '../../store'

interface CreateOpportunityDialogProps {
  onClose: () => void
}

export function CreateOpportunityDialog({ onClose }: CreateOpportunityDialogProps) {
  const navigate = useNavigate()
  const { investmentTypes, fetchInvestmentTypes, fetchOpportunities } = useDealsStore()
  const [name, setName] = useState('')
  const [investmentTypeId, setInvestmentTypeId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (investmentTypes.length === 0) fetchInvestmentTypes()
  }, [investmentTypes.length, fetchInvestmentTypes])

  const handleSubmit = async () => {
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const created = await dealsApi.createOpportunity({
        name,
        investmentTypeId: investmentTypeId || null,
        sourceType: 'manual',
      })
      await fetchOpportunities()
      onClose()
      navigate(`/home/deals/opportunities/${created.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Opportunity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Opportunity Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., ABC Capital Fund VII"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Investment Type</label>
            <select
              value={investmentTypeId}
              onChange={(e) => setInvestmentTypeId(e.target.value)}
              className="w-full h-10 rounded-md border px-3 text-sm bg-background"
            >
              <option value="">Select type...</option>
              {investmentTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 5: Create OpportunityListPage**

Create `client/src/modules/deals/pages/OpportunityListPage.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { useDealsStore } from '../store'
import { OpportunityTable } from '../components/opportunities/OpportunityTable'
import { CreateOpportunityDialog } from '../components/opportunities/CreateOpportunityDialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { PipelineStatus } from '../types'

const PIPELINE_TABS: { label: string; value: PipelineStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'New', value: 'new' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
  { label: 'Ignored', value: 'ignored' },
]

export function OpportunityListPage() {
  const { opportunities, pipelineFilter, isOpportunitiesLoading, fetchOpportunities } = useDealsStore()
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchOpportunities(pipelineFilter ?? undefined)
  }, [fetchOpportunities, pipelineFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Opportunities</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Opportunity
        </Button>
      </div>

      <div className="flex gap-1 border-b mb-6">
        {PIPELINE_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => fetchOpportunities(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              pipelineFilter === (tab.value ?? null)
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isOpportunitiesLoading ? (
        <div className="text-muted-foreground">Loading opportunities...</div>
      ) : (
        <OpportunityTable opportunities={opportunities} />
      )}

      {showCreate && (
        <CreateOpportunityDialog onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}
```

- [ ] **Step 6: Add opportunity routes to App.tsx**

```typescript
import { OpportunityListPage } from '@/modules/deals/pages/OpportunityListPage'

// Inside the deals Route block:
<Route path="deals" element={<DealsLayout />}>
  <Route index element={<DealsDashboardPage />} />
  <Route path="mandates" element={<MandateListPage />} />
  <Route path="mandates/:mandateId" element={<MandateDetailPage />} />
  <Route path="opportunities" element={<OpportunityListPage />} />
  <Route path="settings" element={<SettingsPage />} />
</Route>
```

- [ ] **Step 7: Verify opportunity pages work**

Navigate to `http://localhost:5173/home/deals/opportunities`. Expected: Table showing 6 opportunities from seed data with status badges and fit scores. Pipeline status tabs filter the list. "Add Opportunity" opens creation dialog.

- [ ] **Step 8: Commit**

```bash
git add client/src/modules/deals/ client/src/App.tsx
git commit -m "feat(deals): add opportunity list page with pipeline status tabs and creation dialog"
```

---

## Phase 1 Complete

At this point, the Deals module has:

- **Backend**: Full database schema with 5 tables, CRUD APIs for investment types, templates, mandates, and opportunities, seeded with realistic test data
- **Frontend**: Module scaffolding with routing, contextual sidebar, Zustand store, API client
- **Settings page**: Investment type snapshot field editor + document template prompt editor
- **Mandate pages**: List with status filters, detail with Strategy Overview tab + asset allocation table
- **Opportunity pages**: Pipeline list with status tabs (New/Active/Archived/Ignored), fit score badges, manual creation

### What comes in Phase 2:
- Opportunity Workspace (multi-panel split view, OnlyOffice integration)
- Document collaboration (validation workflow, sharing, email sending)
- Email Hub & Gmail integration
- Google Drive bulk import
- Asset Manager pages
- News page
- Dashboard with pipeline summary, tasks, team activity
