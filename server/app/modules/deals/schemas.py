import uuid
from datetime import datetime

from pydantic import BaseModel


# --- Snapshot Config (nested in InvestmentType) ---
class SnapshotFieldSchema(BaseModel):
    name: str
    type: str
    required: bool = False
    instruction: str | None = None
    options: list[str] | None = None


class SnapshotSectionSchema(BaseModel):
    name: str
    sortOrder: int = 0
    fields: list[SnapshotFieldSchema]


class SnapshotConfigSchema(BaseModel):
    sections: list[SnapshotSectionSchema]


# --- Investment Types ---
class InvestmentTypeResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    isSystem: bool
    sortOrder: int
    snapshotConfig: dict
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class InvestmentTypeCreate(BaseModel):
    name: str
    slug: str
    snapshotConfig: dict


class InvestmentTypeUpdate(BaseModel):
    name: str | None = None
    snapshotConfig: dict | None = None
    sortOrder: int | None = None


# --- Document Templates ---
class DocumentTemplateResponse(BaseModel):
    id: uuid.UUID
    investmentTypeId: uuid.UUID
    name: str
    slug: str
    promptTemplate: str
    isSystem: bool
    sortOrder: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class DocumentTemplateUpdate(BaseModel):
    promptTemplate: str


# --- Mandates ---
class AssetAllocationItem(BaseModel):
    assetClass: str
    allocationPct: float
    targetReturn: str | None = None


class MandateResponse(BaseModel):
    id: uuid.UUID
    name: str
    status: str
    targetAllocation: float | None = None
    expectedReturn: str | None = None
    timeHorizon: str | None = None
    investmentTypes: list[str] | None = None
    assetAllocation: dict | None = None
    targetSectors: list[str] | None = None
    geographicFocus: list[str] | None = None
    investmentCriteria: str | None = None
    investmentConstraints: str | None = None
    investmentStrategy: str | None = None
    createdBy: uuid.UUID | None = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class MandateCreate(BaseModel):
    name: str
    status: str | None = None
    targetAllocation: float | None = None
    expectedReturn: str | None = None
    timeHorizon: str | None = None
    investmentTypes: list[str] | None = None
    assetAllocation: dict | None = None
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
    assetAllocation: dict | None = None
    targetSectors: list[str] | None = None
    geographicFocus: list[str] | None = None
    investmentCriteria: str | None = None
    investmentConstraints: str | None = None
    investmentStrategy: str | None = None


# --- Opportunities ---
class MandateFitSchema(BaseModel):
    mandateId: uuid.UUID
    fitScore: float
    reasoning: str | None = None


class OpportunityResponse(BaseModel):
    id: uuid.UUID
    name: str
    investmentTypeId: uuid.UUID | None = None
    investmentTypeName: str | None = None
    pipelineStatus: str
    assetManagerId: uuid.UUID | None = None
    assetManagerName: str | None = None
    assignedTo: uuid.UUID | None = None
    snapshotData: dict
    snapshotCitations: dict
    sourceType: str
    mandateFits: list
    createdBy: uuid.UUID | None = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class OpportunityCreate(BaseModel):
    name: str
    investmentTypeId: uuid.UUID | None = None
    assetManagerId: uuid.UUID | None = None
    snapshotData: dict | None = None
    sourceType: str | None = None


class OpportunityUpdate(BaseModel):
    name: str | None = None
    investmentTypeId: uuid.UUID | None = None
    pipelineStatus: str | None = None
    assetManagerId: uuid.UUID | None = None
    assignedTo: uuid.UUID | None = None
    snapshotData: dict | None = None
