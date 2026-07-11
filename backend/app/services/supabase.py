import logging
from typing import Any, Callable

from supabase import Client, create_client

from app.core.config import settings
from app.core.exceptions import SCMException

logger = logging.getLogger("scm.backend")

# Initialize Supabase clients using environment-based keys.
supabase_client: Client = create_client(settings.supabase_url, settings.supabase_anon_key)
supabase_admin_client: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)


def safe_supabase_call(operation: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
    """Wrap a Supabase operation and convert failures into SCM-specific exceptions."""
    try:
        return operation(*args, **kwargs)
    except Exception as exc:  # pragma: no cover - defensive wrapper
        logger.exception("Supabase operation failed", exc_info=exc)
        raise SCMException("Supabase operation failed", status_code=502, code="supabase_error") from exc


def set_session_context(user_id: str | None = None, tenant_id: str | None = None) -> dict[str, str | None]:
    """Return a minimal context payload for downstream auth/tenant flows."""
    return {"user_id": user_id, "tenant_id": tenant_id}
