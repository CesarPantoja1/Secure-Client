from fastapi import APIRouter, Depends, Request
from datetime import datetime
from typing import List, Optional, Any

from app.schemas.dashboard import DashboardResponse, RecentActivity
from app.dependencies.auth import get_auth_context, AuthContext
from app.services.supabase import safe_supabase_call, supabase_client
from app.core.rate_limit import limiter

router = APIRouter(tags=["dashboard"])

def generar_descripcion(accion: str, tabla: str) -> str:
    accion_upper = accion.upper()
    tabla_lower = tabla.lower()
    
    if accion_upper == "INSERT":
        verbo = "Creó un nuevo registro en"
        if tabla_lower == "clientes":
            return "Creó un nuevo cliente"
        elif tabla_lower == "tareas":
            return "Creó una nueva tarea"
        elif tabla_lower == "notas_reunion":
            return "Creó una nota de reunión"
            
    elif accion_upper == "UPDATE":
        verbo = "Actualizó un registro en"
        if tabla_lower == "clientes":
            return "Actualizó un cliente"
        elif tabla_lower == "tareas":
            return "Actualizó una tarea"
        elif tabla_lower == "notas_reunion":
            return "Actualizó una nota de reunión"
            
    elif accion_upper == "DELETE":
        verbo = "Eliminó un registro en"
        if tabla_lower == "clientes":
            return "Eliminó un cliente"
        elif tabla_lower == "tareas":
            return "Eliminó una tarea"
        elif tabla_lower == "notas_reunion":
            return "Eliminó una nota de reunión"
            
    elif accion_upper == "AUDIT_QUERY":
        return "Consultó el log de auditoría"
        
    return f"{accion} en {tabla}"

@router.get("/dashboard", response_model=DashboardResponse)
@limiter.limit("100/minute")
async def get_dashboard_metrics(
    request: Request,
    auth_ctx: AuthContext = Depends(get_auth_context)
):
    tenant_id = auth_ctx.tenant_id
    user_id = auth_ctx.user_id
    rol = auth_ctx.role
    
    total_clientes = 0
    tareas_pendientes = 0
    tareas_en_progreso = 0
    tareas_completadas = 0
    total_usuarios: Optional[int] = None
    actividad_reciente: List[RecentActivity] = []
    
    if rol == "admin":
        # Clientes
        clientes_query = supabase_client.table("clientes").select("id", count="exact").eq("tenant_id", tenant_id)
        res_clientes = safe_supabase_call(clientes_query.execute)
        total_clientes = res_clientes.count if res_clientes.count is not None else 0
        
        # Tareas
        t_pendientes_query = supabase_client.table("tareas").select("id", count="exact").eq("tenant_id", tenant_id).eq("estado", "pendiente")
        res_tp = safe_supabase_call(t_pendientes_query.execute)
        tareas_pendientes = res_tp.count if res_tp.count is not None else 0
        
        t_progreso_query = supabase_client.table("tareas").select("id", count="exact").eq("tenant_id", tenant_id).eq("estado", "en_progreso")
        res_tpr = safe_supabase_call(t_progreso_query.execute)
        tareas_en_progreso = res_tpr.count if res_tpr.count is not None else 0
        
        t_completadas_query = supabase_client.table("tareas").select("id", count="exact").eq("tenant_id", tenant_id).eq("estado", "completada")
        res_tc = safe_supabase_call(t_completadas_query.execute)
        tareas_completadas = res_tc.count if res_tc.count is not None else 0
        
        # Usuarios (Solo admin)
        usuarios_query = supabase_client.table("users").select("id", count="exact").eq("tenant_id", tenant_id).eq("activo", True)
        res_usr = safe_supabase_call(usuarios_query.execute)
        total_usuarios = res_usr.count if res_usr.count is not None else 0
        
        # Actividad reciente
        audit_query = supabase_client.table("audit_logs").select("*").eq("tenant_id", tenant_id).order("timestamp", desc=True).limit(10)
        res_audit = safe_supabase_call(audit_query.execute)
        logs = res_audit.data
        
    else: # empleado
        # Clientes del empleado
        clientes_query = supabase_client.table("clientes").select("id", count="exact").eq("tenant_id", tenant_id).eq("created_by", user_id)
        res_clientes = safe_supabase_call(clientes_query.execute)
        total_clientes = res_clientes.count if res_clientes.count is not None else 0
        
        # Tareas del empleado
        t_pendientes_query = supabase_client.table("tareas").select("id", count="exact").eq("tenant_id", tenant_id).eq("asignado_a", user_id).eq("estado", "pendiente")
        res_tp = safe_supabase_call(t_pendientes_query.execute)
        tareas_pendientes = res_tp.count if res_tp.count is not None else 0
        
        t_progreso_query = supabase_client.table("tareas").select("id", count="exact").eq("tenant_id", tenant_id).eq("asignado_a", user_id).eq("estado", "en_progreso")
        res_tpr = safe_supabase_call(t_progreso_query.execute)
        tareas_en_progreso = res_tpr.count if res_tpr.count is not None else 0
        
        t_completadas_query = supabase_client.table("tareas").select("id", count="exact").eq("tenant_id", tenant_id).eq("asignado_a", user_id).eq("estado", "completada")
        res_tc = safe_supabase_call(t_completadas_query.execute)
        tareas_completadas = res_tc.count if res_tc.count is not None else 0
        
        # Actividad reciente (Solo la del empleado)
        audit_query = supabase_client.table("audit_logs").select("*").eq("tenant_id", tenant_id).eq("user_id", user_id).order("timestamp", desc=True).limit(10)
        res_audit = safe_supabase_call(audit_query.execute)
        logs = res_audit.data
        
    # Procesar la actividad
    for log in logs:
        accion = log.get("accion", "")
        tabla = log.get("tabla_afectada", "")
        ts = log.get("timestamp")
        
        # Convertir timestamp a datetime
        # Asumiendo que el timestamp de supabase es un string ISO
        if isinstance(ts, str):
            try:
                # Truncar 'Z' y parsear
                dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
            except ValueError:
                dt = datetime.now()
        else:
            dt = datetime.now()
            
        actividad_reciente.append(
            RecentActivity(
                id=log.get("id"),
                accion=accion,
                tabla_afectada=tabla,
                timestamp=dt,
                descripcion=generar_descripcion(accion, tabla)
            )
        )
        
    return DashboardResponse(
        total_clientes=total_clientes,
        tareas_pendientes=tareas_pendientes,
        tareas_en_progreso=tareas_en_progreso,
        tareas_completadas=tareas_completadas,
        total_usuarios=total_usuarios,
        actividad_reciente=actividad_reciente,
        rol=rol
    )
