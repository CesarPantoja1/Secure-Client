from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from uuid import UUID

class AuditQueryParams(BaseModel):
    user_id: Optional[UUID] = None
    accion: Optional[str] = None
    tabla_afectada: Optional[str] = None
    ip_origen: Optional[str] = None
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None
    page: int = 1
    page_size: int = 20

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: UUID
    user_id: Optional[UUID] = None
    user_email: Optional[str] = None
    accion: str
    tabla_afectada: str
    datos_anteriores: Optional[dict] = None
    datos_nuevos: Optional[dict] = None
    ip_origen: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime
    hash_integridad: Optional[str] = None
    hash_anterior: Optional[str] = None
    exported: bool
