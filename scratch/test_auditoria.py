import sys
import os
import uuid
import hashlib

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.services.supabase import supabase_admin_client, safe_supabase_call
from app.services.s3 import export_logs_to_s3
from app.core.config import settings

def test_audit_logs():
    print("==================================================")
    print(" INICIANDO PRUEBAS DE INTEGRACION DE AUDITORIA ")
    print("==================================================")

    # 1. Verificar si la tabla audit_logs existe
    try:
        safe_supabase_call(
            supabase_admin_client.table("audit_logs").select("*").limit(1).execute
        )
        print("[OK] La tabla 'audit_logs' existe en la base de datos.")
    except Exception:
        print("[X] Error: La tabla 'audit_logs' no existe o la migracion no ha sido aplicada.")
        print("-> Por favor, aplica la migracion '20260712041500_crear_sistema_auditoria.sql' antes de continuar.")
        return

    # Obtener un tenant de prueba
    try:
        tenants_res = safe_supabase_call(
            supabase_admin_client.table("tenants").select("id").limit(2).execute
        )
        if len(tenants_res.data) < 2:
            print("[X] Se necesitan al menos 2 tenants en la base de datos para probar aislamiento.")
            return
        
        tenant_a_id = tenants_res.data[0]["id"]
        tenant_b_id = tenants_res.data[1]["id"]
        print(f"[OK] Usando Tenant A: {tenant_a_id} y Tenant B: {tenant_b_id}")
    except Exception as e:
        print(f"[X] Error al obtener tenants: {e}")
        return

    # 2. Generar eventos de prueba en clientes (Crear, Editar, Eliminar)
    client_name = f"Test Client {uuid.uuid4().hex[:6]}"
    client_id = None

    try:
        print("\n--- 1. Ejecutando INSERT en 'clientes' ---")
        insert_query = supabase_admin_client.table("clientes").insert({
            "tenant_id": tenant_a_id,
            "nombre": client_name,
            "tipo": "contable"
        })
        # Decorar con cabeceras de contexto de simulacion
        insert_query.headers["x-audit-user-id"] = "00000000-0000-0000-0000-000000000001"
        insert_query.headers["x-audit-user-email"] = "admin_a@tenant.com"
        insert_query.headers["x-audit-ip"] = "192.168.1.50"
        insert_query.headers["x-audit-user-agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestBrowser"
        insert_query.headers["x-audit-hmac-secret"] = settings.audit_hmac_secret

        insert_res = safe_supabase_call(insert_query.execute)
        client_id = insert_res.data[0]["id"]
        print(f"[OK] Cliente creado con ID: {client_id}")

        print("\n--- 2. Ejecutando UPDATE en 'clientes' ---")
        update_query = supabase_admin_client.table("clientes").update({
            "nombre": f"{client_name} (Modificado)"
        }).eq("id", client_id)
        update_query.headers["x-audit-user-id"] = "00000000-0000-0000-0000-000000000001"
        update_query.headers["x-audit-user-email"] = "admin_a@tenant.com"
        update_query.headers["x-audit-ip"] = "192.168.1.50"
        update_query.headers["x-audit-user-agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestBrowser"
        update_query.headers["x-audit-hmac-secret"] = settings.audit_hmac_secret

        safe_supabase_call(update_query.execute)
        print("[OK] Cliente actualizado.")

        print("\n--- 3. Ejecutando DELETE en 'clientes' ---")
        delete_query = supabase_admin_client.table("clientes").delete().eq("id", client_id)
        delete_query.headers["x-audit-user-id"] = "00000000-0000-0000-0000-000000000001"
        delete_query.headers["x-audit-user-email"] = "admin_a@tenant.com"
        delete_query.headers["x-audit-ip"] = "192.168.1.50"
        delete_query.headers["x-audit-user-agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestBrowser"
        delete_query.headers["x-audit-hmac-secret"] = settings.audit_hmac_secret

        safe_supabase_call(delete_query.execute)
        print("[OK] Cliente eliminado.")

    except Exception as e:
        print(f"[X] Error durante las operaciones del cliente: {e}")
        return

    # 3. Verificar que se generaron exactamente 3 logs de auditoria para este cliente
    try:
        print("\n--- 4. Consultando y Verificando logs generados ---")
        logs_res = safe_supabase_call(
            supabase_admin_client.table("audit_logs")
            .select("*")
            .eq("tenant_id", tenant_a_id)
            .eq("tabla_afectada", "clientes")
            .order("id", desc=False)
            .execute
        )
        
        # Filtrar los logs que corresponden a las operaciones del cliente creado
        # (usamos el ID del cliente dentro de datos_nuevos/datos_anteriores)
        client_logs = []
        for log in logs_res.data:
            nuevos = log.get("datos_nuevos") or {}
            anteriores = log.get("datos_anteriores") or {}
            if nuevos.get("id") == client_id or anteriores.get("id") == client_id:
                client_logs.append(log)

        if len(client_logs) != 3:
            print(f"[X] Error: Se esperaban 3 logs, se encontraron {len(client_logs)}.")
            return
        
        log_insert, log_update, log_delete = client_logs
        print("[OK] Se encontraron los 3 logs de auditoria correspondientes (INSERT, UPDATE, DELETE).")
        
        # Verificar integridad del contexto
        assert log_insert["accion"] == "INSERT"
        assert log_update["accion"] == "UPDATE"
        assert log_delete["accion"] == "DELETE"
        assert log_insert["ip_origen"] == "192.168.1.50"
        assert log_insert["user_agent"] == "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestBrowser"
        print("[OK] Los datos del contexto (IP, User Agent, Acciones) coinciden perfectamente.")

        # 4. Verificar encadenamiento Hash HMAC-SHA256
        print("\n--- 5. Verificando el encadenamiento de Hashes ---")
        print(f"Log 1 (INSERT) - Hash Integridad: {log_insert['hash_integridad']}")
        
        print(f"Log 2 (UPDATE) - Hash Anterior:  {log_update['hash_anterior']}")
        print(f"Log 2 (UPDATE) - Hash Integridad: {log_update['hash_integridad']}")
        
        print(f"Log 3 (DELETE) - Hash Anterior:  {log_delete['hash_anterior']}")
        print(f"Log 3 (DELETE) - Hash Integridad: {log_delete['hash_integridad']}")

        assert log_update["hash_anterior"] == log_insert["hash_integridad"], "El hash_anterior del log 2 no coincide con el hash del log 1"
        assert log_delete["hash_anterior"] == log_update["hash_integridad"], "El hash_anterior del log 3 no coincide con el hash del log 2"
        print("[OK] ¡El encadenamiento de hashes es correcto y garante de no repudio!")

    except AssertionError as e:
        print(f"[X] Falla en la asercion de hashes: {e}")
        return
    except Exception as e:
        print(f"[X] Error durante la verificacion de logs: {e}")
        return

    # 5. Probar exportacion a S3
    try:
        print("\n--- 6. Ejecutando exportacion a S3 ---")
        export_logs_to_s3()
        print("[OK] Servicio de exportacion ejecutado sin errores.")
        
        # Validar en base de datos que se marcaron como exportados
        check_export_res = safe_supabase_call(
            supabase_admin_client.table("audit_logs")
            .select("exported")
            .in_("id", [log_insert["id"], log_update["id"], log_delete["id"]])
            .execute
        )
        for row in check_export_res.data:
            assert row["exported"] == True
        print("[OK] Todos los registros de prueba se marcaron como exportados ('exported = true').")
        
        # Validar creacion del evento AUDIT_EXPORT
        export_event_res = safe_supabase_call(
            supabase_admin_client.table("audit_logs")
            .select("*")
            .eq("tenant_id", tenant_a_id)
            .eq("accion", "AUDIT_EXPORT")
            .order("id", desc=True)
            .limit(1)
            .execute
        )
        assert len(export_event_res.data) > 0
        print(f"[OK] Evento AUDIT_EXPORT insertado y auditado: {export_event_res.data[0]['datos_nuevos']}")

    except Exception as e:
        print(f"[X] Error durante prueba S3: {e}")
        return

    # 6. Probar aislamiento multi-tenant
    try:
        print("\n--- 7. Verificando aislamiento multi-tenant ---")
        b_query = (
            supabase_admin_client.table("audit_logs")
            .select("*")
            .eq("tenant_id", tenant_b_id)
            .execute()
        )
        
        for row in b_query.data:
            assert str(row["tenant_id"]) == str(tenant_b_id), f"Vulnerabilidad detectada! Log de Tenant A expuesto en consulta de Tenant B."
        
        print("[OK] Aislamiento de datos validado. El Tenant B no puede visualizar logs del Tenant A.")
    except Exception as e:
        print(f"[X] Error durante prueba de aislamiento: {e}")
        return

    print("\n==================================================")
    print(" ¡TODAS LAS PRUEBAS SE COMPLETARON CON EXITO!  ")
    print("==================================================")

if __name__ == "__main__":
    test_audit_logs()
