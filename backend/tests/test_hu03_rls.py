import pytest
import uuid
import time
import time
import os
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def get_unique_email(prefix: str):
    return f"{prefix}_{int(time.time())}_{uuid.uuid4().hex[:6]}@test.com"

data_store = {}

def test_01_crear_tenants():
    # 1. Crear tenant A
    email_admin_a = get_unique_email("admin_a")
    headers = {"Authorization": f"Bearer {settings.supabase_service_role_key}"}
    res_a = client.post("/api/admin/tenants", json={
        "nombre_tenant": "Tenant A RLS Test",
        "email_admin": email_admin_a,
        "password_admin": "Password123!",
        "nombre_completo_admin": "Admin A"
    }, headers=headers)
    assert res_a.status_code == 200, res_a.text
    data_store["tenant_a"] = res_a.json()
    data_store["admin_a_creds"] = {"email": email_admin_a, "password": "Password123!"}

    # 2. Crear tenant B
    email_admin_b = get_unique_email("admin_b")
    res_b = client.post("/api/admin/tenants", json={
        "nombre_tenant": "Tenant B RLS Test",
        "email_admin": email_admin_b,
        "password_admin": "Password123!",
        "nombre_completo_admin": "Admin B"
    }, headers=headers)
    assert res_b.status_code == 200, res_b.text
    data_store["tenant_b"] = res_b.json()
    data_store["admin_b_creds"] = {"email": email_admin_b, "password": "Password123!"}

def get_auth_cookies_and_csrf(creds: dict):
    res = client.post("/api/login", json=creds)
    assert res.status_code == 200, res.text
    csrf_token = res.cookies.get("scm_csrf_token")
    return dict(res.cookies), csrf_token

def test_02_admin_a_crea_usuarios():
    # Login Admin A
    cookies_a, csrf_a = get_auth_cookies_and_csrf(data_store["admin_a_creds"])
    data_store["admin_a_cookies"] = cookies_a
    data_store["admin_a_csrf"] = csrf_a

    # Crear empleado A1
    email_emp1 = get_unique_email("emp1")
    res1 = client.post("/api/admin/users", json={
        "email": email_emp1,
        "password": "Password123!",
        "nombre_completo": "Empleado A1",
        "role": "empleado"
    }, cookies=cookies_a, headers={"X-CSRF-Token": csrf_a})
    
    assert res1.status_code == 201, res1.text
    data_store["emp1_data"] = res1.json()
    data_store["emp1_creds"] = {"email": email_emp1, "password": "Password123!"}

    # Crear empleado A2
    email_emp2 = get_unique_email("emp2")
    res2 = client.post("/api/admin/users", json={
        "email": email_emp2,
        "password": "Password123!",
        "nombre_completo": "Empleado A2",
        "role": "empleado"
    }, cookies=cookies_a, headers={"X-CSRF-Token": csrf_a})
    
    assert res2.status_code == 201, res2.text
    data_store["emp2_data"] = res2.json()

def test_03_admin_b_no_ve_usuarios_tenant_a():
    # Login Admin B
    cookies_b, csrf_b = get_auth_cookies_and_csrf(data_store["admin_b_creds"])

    # Listar usuarios del tenant B
    res = client.get("/api/admin/users", cookies=cookies_b)
    assert res.status_code == 200, res.text
    users = res.json()["users"]

    # No debe ver a nadie del Tenant A
    emails = [u["email"] for u in users]
    assert data_store["admin_a_creds"]["email"] not in emails
    assert data_store["emp1_creds"]["email"] not in emails
    assert data_store["emp2_data"]["email"] not in emails
    assert data_store["admin_b_creds"]["email"] in emails

def test_04_empleado_no_tiene_permiso_admin():
    # Login Empleado A1
    cookies_emp, csrf_emp = get_auth_cookies_and_csrf(data_store["emp1_creds"])

    # Intentar acceder a listar usuarios (ruta de admin)
    res = client.get("/api/admin/users", cookies=cookies_emp)
    assert res.status_code == 403, "Se esperaba 403 Forbidden para empleado"

def test_05_admin_a_desactiva_empleado_y_no_puede_loguearse():
    cookies_a = data_store["admin_a_cookies"]
    csrf_a = data_store["admin_a_csrf"]
    emp1_id = data_store["emp1_data"]["id"]

    # Desactivar
    res_del = client.delete(f"/api/admin/users/{emp1_id}", cookies=cookies_a, headers={"X-CSRF-Token": csrf_a})
    assert res_del.status_code == 200, res_del.text
    assert res_del.json()["activo"] is False

    # Intentar login con emp1 desactivado
    res_login = client.post("/api/login", json=data_store["emp1_creds"])
    assert res_login.status_code == 401, "Se esperaba 401 si el usuario está desactivado"
