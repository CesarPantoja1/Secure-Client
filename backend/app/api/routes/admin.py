from fastapi import APIRouter, Query, Request, Depends
from app.schemas.admin import CreateTenantRequest, CreateTenantResponse
from app.schemas.users import (
    CreateUserRequest,
    UpdateUserRequest,
    UserResponse,
    UserListResponse,
)
from app.schemas.auth import AuthContext
from app.services.supabase import supabase_admin_client, safe_supabase_call, set_session_context
from app.core.exceptions import ConflictError, NotFoundError, SCMException
from app.core.rate_limit import limiter
from app.dependencies.auth import require_admin

router = APIRouter(
    prefix="/api/admin", tags=["Admin"], dependencies=[Depends(require_admin)]
)


# ──────────────────────────────────────────────
# Tenant provisioning
# ──────────────────────────────────────────────


@router.post("/tenants", response_model=CreateTenantResponse)
@limiter.limit("30/minute")
def create_tenant(request: Request, req: CreateTenantRequest):
    # Insertar el tenant usando la key de admin (service role)
    try:
        query = (
            supabase_admin_client.table("tenants")
            .insert({"nombre": req.nombre_tenant, "activo": True})
        )
        query = set_session_context(query, request)
        tenant_res = safe_supabase_call(query.execute)
        if not tenant_res.data:
            raise SCMException("Error al crear tenant")

        tenant_id = tenant_res.data[0]["id"]
    except Exception as e:
        raise SCMException(f"No se pudo crear el tenant: {e}")

    # Crear el usuario en Supabase Auth
    try:
        auth_res = safe_supabase_call(
            supabase_admin_client.auth.admin.create_user,
            {
                "email": req.email_admin,
                "password": req.password_admin,
                "email_confirm": True,
                "app_metadata": {"role": "admin", "tenant_id": tenant_id},
            },
        )
        user_id = auth_res.user.id
    except Exception as e:
        # Rollback del tenant
        query = supabase_admin_client.table("tenants").delete().eq("id", tenant_id)
        query = set_session_context(query, request)
        safe_supabase_call(query.execute)
        error_str = str(e).lower()
        if "already registered" in error_str or "already exists" in error_str:
            raise ConflictError("El email proporcionado ya está en uso")
        raise SCMException(f"Error al crear usuario auth: {e}")

    # Insertar en la tabla pública users
    try:
        query = supabase_admin_client.table("users").insert(
            {
                "id": user_id,
                "tenant_id": tenant_id,
                "email": req.email_admin,
                "nombre_completo": req.nombre_completo_admin,
                "role": "admin",
                "activo": True,
            }
        )
        query = set_session_context(query, request)
        safe_supabase_call(query.execute)
    except Exception as e:
        # Rollback usuario auth y tenant
        safe_supabase_call(supabase_admin_client.auth.admin.delete_user, user_id)
        query = supabase_admin_client.table("tenants").delete().eq("id", tenant_id)
        query = set_session_context(query, request)
        safe_supabase_call(query.execute)
        raise SCMException(f"Error al registrar usuario en base de datos: {e}")

    return CreateTenantResponse(
        tenant_id=tenant_id,
        user_id=user_id,
        message="Tenant y administrador creados exitosamente",
    )


# ──────────────────────────────────────────────
# User management (scoped to admin's tenant)
# ──────────────────────────────────────────────


@router.get("/users", response_model=UserListResponse)
@limiter.limit("60/minute")
def list_users(
    request: Request,
    admin: AuthContext = Depends(require_admin),
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(20, ge=1, le=100, description="Resultados por página"),
):
    """Listar usuarios del tenant del administrador autenticado (paginación)."""
    offset = (page - 1) * page_size

    # Obtener el total de registros del tenant
    query_count = (
        supabase_admin_client.table("users")
        .select("id", count="exact")
        .eq("tenant_id", admin.tenant_id)
    )
    query_count = set_session_context(query_count, request, admin)
    count_res = safe_supabase_call(query_count.execute)
    total = count_res.count if count_res.count is not None else 0

    # Obtener la página solicitada
    query_data = (
        supabase_admin_client.table("users")
        .select("id, email, nombre_completo, role, activo, created_at")
        .eq("tenant_id", admin.tenant_id)
        .order("created_at", desc=False)
        .range(offset, offset + page_size - 1)
    )
    query_data = set_session_context(query_data, request, admin)
    data_res = safe_supabase_call(query_data.execute)

    users = [UserResponse(**row) for row in (data_res.data or [])]
    return UserListResponse(users=users, total=total, page=page, page_size=page_size)


@router.post("/users", response_model=UserResponse, status_code=201)
@limiter.limit("30/minute")
def create_user(
    request: Request,
    req: CreateUserRequest,
    admin: AuthContext = Depends(require_admin),
):
    """Crear usuario en Supabase Auth + tabla users, vinculado al tenant del admin."""
    tenant_id = admin.tenant_id

    # 1. Crear en Supabase Auth con Service Role
    try:
        auth_res = safe_supabase_call(
            supabase_admin_client.auth.admin.create_user,
            {
                "email": req.email,
                "password": req.password,
                "email_confirm": True,
                "app_metadata": {"role": req.role.value, "tenant_id": tenant_id},
            },
        )
        user_id = auth_res.user.id
    except Exception as e:
        error_str = str(e).lower()
        if "already registered" in error_str or "already exists" in error_str:
            raise ConflictError("El email proporcionado ya está en uso")
        raise SCMException(f"Error al crear usuario en auth: {e}")

    # 2. Insertar en la tabla pública users
    try:
        query = supabase_admin_client.table("users").insert(
            {
                "id": user_id,
                "tenant_id": tenant_id,
                "email": req.email,
                "nombre_completo": req.nombre_completo,
                "role": req.role.value,
                "activo": True,
            }
        )
        query = set_session_context(query, request, admin)
        db_res = safe_supabase_call(query.execute)
    except Exception as e:
        # Rollback: eliminar usuario de auth si falla la inserción en DB
        safe_supabase_call(supabase_admin_client.auth.admin.delete_user, user_id)
        raise SCMException(f"Error al registrar usuario en base de datos: {e}")

    return UserResponse(**db_res.data[0])


@router.put("/users/{user_id}", response_model=UserResponse)
@limiter.limit("60/minute")
def update_user(
    user_id: str,
    req: UpdateUserRequest,
    request: Request,
    admin: AuthContext = Depends(require_admin),
):
    """Actualizar rol, estado y/o nombre de un usuario del mismo tenant."""
    # Verificar que el usuario pertenece al tenant del admin
    query_existing = (
        supabase_admin_client.table("users")
        .select("id, role, activo")
        .eq("id", user_id)
        .eq("tenant_id", admin.tenant_id)
    )
    query_existing = set_session_context(query_existing, request, admin)
    existing = safe_supabase_call(query_existing.execute)
    if not existing.data:
        raise NotFoundError("Usuario no encontrado en este tenant")

    # Construir payload de actualización solo con campos proporcionados
    update_data: dict = {}
    if req.nombre_completo is not None:
        update_data["nombre_completo"] = req.nombre_completo
    if req.activo is not None:
        update_data["activo"] = req.activo
    if req.role is not None:
        update_data["role"] = req.role.value

    if not update_data:
        raise SCMException(
            "No se proporcionaron campos para actualizar",
            status_code=400,
            code="bad_request",
        )

    # Si cambia el rol → actualizar app_metadata en Supabase Auth
    if req.role is not None and req.role.value != existing.data[0]["role"]:
        try:
            safe_supabase_call(
                supabase_admin_client.auth.admin.update_user_by_id,
                user_id,
                {
                    "app_metadata": {
                        "role": req.role.value,
                        "tenant_id": admin.tenant_id,
                    }
                },
            )
        except Exception as e:
            raise SCMException(f"Error al actualizar metadata de auth: {e}")

    # Actualizar en la tabla users
    query = (
        supabase_admin_client.table("users")
        .update(update_data)
        .eq("id", user_id)
        .eq("tenant_id", admin.tenant_id)
    )
    query = set_session_context(query, request, admin)
    db_res = safe_supabase_call(query.execute)

    if not db_res.data:
        raise SCMException("Error al actualizar usuario en base de datos")

    return UserResponse(**db_res.data[0])


@router.delete("/users/{user_id}", response_model=UserResponse)
@limiter.limit("30/minute")
def delete_user(
    user_id: str,
    request: Request,
    admin: AuthContext = Depends(require_admin),
):
    """Soft delete: marcar activo = false. NO elimina de Supabase Auth."""
    # Verificar existencia y pertenencia al tenant
    query_existing = (
        supabase_admin_client.table("users")
        .select("id, activo")
        .eq("id", user_id)
        .eq("tenant_id", admin.tenant_id)
    )
    query_existing = set_session_context(query_existing, request, admin)
    existing = safe_supabase_call(query_existing.execute)
    if not existing.data:
        raise NotFoundError("Usuario no encontrado en este tenant")

    if not existing.data[0]["activo"]:
        raise ConflictError("El usuario ya se encuentra desactivado")

    query = (
        supabase_admin_client.table("users")
        .update({"activo": False})
        .eq("id", user_id)
        .eq("tenant_id", admin.tenant_id)
    )
    query = set_session_context(query, request, admin)
    db_res = safe_supabase_call(query.execute)

    return UserResponse(**db_res.data[0])
