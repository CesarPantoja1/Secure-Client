import logging
from app.services.s3 import export_logs_to_s3

logger = logging.getLogger("scm.backend")

def run_export_audit_task():
    logger.info("Ejecutando tarea programada: exportación de logs de auditoría")
    try:
        export_logs_to_s3()
        logger.info("Tarea programada de exportación de logs finalizada con éxito")
    except Exception as e:
        logger.exception("Error en la tarea programada de exportación de logs", exc_info=e)
