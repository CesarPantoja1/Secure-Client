import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.s3 import export_logs_to_s3
from app.tasks.cleanup_tokens import cleanup_revoked_tokens

logger = logging.getLogger("scm.backend")

scheduler = BackgroundScheduler()

def start_scheduler():
    if not scheduler.running:
        # 1. Tarea de exportación a S3 (cada medianoche)
        scheduler.add_job(
            export_logs_to_s3,
            "cron",
            hour=0,
            minute=0,
            id="export_audit_logs",
            replace_existing=True
        )
        logger.info("Tarea programada de exportación a S3 registrada (diaria a medianoche).")
        
        # 2. Tarea de limpieza de tokens revocados (cada hora)
        scheduler.add_job(
            cleanup_revoked_tokens,
            "interval",
            hours=1,
            id="cleanup_tokens",
            replace_existing=True
        )
        logger.info("Tarea programada de limpieza de tokens registrada (cada 1 hora).")
        
        scheduler.start()
        logger.info("Scheduler de tareas en segundo plano iniciado.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler de tareas en segundo plano detenido.")
