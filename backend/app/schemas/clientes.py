from datetime import datetime
from typing import Literal, Optional, List
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID


class CreateClienteRequest(BaseModel):
    nombre: str = Field(..., max_length=100)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    tipo: Literal["contable", "medico", "marketing"]
    notas_sensibles: Optional[str] = None


class UpdateClienteRequest(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    tipo: Optional[Literal["contable", "medico", "marketing"]] = None
    notas_sensibles: Optional[str] = None


class ClienteResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    nombre: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    tipo: str
    notas_sensibles: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class ClienteListResponse(BaseModel):
    items: List[ClienteResponse]
    total: int
    page: int
    page_size: int
