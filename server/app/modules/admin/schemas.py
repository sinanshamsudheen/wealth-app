import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


# --- Organization ---
class AddressSchema(BaseModel):
    line1: str | None = None
    line2: str | None = None
    city: str | None = None
    state: str | None = None
    postalCode: str | None = None
    country: str | None = None


class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    registrationNumber: str | None = None
    website: str | None = None
    currency: str
    timezone: str
    supportEmail: str | None = None
    status: str
    address: AddressSchema | None = None

    class Config:
        from_attributes = True


class UpdateOrganizationRequest(BaseModel):
    name: str | None = None
    registrationNumber: str | None = None
    website: str | None = None
    currency: str | None = None
    timezone: str | None = None
    supportEmail: str | None = None
    address: AddressSchema | None = None


# --- Branding ---
class BrandingResponse(BaseModel):
    headerLogo: str
    brandColor: str
    emailFooter: str | None = None
    smallLogoUrl: str | None = None
    largeLogoUrl: str | None = None

    class Config:
        from_attributes = True


class UpdateBrandingRequest(BaseModel):
    headerLogo: str | None = None
    brandColor: str | None = None
    emailFooter: str | None = None
    smallLogoUrl: str | None = None
    largeLogoUrl: str | None = None


# --- Preferences ---
class PreferencesResponse(BaseModel):
    dateFormat: str
    numberFormat: str

    class Config:
        from_attributes = True


class UpdatePreferencesRequest(BaseModel):
    dateFormat: str | None = None
    numberFormat: str | None = None


# --- Module Roles ---
class ModuleRoleSchema(BaseModel):
    moduleSlug: str
    role: str


# --- Users ---
class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    firstName: str
    lastName: str
    phone: str | None = None
    status: str
    moduleRoles: list[ModuleRoleSchema]

    class Config:
        from_attributes = True


class UpdateUserRequest(BaseModel):
    status: str | None = None
    moduleRoles: list[ModuleRoleSchema] | None = None


# --- Invitations ---
class InvitationResponse(BaseModel):
    id: uuid.UUID
    email: str
    firstName: str
    lastName: str
    moduleRoles: list[ModuleRoleSchema]
    status: str
    invitedBy: uuid.UUID
    expiresAt: datetime
    createdAt: datetime

    class Config:
        from_attributes = True


class CreateInvitationRequest(BaseModel):
    email: EmailStr
    firstName: str
    lastName: str
    moduleRoles: list[ModuleRoleSchema]
