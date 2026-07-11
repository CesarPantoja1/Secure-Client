import secrets
import jwt
import logging
from fastapi import APIRouter, Request, Response, HTTPException
from app.schemas.auth import LoginRequest, LoginResponse
from app.services.supabase import supabase_client, safe_supabase_call
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
        try:
            unverified_header = jwt.get_unverified_header(token)
            logger.info("Unverified token header in get_me: %s", unverified_header)
        except Exception as ex:
            logger.error("Failed to parse token header in get_me: %s", ex)
        payload = decode_supabase_token(token)

        # Extract role
        root_role = payload.get("role")
        if root_role == "service_role":
            role = "service_role"
        else:
            app_metadata = payload.get("app_metadata", {})
            role = app_metadata.get("role", "empleado")

        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "role": role,
            "tenant_id": payload.get("app_metadata", {}).get("tenant_id"),
        }
    except jwt.InvalidTokenError as e:
        logger.warning("JWT decode failed in get_me: %s - %s", type(e).__name__, str(e))
        raise HTTPException(status_code=401, detail="Token inválido")
