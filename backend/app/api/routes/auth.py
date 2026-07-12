import secrets
import jwt
import logging
from fastapi import APIRouter, Request, Response, HTTPException
from app.schemas.auth import LoginRequest, LoginResponse
from app.services.supabase import (
    supabase_client,
    supabase_admin_client,
    safe_supabase_call,
)
from app.core.exceptions import SCMException
from app.core.rate_limit import limiter

from app.dependencies.auth import decode_supabase_token

logger = logging.getLogger("scm.backend")

router = APIRouter(prefix="/api", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/15minutes")
def login(request: Request, response: Response, req: LoginRequest):
    try:
        auth_res = safe_supabase_call(
            supabase_client.auth.sign_in_with_password,
            {"email": req.email, "password": req.password},
        )
    except SCMException:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    if not auth_res.session:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # Verificar si el usuario está activo
    try:
        user_data = safe_supabase_call(
            supabase_admin_client.table("users")
            .select("activo")
            .eq("id", auth_res.user.id)
            .execute
        )
        if user_data.data and not user_data.data[0].get("activo", True):
            # Si está explícitamente desactivado
            raise HTTPException(status_code=401, detail="Cuenta desactivada")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verificando estado activo: {e}")
        raise HTTPException(status_code=500, detail="Error interno verificando estado")

    # Set cookies
    response.set_cookie(
        key="scm_access_token",
        value=auth_res.session.access_token,
        httponly=True,
        secure=True,
        samesite="strict",
    )
    response.set_cookie(
        key="scm_refresh_token",
        value=auth_res.session.refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
    )

    # Generate CSRF token
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(
        key="scm_csrf_token",
        value=csrf_token,
        httponly=False,  # So frontend JS can read it
        secure=True,
        samesite="strict",
    )

    return LoginResponse(success=True, message="Login successful")


@router.get("/me")
def get_me(request: Request):
    token = request.cookies.get("scm_access_token")
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")

    try:
        payload = decode_supabase_token(token)

        # Extract role
        root_role = payload.get("role")
        if root_role == "service_role":
            role = "service_role"
        else:
            app_metadata = payload.get("app_metadata", {})
            role = app_metadata.get("role", "empleado")

        user_id = payload.get("sub")
        tenant_id = payload.get("app_metadata", {}).get("tenant_id")

        name = None
        tenant_name = None

        if user_id:
            try:
                user_res = safe_supabase_call(
                    supabase_admin_client.table("users")
                    .select("nombre_completo")
                    .eq("id", user_id)
                    .execute
                )
                if user_res.data:
                    name = user_res.data[0].get("nombre_completo")
            except Exception as e:
                logger.error(f"Error fetching user name from DB: {e}")

        if tenant_id:
            try:
                tenant_res = safe_supabase_call(
                    supabase_admin_client.table("tenants")
                    .select("nombre")
                    .eq("id", tenant_id)
                    .execute
                )
                if tenant_res.data:
                    tenant_name = tenant_res.data[0].get("nombre")
            except Exception as e:
                logger.error(f"Error fetching tenant name from DB: {e}")

        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "role": role,
            "tenant_id": tenant_id,
            "name": name,
            "tenantName": tenant_name,
        }
    except jwt.InvalidTokenError as e:
        logger.warning("JWT decode failed in get_me: %s - %s", type(e).__name__, str(e))
        raise HTTPException(status_code=401, detail="Token inválido")


@router.post("/logout")
@limiter.limit("10/minute")
def logout(request: Request, response: Response):
    token = request.cookies.get("scm_access_token")
    if token:
        try:
            # We decode without verify_signature to be able to revoke even if expired
            payload = jwt.decode(
                token,
                options={
                    "verify_signature": False  # nosemgrep: python.jwt.security.unverified-jwt-decode.unverified-jwt-decode
                },
            )
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti and exp:
                from datetime import datetime, timezone

                safe_supabase_call(
                    supabase_admin_client.table("revoked_tokens")
                    .insert(
                        {
                            "jti": jti,
                            "exp": datetime.fromtimestamp(
                                exp, tz=timezone.utc
                            ).isoformat(),
                            "revoked_at": datetime.now(timezone.utc).isoformat(),
                        }
                    )
                    .execute
                )
        except Exception as e:
            logger.warning(f"Error extracting jti on logout: {e}")

    # Clear cookies by setting max_age=0
    response.set_cookie(
        key="scm_access_token",
        value="",
        max_age=0,
        httponly=True,
        secure=True,
        samesite="strict",
    )
    response.set_cookie(
        key="scm_refresh_token",
        value="",
        max_age=0,
        httponly=True,
        secure=True,
        samesite="strict",
    )
    response.set_cookie(
        key="scm_csrf_token",
        value="",
        max_age=0,
        httponly=False,
        secure=True,
        samesite="strict",
    )

    return {"success": True, "message": "Sesión cerrada correctamente"}
