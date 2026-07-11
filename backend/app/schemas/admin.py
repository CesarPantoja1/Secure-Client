from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class CreateTenantRequest(BaseModel):
    nombre_tenant: str = Field(..., max_length=100)
    email_admin: EmailStr
    password_admin: str = Field(..., min_length=8)
    nombre_completo_admin: str


class CreateTenantResponse(BaseModel):
    tenant_id: UUID
    user_id: UUID
    message: str
