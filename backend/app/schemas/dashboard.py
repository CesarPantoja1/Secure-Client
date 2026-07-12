from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime


class MetricCard(BaseModel):
    title: str
    value: int
    icon: str
    color: str


class RecentActivity(BaseModel):
    id: int
    accion: str
    tabla_afectada: str
    timestamp: datetime
    descripcion: str
    user_email: Optional[str] = None


class RecentClient(BaseModel):
    id: str
    nombre: str
    empresa: Optional[str] = None
    estado: str
    created_at: datetime


class DashboardResponse(BaseModel):
    total_clientes: int
    clientes_activos: int = 0
    clientes_riesgo: int = 0
    tareas_pendientes: int
    tareas_en_progreso: int
    tareas_completadas: int
    tareas_criticas: int = 0
    tareas_bloqueadas: int = 0
    total_usuarios: Optional[int] = None
    actividad_reciente: List[RecentActivity]
    rol: str
    pipeline_clientes: dict = {}
    tareas_estado_dist: dict = {}
    clientes_recientes: List[RecentClient] = []

    model_config = ConfigDict(from_attributes=True)
