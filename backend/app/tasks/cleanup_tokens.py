from datetime import datetime
import logging
from app.services.supabase import supabase_admin_client, safe_supabase_call

logger = logging.getLogger("scm.backend")


def cleanup_revoked_tokens():
    logger.info("Iniciando limpieza de tokens revocados expirados")
    try:
        now_iso = datetime.utcnow().isoformat()
        response = safe_supabase_call(
            supabase_admin_client.table("revoked_tokens")
            .delete()
            .lt("exp", now_iso)
            .execute
        )
        deleted_count = len(response.data) if response.data else 0
        logger.info(
            f"Limpieza completada. Se eliminaron {deleted_count} tokens expirados."
        )
    except Exception as e:
        logger.exception("Error durante la limpieza de tokens revocados", exc_info=e)
