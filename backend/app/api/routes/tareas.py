from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from app.core.rate_limit import limiter
from app.schemas.auth import AuthContext
from app.dependencies.auth import get_auth_context, require_admin
from app.schemas.tareas import (
    CreateTareaRequest,
    UpdateTareaRequest,
    TareaResponse,
    TareaListResponse,
)
from app.services.supabase import (
    supabase_admin_client,
    safe_supabase_call,
    set_session_context,
)
from app.core.exceptions import SCMException

router = APIRouter(tags=["tareas"])


@router.get("/tareas", response_model=TareaListResponse)
@limiter.limit("100/minute")
async def get_tareas(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    cliente_id: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    prioridad: Optional[str] = Query(None),
    asignado_a: Optional[str] = Query(None),
    auth_context: AuthContext = Depends(get_auth_context),
):
    tenant_id = auth_context.tenant_id

    query = (
        supabase_admin_client.table("tareas")
        .select("*", count="exact")
        .eq("tenant_id", tenant_id)
    )

    if search:
        query = query.ilike("titulo", f"%{search}%")
    if cliente_id:
        query = query.eq("cliente_id", cliente_id)
    if estado:
        query = query.eq("estado", estado)
    if prioridad:
        query = query.eq("prioridad", prioridad)
    if asignado_a:
        query = query.eq("asignado_a", asignado_a)

    offset = (page - 1) * page_size
    query = query.range(offset, offset + page_size - 1).order("created_at", desc=True)
    query = set_session_context(query, request, auth_context)

    response = safe_supabase_call(query.execute)
    items = response.data
    total = response.count if response.count is not None else 0

    return TareaListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/tareas/{id}", response_model=TareaResponse)
@limiter.limit("100/minute")
async def get_tarea(
    request: Request, id: str, auth_context: AuthContext = Depends(get_auth_context)
):
    query = (
        supabase_admin_client.table("tareas")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", auth_context.tenant_id)
    )
    query = set_session_context(query, request, auth_context)
    response = safe_supabase_call(query.execute)
    if not response.data:
        raise SCMException("Tarea no encontrada", status_code=404, code="not_found")

    return response.data[0]


@router.post("/tareas", response_model=TareaResponse)
@limiter.limit("100/minute")
async def create_tarea(
    request: Request,
    payload: CreateTareaRequest,
    auth_context: AuthContext = Depends(get_auth_context),
):
    # Verificar que el cliente_id pertenece al tenant
    query_check = (
        supabase_admin_client.table("clientes")
        .select("id")
        .eq("id", payload.cliente_id)
        .eq("tenant_id", auth_context.tenant_id)
    )
    query_check = set_session_context(query_check, request, auth_context)
    cliente_check = safe_supabase_call(query_check.execute)
    if not cliente_check.data:
        raise SCMException(
            "El cliente especificado no existe o no pertenece al tenant",
            status_code=400,
            code="bad_request",
        )

    data = payload.model_dump(exclude_unset=True)
    data["tenant_id"] = auth_context.tenant_id

    if data.get("fecha_limite") is not None:
        data["fecha_limite"] = data["fecha_limite"].isoformat()

    query = supabase_admin_client.table("tareas").insert(data)
    query = set_session_context(query, request, auth_context)
    response = safe_supabase_call(query.execute)

    return response.data[0]


@router.put("/tareas/{id}", response_model=TareaResponse)
@limiter.limit("100/minute")
async def update_tarea(
    request: Request,
    id: str,
    payload: UpdateTareaRequest,
    auth_context: AuthContext = Depends(get_auth_context),
):
    query_check = (
        supabase_admin_client.table("tareas")
        .select("id")
        .eq("id", id)
        .eq("tenant_id", auth_context.tenant_id)
    )
    query_check = set_session_context(query_check, request, auth_context)
    check = safe_supabase_call(query_check.execute)
    if not check.data:
        raise SCMException("Tarea no encontrada", status_code=404, code="not_found")

    data = payload.model_dump(exclude_unset=True)
    if not data:
        return await get_tarea(request, id, auth_context)

    if data.get("fecha_limite") is not None:
        data["fecha_limite"] = data["fecha_limite"].isoformat()

    data["updated_at"] = datetime.utcnow().isoformat()

    query = (
        supabase_admin_client.table("tareas")
        .update(data)
        .eq("id", id)
        .eq("tenant_id", auth_context.tenant_id)
    )
    query = set_session_context(query, request, auth_context)
    response = safe_supabase_call(query.execute)

    return response.data[0]


@router.delete("/tareas/{id}")
@limiter.limit("100/minute")
async def delete_tarea(
    request: Request, id: str, auth_context: AuthContext = Depends(require_admin)
):
    query_check = (
        supabase_admin_client.table("tareas")
        .select("id")
        .eq("id", id)
        .eq("tenant_id", auth_context.tenant_id)
    )
    query_check = set_session_context(query_check, request, auth_context)
    check = safe_supabase_call(query_check.execute)
    if not check.data:
        raise SCMException("Tarea no encontrada", status_code=404, code="not_found")

    query = (
        supabase_admin_client.table("tareas")
        .delete()
        .eq("id", id)
        .eq("tenant_id", auth_context.tenant_id)
    )
    query = set_session_context(query, request, auth_context)
    safe_supabase_call(query.execute)

    return {"success": True, "message": "Tarea eliminada"}
