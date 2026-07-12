import json
import logging
import hashlib
from datetime import datetime
import boto3
from app.core.config import settings
from app.services.supabase import supabase_admin_client, safe_supabase_call

logger = logging.getLogger("scm.backend")

def export_logs_to_s3():
    logger.info("Iniciando exportación de logs de auditoría a S3")
    try:
        # 1. Consultar audit_logs donde exported = false
        response = safe_supabase_call(
            supabase_admin_client.table("audit_logs")
            .select("*")
            .eq("exported", False)
            .order("id", desc=False)
            .execute
        )
        logs = response.data
        if not logs:
            logger.info("No hay logs de auditoría pendientes por exportar.")
            return

        # 2. Serializar a JSON
        def json_serializer(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            raise TypeError(f"Type {type(obj)} not serializable")

        json_data = json.dumps(logs, default=json_serializer, indent=2)

        # 3. Subir a S3 con boto3.put_object()
        payload_hash = hashlib.sha256(json_data.encode("utf-8")).hexdigest()
        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        key_name = f"audit_logs/audit_export_{timestamp_str}.json"

        # Verificar si AWS está configurado
        is_aws_configured = (
            settings.aws_access_key_id and "tu_aws" not in settings.aws_access_key_id
            and settings.aws_secret_access_key and "tu_aws" not in settings.aws_secret_access_key
            and settings.aws_s3_bucket and "nombre-de" not in settings.aws_s3_bucket
        )

        if is_aws_configured:
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region
            )
            s3_client.put_object(
                Bucket=settings.aws_s3_bucket,
                Key=key_name,
                Body=json_data,
                ContentType="application/json",
                Metadata={
                    "export_date": datetime.utcnow().isoformat(),
                    "sha256_hash": payload_hash,
                    "record_count": str(len(logs))
                }
            )
            logger.info(f"Logs subidos exitosamente a S3: s3://{settings.aws_s3_bucket}/{key_name}")
        else:
            logger.warning("AWS S3 no está configurado. Guardando exportación localmente para simulación.")
            import os
            # Build absolute path to scratch/s3_mock in the workspace
            workspace_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            mock_dir = os.path.join(workspace_dir, "scratch", "s3_mock")
            os.makedirs(mock_dir, exist_ok=True)
            mock_path = os.path.join(mock_dir, f"audit_export_{timestamp_str}.json")
            with open(mock_path, "w", encoding="utf-8") as f:
                f.write(json_data)
            logger.info(f"Logs guardados localmente en: {mock_path}")

        # 4. Marcar como exportados
        log_ids = [log["id"] for log in logs]
        safe_supabase_call(
            supabase_admin_client.table("audit_logs")
            .update({"exported": True})
            .in_("id", log_ids)
            .execute
        )
        logger.info(f"Se marcaron {len(log_ids)} logs como exportados.")

        # 5. Registrar evento AUDIT_EXPORT
        # Buscamos el primer tenant_id de los logs para asociar el evento, o None si no hay
        tenant_id = logs[0].get("tenant_id") if logs else None

        export_event = {
            "tenant_id": tenant_id,
            "accion": "AUDIT_EXPORT",
            "tabla_afectada": "audit_logs",
            "datos_anteriores": None,
            "datos_nuevos": {
                "key_s3": key_name,
                "record_count": len(log_ids),
                "sha256_hash": payload_hash,
                "exported_ids": log_ids
            },
            "user_email": "system@cron",
            "ip_origen": "127.0.0.1",
            "user_agent": "APScheduler-Cron"
        }
        
        # Inject context headers so the before insert trigger calculates hash correctly
        query = supabase_admin_client.table("audit_logs").insert(export_event)
        query.headers["x-audit-hmac-secret"] = settings.audit_hmac_secret
        safe_supabase_call(query.execute)
        logger.info("Evento AUDIT_EXPORT registrado en el log de auditoría.")

    except Exception as e:
        logger.exception("Error durante la exportación de logs a S3", exc_info=e)
        raise
