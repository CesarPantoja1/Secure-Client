import logging
from typing import Any, Callable

from supabase import Client, create_client
from fastapi import Request
from app.schemas.auth import AuthContext
from app.core.config import settings
from app.core.exceptions import SCMException

logger = logging.getLogger("scm.backend")

# Initialize Supabase clients using environment-based keys.
supabase_client: Client = create_client(
    settings.supabase_url, settings.supabase_anon_key
)
supabase_admin_client: Client = create_client(
    settings.supabase_url, settings.supabase_service_role_key
)


def safe_supabase_call(operation: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
    """Wrap a Supabase operation and convert failures into SCM-specific exceptions."""
    try:
        return operation(*args, **kwargs)
    except Exception as exc:  # pragma: no cover - defensive wrapper
        logger.exception("Supabase operation failed", exc_info=exc)
        raise SCMException(
            "Supabase operation failed", status_code=502, code="supabase_error"
        ) from exc




def set_session_context(
    query_builder: Any, request: Request, auth_context: AuthContext | None = None
) -> Any:
    """Injects audit session context headers into the PostgREST query builder."""
    ip = request.client.host if request.client else "127.0.0.1"
    if "x-forwarded-for" in request.headers:
        ip = request.headers["x-forwarded-for"].split(",")[0].strip()

    user_id = ""
    user_email = "anonymous@system"
    tenant_id = ""

    if auth_context:
        user_id = str(auth_context.user_id) if auth_context.user_id else ""
        user_email = auth_context.email if auth_context.email else "anonymous@system"
        tenant_id = str(auth_context.tenant_id) if auth_context.tenant_id else ""

    query_builder.headers["x-audit-user-id"] = user_id
    query_builder.headers["x-audit-user-email"] = user_email
    query_builder.headers["x-audit-ip"] = ip
    query_builder.headers["x-audit-user-agent"] = request.headers.get("user-agent", "")
    query_builder.headers["x-audit-tenant-id"] = tenant_id
    query_builder.headers["x-audit-hmac-secret"] = settings.audit_hmac_secret
    return query_builder
