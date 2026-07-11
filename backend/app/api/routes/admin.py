from fastapi import APIRouter, Request, Depends
from app.schemas.admin import CreateTenantRequest, CreateTenantResponse
from app.services.supabase import supabase_admin_client, safe_supabase_call
from app.core.exceptions import ConflictError, SCMException
from app.core.rate_limit import limiter
from app.dependencies.auth import require_admin

router = APIRouter(
    prefix="/api/admin", tags=["Admin"], dependencies=[Depends(require_admin)]
)


@router.post("/tenants", response_model=CreateTenantResponse)
@limiter.limit("30/minute")
def create_tenant(request: Request, req: CreateTenantRequest):
    # Insertar el tenant usando la key de admin (service role)
    try:
        tenant_res = safe_supabase_call(
            supabase_admin_client.table("tenants")
            .insert({"nombre": req.nombre_tenant, "activo": True})
            .execute
        )
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
        safe_supabase_call(
            supabase_admin_client.table("tenants").delete().eq("id", tenant_id).execute
        )
        error_str = str(e).lower()
        if "already registered" in error_str or "already exists" in error_str:
            raise ConflictError("El email proporcionado ya está en uso")
        raise SCMException(f"Error al crear usuario auth: {e}")

    # Insertar en la tabla pública users
    try:
        safe_supabase_call(
            supabase_admin_client.table("users")
            .insert(
                {
                    "id": user_id,
                    "tenant_id": tenant_id,
                    "email": req.email_admin,
                    "nombre_completo": req.nombre_completo_admin,
                    "role": "admin",
                    "activo": True,
                }
            )
            .execute
        )
    except Exception as e:
        # Rollback usuario auth y tenant
        safe_supabase_call(supabase_admin_client.auth.admin.delete_user, user_id)
        safe_supabase_call(
            supabase_admin_client.table("tenants").delete().eq("id", tenant_id).execute
        )
        raise SCMException(f"Error al registrar usuario en base de datos: {e}")

    return CreateTenantResponse(
        tenant_id=tenant_id,
        user_id=user_id,
        message="Tenant y administrador creados exitosamente",
    )
