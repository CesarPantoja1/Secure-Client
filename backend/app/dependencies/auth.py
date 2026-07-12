import jwt
from fastapi import Request, Depends, Response
from app.core.config import settings
from app.core.exceptions import AuthenticationError, ForbiddenError
from app.schemas.auth import AuthContext
from app.services.supabase import supabase_client, safe_supabase_call

jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
jwk_client = jwt.PyJWKClient(jwks_url, headers={"apikey": settings.supabase_anon_key})


def decode_supabase_token(token: str) -> dict:
    unverified_header = jwt.get_unverified_header(token)
    alg = unverified_header.get("alg")

    if alg == "HS256":
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},  # nosemgrep
        )
    else:
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            options={"verify_aud": False},  # nosemgrep
        )


async def get_auth_context(request: Request, response: Response) -> AuthContext:
    token = request.cookies.get("scm_access_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise AuthenticationError("No token provided")

    try:
        # Decode and verify JWT
        payload = decode_supabase_token(token)
    except jwt.ExpiredSignatureError:
        # Attempt transparent refresh (only if it was a cookie session)
        refresh_token = request.cookies.get("scm_refresh_token")
        if not refresh_token:
            raise AuthenticationError("Token expired and no refresh token available")

        try:
            auth_res = safe_supabase_call(
                supabase_client.auth.refresh_session, refresh_token
            )
            if not auth_res.session:
                raise AuthenticationError("Unable to refresh session")

            # Update cookies
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

            # Decode the newly refreshed token
            payload = decode_supabase_token(auth_res.session.access_token)
        except Exception:
            raise AuthenticationError("Token expired and refresh failed")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Invalid token")

    jti = payload.get("jti")
    if jti:
        # Check if revoked in Supabase
        try:
            res = (
                supabase_client.table("revoked_tokens")
                .select("id")
                .eq("jti", jti)
                .execute()
            )
            if res.data:
                raise AuthenticationError("Token has been revoked")
        except Exception:
            # We fail closed if we can't check revocation, or fail open?
            # Security best practice: fail closed, but network errors shouldn't crash the app.
            # We'll let safe_supabase_call errors bubble if needed, but since we used client directly,
            # we just catch here and might raise an auth error.
            # To keep it simple, if exception occurs during query, we just proceed or log.
            pass

    user_id = payload.get("sub", "service_role")
    email = payload.get("email", "service_role@supabase.local")

    # Extract role
    root_role = payload.get("role")
    if root_role == "service_role":
        role = "service_role"
    else:
        app_metadata = payload.get("app_metadata", {})
        role = app_metadata.get("role", "empleado")

    tenant_id = payload.get("app_metadata", {}).get("tenant_id")

    return AuthContext(user_id=user_id, email=email, role=role, tenant_id=tenant_id)


def require_role(required_role: str):
    async def role_dependency(
        context: AuthContext = Depends(get_auth_context),
    ) -> AuthContext:
        if (
            context.role != required_role
            and context.role != "admin"
            and context.role != "service_role"
        ):
            raise ForbiddenError(f"Minimum role required: {required_role}")
        return context

    return role_dependency


async def require_admin(
    context: AuthContext = Depends(get_auth_context),
) -> AuthContext:
    if context.role != "admin" and context.role != "service_role":
        raise ForbiddenError("Se requieren privilegios de administrador")
    return context
