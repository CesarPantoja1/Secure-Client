from datetime import date, datetime
from typing import Optional, Literal, List
from pydantic import BaseModel, Field


class CreateTareaRequest(BaseModel):
    cliente_id: str = Field(..., description="ID del cliente asociado a la tarea")
    titulo: str = Field(..., min_length=1, max_length=255)
    descripcion: Optional[str] = None
    estado: Literal["pendiente", "en_progreso", "completada"] = "pendiente"
    prioridad: Literal["alta", "media", "baja"] = "media"
    asignado_a: Optional[str] = Field(None, description="ID del usuario asignado")
    fecha_limite: Optional[date] = None


class UpdateTareaRequest(BaseModel):
    titulo: Optional[str] = Field(None, min_length=1, max_length=255)
    descripcion: Optional[str] = None
    estado: Optional[Literal["pendiente", "en_progreso", "completada"]] = None
    prioridad: Optional[Literal["alta", "media", "baja"]] = None
    asignado_a: Optional[str] = None
    fecha_limite: Optional[date] = None


class TareaResponse(BaseModel):
    id: str
    tenant_id: str
    cliente_id: str
    titulo: str
    descripcion: Optional[str] = None
    estado: str
    prioridad: str
    asignado_a: Optional[str] = None
    fecha_limite: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TareaListResponse(BaseModel):
    items: List[TareaResponse]
    total: int
    page: int
    page_size: int
