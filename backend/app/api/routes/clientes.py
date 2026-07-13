from datetime import datetime
from fastapi import APIRouter, Depends, Query, Request
from app.core.rate_limit import limiter
from app.schemas.auth import AuthContext
from app.dependencies.auth import get_auth_context, require_admin
from app.schemas.clientes import (
    CreateClienteRequest,
    UpdateClienteRequest,
    ClienteResponse,
    ClienteListResponse,
)
from app.services.supabase import (
    supabase_admin_client,
    safe_supabase_call,
    set_session_context,
)
from app.services.encryption import encrypt_field, decrypt_field, get_encryption_key
from app.core.exceptions import SCMException

router = APIRouter(tags=["clientes"])


def serialize_bytea(data: bytes) -> str:
    """Convierte bytes a formato hexadecimal admitido por PostgreSQL bytea"""
    return f"\\x{data.hex()}"


def deserialize_bytea(data: str) -> bytes:
    """Convierte formato bytea string de PostgREST de regreso a bytes"""
    if data.startswith("\\x"):
        return bytes.fromhex(data[2:])
    return bytes.fromhex(data)


@router.get("/clientes", response_model=ClienteListResponse)
@limiter.limit("100/minute")
async def get_clientes(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    tipo: str = Query(None),
    auth_context: AuthContext = Depends(get_auth_context),
):
    tenant_id = auth_context.tenant_id

    query = (
        supabase_admin_client.table("clientes")
        .select("*", count="exact")
        .eq("tenant_id", tenant_id)
    )
    if search:
        query = query.ilike("nombre", f"%{search}%")
    if tipo:
        query = query.eq("tipo", tipo)

    offset = (page - 1) * page_size
    query = query.range(offset, offset + page_size - 1)
    query = set_session_context(query, request, auth_context)

    response = safe_supabase_call(query.execute)
    items = response.data
    total = response.count if response.count is not None else 0

    key = None
    for item in items:
        notas = item.get("notas_sensibles")
        if notas and notas != "\\x":
            try:
                if key is None:
                    key = get_encryption_key()
                encrypted_bytes = deserialize_bytea(notas)
                item["notas_sensibles"] = decrypt_field(encrypted_bytes, key)
            except Exception:
                item["notas_sensibles"] = "Error: no se pudo descifrar"
        else:
            item["notas_sensibles"] = None

    return ClienteListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/clientes/{id}", response_model=ClienteResponse)
@limiter.limit("100/minute")
async def get_cliente(
    request: Request, id: str, auth_context: AuthContext = Depends(get_auth_context)
):
    query = (
        supabase_admin_client.table("clientes")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", auth_context.tenant_id)
    )
    query = set_session_context(query, request, auth_context)
    response = safe_supabase_call(query.execute)
    if not response.data:
        raise SCMException("Cliente no encontrado", status_code=404, code="not_found")

    item = response.data[0]
    notas = item.get("notas_sensibles")
    if notas and notas != "\\x":
        try:
            key = get_encryption_key()
            encrypted_bytes = deserialize_bytea(notas)
            item["notas_sensibles"] = decrypt_field(encrypted_bytes, key)
        except Exception:
            item["notas_sensibles"] = "Error: no se pudo descifrar"
    else:
        item["notas_sensibles"] = None

    return item


@router.post("/clientes", response_model=ClienteResponse)
@limiter.limit("100/minute")
async def create_cliente(
    request: Request,
    payload: CreateClienteRequest,
    auth_context: AuthContext = Depends(get_auth_context),
):
    data = payload.model_dump(exclude_unset=True)
    data["tenant_id"] = auth_context.tenant_id
    data["created_by"] = auth_context.user_id

    notas = data.get("notas_sensibles")
    if notas and notas.strip():
        key = get_encryption_key()
        encrypted_bytes = encrypt_field(notas, key)
        data["notas_sensibles"] = serialize_bytea(encrypted_bytes)
    else:
        data["notas_sensibles"] = None

    query = supabase_admin_client.table("clientes").insert(data)
    query = set_session_context(query, request, auth_context)
    response = safe_supabase_call(query.execute)

    item = response.data[0]
    notas_resp = item.get("notas_sensibles")
    if notas_resp and notas_resp != "\\x":
        try:
            key = get_encryption_key()
            encrypted_bytes = deserialize_bytea(notas_resp)
            item["notas_sensibles"] = decrypt_field(encrypted_bytes, key)
        except Exception:
            item["notas_sensibles"] = "Error: no se pudo descifrar"
    else:
        item["notas_sensibles"] = None

    return item


@router.put("/clientes/{id}", response_model=ClienteResponse)
@limiter.limit("100/minute")
async def update_cliente(
    request: Request,
    id: str,
    payload: UpdateClienteRequest,
    auth_context: AuthContext = Depends(get_auth_context),
):
    query_check = (
        supabase_admin_client.table("clientes")
        .select("id")
        .eq("id", id)
        .eq("tenant_id", auth_context.tenant_id)
    )
    query_check = set_session_context(query_check, request, auth_context)
    check = safe_supabase_call(query_check.execute)
    if not check.data:
        raise SCMException("Cliente no encontrado", status_code=404, code="not_found")

    data = payload.model_dump(exclude_unset=True)
    if not data:
        return await get_cliente(request, id, auth_context)

    if "notas_sensibles" in data:
        notas = data["notas_sensibles"]
        if notas and notas.strip():
            key = get_encryption_key()
            encrypted_bytes = encrypt_field(notas, key)
            data["notas_sensibles"] = serialize_bytea(encrypted_bytes)
        else:
            data["notas_sensibles"] = None

    data["updated_at"] = datetime.utcnow().isoformat()

    query = (
        supabase_admin_client.table("clientes")
        .update(data)
        .eq("id", id)
        .eq("tenant_id", auth_context.tenant_id)
    )
    query = set_session_context(query, request, auth_context)
    response = safe_supabase_call(query.execute)

    item = response.data[0]
    notas_resp = item.get("notas_sensibles")
    if notas_resp and notas_resp != "\\x":
        try:
            key = get_encryption_key()
            encrypted_bytes = deserialize_bytea(notas_resp)
            item["notas_sensibles"] = decrypt_field(encrypted_bytes, key)
        except Exception:
            item["notas_sensibles"] = "Error: no se pudo descifrar"
    else:
        item["notas_sensibles"] = None

    return item


@router.delete("/clientes/{id}")
@limiter.limit("100/minute")
async def delete_cliente(
    request: Request, id: str, auth_context: AuthContext = Depends(require_admin)
):
    query_check = (
        supabase_admin_client.table("clientes")
        .select("id")
        .eq("id", id)
        .eq("tenant_id", auth_context.tenant_id)
    )
    query_check = set_session_context(query_check, request, auth_context)
    check = safe_supabase_call(query_check.execute)
    if not check.data:
        raise SCMException("Cliente no encontrado", status_code=404, code="not_found")

    query = (
        supabase_admin_client.table("clientes")
        .delete()
        .eq("id", id)
        .eq("tenant_id", auth_context.tenant_id)
    )
    query = set_session_context(query, request, auth_context)
    safe_supabase_call(query.execute)

    return {"success": True, "message": "Cliente eliminado"}
