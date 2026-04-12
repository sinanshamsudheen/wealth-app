import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.deals import repository
from app.modules.deals.schemas import (
    DocumentTemplateResponse,
    InvestmentTypeCreate,
    InvestmentTypeResponse,
    InvestmentTypeUpdate,
    DocumentTemplateUpdate,
    MandateCreate,
    MandateResponse,
    MandateUpdate,
    OpportunityCreate,
    OpportunityResponse,
    OpportunityUpdate,
)
from app.shared.exceptions import forbidden, not_found


# --- Helpers ---
def _investment_type_to_response(inv_type) -> InvestmentTypeResponse:
    return InvestmentTypeResponse(
        id=inv_type.id,
        name=inv_type.name,
        slug=inv_type.slug,
        isSystem=inv_type.is_system,
        sortOrder=inv_type.sort_order,
        snapshotConfig=inv_type.snapshot_config,
        createdAt=inv_type.created_at,
        updatedAt=inv_type.updated_at,
    )


def _template_to_response(template) -> DocumentTemplateResponse:
    return DocumentTemplateResponse(
        id=template.id,
        investmentTypeId=template.investment_type_id,
        name=template.name,
        slug=template.slug,
        promptTemplate=template.prompt_template,
        isSystem=template.is_system,
        sortOrder=template.sort_order,
        createdAt=template.created_at,
        updatedAt=template.updated_at,
    )


def _mandate_to_response(mandate) -> MandateResponse:
    return MandateResponse(
        id=mandate.id,
        name=mandate.name,
        status=mandate.status,
        targetAllocation=float(mandate.target_allocation) if mandate.target_allocation is not None else None,
        expectedReturn=mandate.expected_return,
        timeHorizon=mandate.time_horizon,
        investmentTypes=mandate.investment_types,
        assetAllocation=mandate.asset_allocation,
        targetSectors=mandate.target_sectors,
        geographicFocus=mandate.geographic_focus,
        investmentCriteria=mandate.investment_criteria,
        investmentConstraints=mandate.investment_constraints,
        investmentStrategy=mandate.investment_strategy,
        createdBy=mandate.created_by,
        createdAt=mandate.created_at,
        updatedAt=mandate.updated_at,
    )


def _opportunity_to_response(opp) -> OpportunityResponse:
    return OpportunityResponse(
        id=opp.id,
        name=opp.name,
        investmentTypeId=opp.investment_type_id,
        investmentTypeName=opp.investment_type.name if opp.investment_type else None,
        pipelineStatus=opp.pipeline_status,
        assetManagerId=opp.asset_manager_id,
        assetManagerName=opp.asset_manager.name if opp.asset_manager else None,
        assignedTo=opp.assigned_to,
        snapshotData=opp.snapshot_data,
        snapshotCitations=opp.snapshot_citations,
        sourceType=opp.source_type,
        mandateFits=opp.mandate_fits,
        createdBy=opp.created_by,
        createdAt=opp.created_at,
        updatedAt=opp.updated_at,
    )


# --- Investment Types ---
async def list_investment_types(
    db: AsyncSession, tenant_id: uuid.UUID
) -> list[InvestmentTypeResponse]:
    types = await repository.list_investment_types(db, tenant_id)
    return [_investment_type_to_response(t) for t in types]


async def get_investment_type(
    db: AsyncSession, tenant_id: uuid.UUID, type_id: uuid.UUID
) -> InvestmentTypeResponse:
    inv_type = await repository.get_investment_type(db, tenant_id, type_id)
    if not inv_type:
        raise not_found("Investment type not found")
    return _investment_type_to_response(inv_type)


async def create_investment_type(
    db: AsyncSession, tenant_id: uuid.UUID, data: InvestmentTypeCreate
) -> InvestmentTypeResponse:
    create_data = {
        "name": data.name,
        "slug": data.slug,
        "snapshot_config": data.snapshotConfig,
    }
    inv_type = await repository.create_investment_type(db, tenant_id, create_data)
    return _investment_type_to_response(inv_type)


async def update_investment_type(
    db: AsyncSession, tenant_id: uuid.UUID, type_id: uuid.UUID, data: InvestmentTypeUpdate
) -> InvestmentTypeResponse:
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.snapshotConfig is not None:
        update_data["snapshot_config"] = data.snapshotConfig
    if data.sortOrder is not None:
        update_data["sort_order"] = data.sortOrder

    inv_type = await repository.update_investment_type(db, tenant_id, type_id, update_data)
    if not inv_type:
        raise not_found("Investment type not found")
    return _investment_type_to_response(inv_type)


async def delete_investment_type(
    db: AsyncSession, tenant_id: uuid.UUID, type_id: uuid.UUID
) -> bool:
    inv_type = await repository.get_investment_type(db, tenant_id, type_id)
    if not inv_type:
        raise not_found("Investment type not found")
    if inv_type.is_system:
        raise forbidden("Cannot delete a system investment type")
    await repository.delete_investment_type(db, tenant_id, type_id)
    return True


# --- Document Templates ---
async def list_templates(
    db: AsyncSession, tenant_id: uuid.UUID, investment_type_id: uuid.UUID | None = None
) -> list[DocumentTemplateResponse]:
    templates = await repository.list_templates(db, tenant_id, investment_type_id)
    return [_template_to_response(t) for t in templates]


async def get_template(
    db: AsyncSession, tenant_id: uuid.UUID, template_id: uuid.UUID
) -> DocumentTemplateResponse:
    template = await repository.get_template(db, tenant_id, template_id)
    if not template:
        raise not_found("Document template not found")
    return _template_to_response(template)


async def update_template(
    db: AsyncSession, tenant_id: uuid.UUID, template_id: uuid.UUID, data: DocumentTemplateUpdate
) -> DocumentTemplateResponse:
    update_data = {"prompt_template": data.promptTemplate}
    template = await repository.update_template(db, tenant_id, template_id, update_data)
    if not template:
        raise not_found("Document template not found")
    return _template_to_response(template)


# --- Mandates ---
async def list_mandates(
    db: AsyncSession, tenant_id: uuid.UUID, status: str | None = None
) -> list[MandateResponse]:
    mandates = await repository.list_mandates(db, tenant_id, status)
    return [_mandate_to_response(m) for m in mandates]


async def get_mandate(
    db: AsyncSession, tenant_id: uuid.UUID, mandate_id: uuid.UUID
) -> MandateResponse:
    mandate = await repository.get_mandate(db, tenant_id, mandate_id)
    if not mandate:
        raise not_found("Mandate not found")
    return _mandate_to_response(mandate)


async def create_mandate(
    db: AsyncSession, tenant_id: uuid.UUID, user_id: uuid.UUID, data: MandateCreate
) -> MandateResponse:
    create_data: dict = {"name": data.name, "created_by": user_id}
    if data.status is not None:
        create_data["status"] = data.status
    if data.targetAllocation is not None:
        create_data["target_allocation"] = data.targetAllocation
    if data.expectedReturn is not None:
        create_data["expected_return"] = data.expectedReturn
    if data.timeHorizon is not None:
        create_data["time_horizon"] = data.timeHorizon
    if data.investmentTypes is not None:
        create_data["investment_types"] = data.investmentTypes
    if data.assetAllocation is not None:
        create_data["asset_allocation"] = data.assetAllocation
    if data.targetSectors is not None:
        create_data["target_sectors"] = data.targetSectors
    if data.geographicFocus is not None:
        create_data["geographic_focus"] = data.geographicFocus
    if data.investmentCriteria is not None:
        create_data["investment_criteria"] = data.investmentCriteria
    if data.investmentConstraints is not None:
        create_data["investment_constraints"] = data.investmentConstraints
    if data.investmentStrategy is not None:
        create_data["investment_strategy"] = data.investmentStrategy

    mandate = await repository.create_mandate(db, tenant_id, create_data)
    return _mandate_to_response(mandate)


async def update_mandate(
    db: AsyncSession, tenant_id: uuid.UUID, mandate_id: uuid.UUID, data: MandateUpdate
) -> MandateResponse:
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.status is not None:
        update_data["status"] = data.status
    if data.targetAllocation is not None:
        update_data["target_allocation"] = data.targetAllocation
    if data.expectedReturn is not None:
        update_data["expected_return"] = data.expectedReturn
    if data.timeHorizon is not None:
        update_data["time_horizon"] = data.timeHorizon
    if data.investmentTypes is not None:
        update_data["investment_types"] = data.investmentTypes
    if data.assetAllocation is not None:
        update_data["asset_allocation"] = data.assetAllocation
    if data.targetSectors is not None:
        update_data["target_sectors"] = data.targetSectors
    if data.geographicFocus is not None:
        update_data["geographic_focus"] = data.geographicFocus
    if data.investmentCriteria is not None:
        update_data["investment_criteria"] = data.investmentCriteria
    if data.investmentConstraints is not None:
        update_data["investment_constraints"] = data.investmentConstraints
    if data.investmentStrategy is not None:
        update_data["investment_strategy"] = data.investmentStrategy

    mandate = await repository.update_mandate(db, tenant_id, mandate_id, update_data)
    if not mandate:
        raise not_found("Mandate not found")
    return _mandate_to_response(mandate)


async def delete_mandate(
    db: AsyncSession, tenant_id: uuid.UUID, mandate_id: uuid.UUID
) -> bool:
    mandate = await repository.delete_mandate(db, tenant_id, mandate_id)
    if not mandate:
        raise not_found("Mandate not found")
    return True


# --- Opportunities ---
async def list_opportunities(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    pipeline_status: str | None = None,
    assigned_to: uuid.UUID | None = None,
) -> list[OpportunityResponse]:
    opps = await repository.list_opportunities(db, tenant_id, pipeline_status, assigned_to)
    return [_opportunity_to_response(o) for o in opps]


async def get_opportunity(
    db: AsyncSession, tenant_id: uuid.UUID, opp_id: uuid.UUID
) -> OpportunityResponse:
    opp = await repository.get_opportunity(db, tenant_id, opp_id)
    if not opp:
        raise not_found("Opportunity not found")
    return _opportunity_to_response(opp)


async def create_opportunity(
    db: AsyncSession, tenant_id: uuid.UUID, user_id: uuid.UUID, data: OpportunityCreate
) -> OpportunityResponse:
    create_data: dict = {"name": data.name, "created_by": user_id}
    if data.investmentTypeId is not None:
        create_data["investment_type_id"] = data.investmentTypeId
    if data.assetManagerId is not None:
        create_data["asset_manager_id"] = data.assetManagerId
    if data.snapshotData is not None:
        create_data["snapshot_data"] = data.snapshotData
    if data.sourceType is not None:
        create_data["source_type"] = data.sourceType

    opp = await repository.create_opportunity(db, tenant_id, create_data)
    return _opportunity_to_response(opp)


async def update_opportunity(
    db: AsyncSession, tenant_id: uuid.UUID, opp_id: uuid.UUID, data: OpportunityUpdate
) -> OpportunityResponse:
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.investmentTypeId is not None:
        update_data["investment_type_id"] = data.investmentTypeId
    if data.pipelineStatus is not None:
        update_data["pipeline_status"] = data.pipelineStatus
    if data.assetManagerId is not None:
        update_data["asset_manager_id"] = data.assetManagerId
    if data.assignedTo is not None:
        update_data["assigned_to"] = data.assignedTo
    if data.snapshotData is not None:
        update_data["snapshot_data"] = data.snapshotData

    opp = await repository.update_opportunity(db, tenant_id, opp_id, update_data)
    if not opp:
        raise not_found("Opportunity not found")
    return _opportunity_to_response(opp)


async def delete_opportunity(
    db: AsyncSession, tenant_id: uuid.UUID, opp_id: uuid.UUID
) -> bool:
    opp = await repository.delete_opportunity(db, tenant_id, opp_id)
    if not opp:
        raise not_found("Opportunity not found")
    return True
