from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from uuid import UUID

from app.core.rate_limit import limiter
from app.dependencies.auth import require_admin
from app.schemas.auth import AuthContext
from app.services.supabase import supabase_admin_client, safe_supabase_call
from app.core.config import settings

router = APIRouter(tags=["auditoria"])

@router.get("/auditoria")
@limiter.limit("50/minute")
async def get_auditoria(
    request: Request,
    user_id: Optional[UUID] = Query(None),
    accion: Optional[str] = Query(None),
    tabla_afectada: Optional[str] = Query(None),
    ip_origen: Optional[str] = Query(None),
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    auth_context: AuthContext = Depends(require_admin),
):
    tenant_id = auth_context.tenant_id

    # 1. Construir la consulta a Supabase
    query = (
        supabase_admin_client.table("audit_logs")
        .select("*", count="exact")
        .eq("tenant_id", tenant_id)
    )

    if user_id:
        query = query.eq("user_id", str(user_id))
    if accion:
        query = query.eq("accion", accion)
    if tabla_afectada:
        query = query.eq("tabla_afectada", tabla_afectada)
    if ip_origen:
        query = query.eq("ip_origen", ip_origen)
    if fecha_desde:
        query = query.gte("timestamp", fecha_desde.isoformat())
    if fecha_hasta:
        query = query.lte("timestamp", f"{fecha_hasta.isoformat()}T23:59:59.999999")

    # Ordenar por timestamp descendente
    query = query.order("timestamp", desc=True)

    # Paginación
    offset = (page - 1) * page_size
    query = query.range(offset, offset + page_size - 1)

    # Inyectar contexto de sesión en la query de auditoría
    client_ip = request.client.host if request.client else "127.0.0.1"
    if "x-forwarded-for" in request.headers:
        client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()

    query.headers["x-audit-user-id"] = str(auth_context.user_id)
    query.headers["x-audit-user-email"] = auth_context.email
    query.headers["x-audit-ip"] = client_ip
    query.headers["x-audit-user-agent"] = request.headers.get("user-agent", "")
    query.headers["x-audit-tenant-id"] = str(auth_context.tenant_id)
    query.headers["x-audit-hmac-secret"] = settings.audit_hmac_secret

    response = safe_supabase_call(query.execute)
    items = response.data
    total = response.count if response.count is not None else 0

    # 2. Meta-auditoría: Registrar la consulta en audit_logs (AUDIT_QUERY)
    filtros = {}
    if user_id:
        filtros["user_id"] = str(user_id)
    if accion:
        filtros["accion"] = accion
    if tabla_afectada:
        filtros["tabla_afectada"] = tabla_afectada
    if ip_origen:
        filtros["ip_origen"] = ip_origen
    if fecha_desde:
        filtros["fecha_desde"] = fecha_desde.isoformat()
    if fecha_hasta:
        filtros["fecha_hasta"] = fecha_hasta.isoformat()
    filtros["page"] = page
    filtros["page_size"] = page_size

    meta_event = {
        "tenant_id": str(tenant_id),
        "user_id": str(auth_context.user_id),
        "user_email": auth_context.email,
        "accion": "AUDIT_QUERY",
        "tabla_afectada": "audit_logs",
        "datos_anteriores": None,
        "datos_nuevos": filtros,
        "ip_origen": client_ip,
        "user_agent": request.headers.get("user-agent", "")
    }

    # Insertar el log de meta-auditoría
    meta_query = supabase_admin_client.table("audit_logs").insert(meta_event)
    meta_query.headers["x-audit-hmac-secret"] = settings.audit_hmac_secret
    safe_supabase_call(meta_query.execute)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }
