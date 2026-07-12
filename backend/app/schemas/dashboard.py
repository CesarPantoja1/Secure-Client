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

class DashboardResponse(BaseModel):
    total_clientes: int
    tareas_pendientes: int
    tareas_en_progreso: int
    tareas_completadas: int
    total_usuarios: Optional[int] = None
    actividad_reciente: List[RecentActivity]
    rol: str

    model_config = ConfigDict(from_attributes=True)
