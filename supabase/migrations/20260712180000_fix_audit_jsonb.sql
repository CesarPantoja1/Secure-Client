-- Migración para arreglar el tipo json a jsonb y evitar el error: operator does not exist: json ? unknown

-- 1. Reemplazar fn_hash_audit_log
CREATE OR REPLACE FUNCTION fn_hash_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_hash_anterior text;
    v_payload text;
    v_secret text;
    v_headers_text text;
    v_headers jsonb;
BEGIN
    -- Intentar obtener la clave HMAC de las cabeceras HTTP de PostgREST
    v_headers_text := current_setting('request.headers', true);
    IF v_headers_text IS NOT NULL AND v_headers_text <> '' THEN
        BEGIN
            v_headers := v_headers_text::jsonb;
        EXCEPTION WHEN OTHERS THEN
            v_headers := NULL;
        END;
    END IF;

    IF v_headers IS NOT NULL AND v_headers ? 'x-audit-hmac-secret' THEN
        v_secret := v_headers->>'x-audit-hmac-secret';
    ELSE
        -- Fallback a configuración de base de datos o valor por defecto
        v_secret := current_setting('app.audit_hmac_secret', true);
        IF v_secret IS NULL THEN
            -- Clave por defecto para desarrollo/test si no está configurada
            v_secret := 'bfa0595e614d63d7d85b8977ed13a2fcd15dacebb1d9df8422741d4b3d6456d4';
        END IF;
    END IF;

    -- Obtener el hash del último registro insertado
    SELECT hash_integridad INTO v_hash_anterior 
    FROM audit_logs 
    ORDER BY id DESC 
    LIMIT 1;

    -- Si es el primer registro, inicializar con valor semilla
    IF v_hash_anterior IS NULL THEN
        v_hash_anterior := '0000000000000000000000000000000000000000000000000000000000000000';
    END IF;

    NEW.hash_anterior := v_hash_anterior;

    -- Construir payload para HMAC-SHA256
    v_payload := COALESCE(NEW.tenant_id::text, '') || '|' ||
                 COALESCE(NEW.user_id::text, '') || '|' ||
                 COALESCE(NEW.user_email, '') || '|' ||
                 COALESCE(NEW.accion, '') || '|' ||
                 COALESCE(NEW.tabla_afectada, '') || '|' ||
                 COALESCE(NEW.datos_anteriores::text, '') || '|' ||
                 COALESCE(NEW.datos_nuevos::text, '') || '|' ||
                 COALESCE(NEW.ip_origen::text, '') || '|' ||
                 COALESCE(NEW.user_agent, '') || '|' ||
                 v_hash_anterior;

    -- Criptografía HMAC-SHA256 con pgcrypto
    NEW.hash_integridad := encode(hmac(v_payload, v_secret, 'sha256'), 'hex');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Reemplazar fn_audit_log en tablas de negocio
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id uuid;
    v_user_id uuid;
    v_user_email text;
    v_ip_origen inet;
    v_user_agent text;
    v_accion text;
    v_tabla_afectada text;
    v_datos_anteriores jsonb;
    v_datos_nuevos jsonb;
    v_headers_text text;
    v_headers jsonb;
    v_claims_text text;
    v_jwt_claims jsonb;
BEGIN
    v_accion := TG_OP;
    v_tabla_afectada := TG_TABLE_NAME::text;

    -- Asignación de datos anteriores y nuevos según la operación
    IF TG_OP = 'INSERT' THEN
        v_datos_anteriores := NULL;
        v_datos_nuevos := to_jsonb(NEW);
        v_tenant_id := NEW.tenant_id;
    ELSIF TG_OP = 'UPDATE' THEN
        v_datos_anteriores := to_jsonb(OLD);
        v_datos_nuevos := to_jsonb(NEW);
        v_tenant_id := NEW.tenant_id;
    ELSIF TG_OP = 'DELETE' THEN
        v_datos_anteriores := to_jsonb(OLD);
        v_datos_nuevos := NULL;
        v_tenant_id := OLD.tenant_id;
    END IF;

    -- Leer cabeceras HTTP de PostgREST
    v_headers_text := current_setting('request.headers', true);
    IF v_headers_text IS NOT NULL AND v_headers_text <> '' THEN
        BEGIN
            v_headers := v_headers_text::jsonb;
        EXCEPTION WHEN OTHERS THEN
            v_headers := NULL;
        END;
    END IF;

    -- Leer claims JWT de PostgREST
    v_claims_text := current_setting('request.jwt.claims', true);
    IF v_claims_text IS NOT NULL AND v_claims_text <> '' THEN
        BEGIN
            v_jwt_claims := v_claims_text::jsonb;
        EXCEPTION WHEN OTHERS THEN
            v_jwt_claims := NULL;
        END;
    END IF;

    -- Resolver ID de Usuario (Header personalizado o JWT claim sub)
    IF v_headers IS NOT NULL AND v_headers ? 'x-audit-user-id' AND v_headers->>'x-audit-user-id' <> '' THEN
        v_user_id := (v_headers->>'x-audit-user-id')::uuid;
    ELSIF v_jwt_claims IS NOT NULL AND v_jwt_claims ? 'sub' THEN
        v_user_id := (v_jwt_claims->>'sub')::uuid;
    END IF;

    -- Resolver Correo de Usuario (Header personalizado o JWT claim email)
    IF v_headers IS NOT NULL AND v_headers ? 'x-audit-user-email' THEN
        v_user_email := v_headers->>'x-audit-user-email';
    ELSIF v_jwt_claims IS NOT NULL AND v_jwt_claims ? 'email' THEN
        v_user_email := v_jwt_claims->>'email';
    END IF;

    -- Resolver IP Origen
    IF v_headers IS NOT NULL AND v_headers ? 'x-audit-ip' AND v_headers->>'x-audit-ip' <> '' THEN
        v_ip_origen := (v_headers->>'x-audit-ip')::inet;
    ELSIF v_headers IS NOT NULL AND v_headers ? 'x-forwarded-for' AND v_headers->>'x-forwarded-for' <> '' THEN
        v_ip_origen := (split_part(v_headers->>'x-forwarded-for', ',', 1))::inet;
    END IF;

    -- Resolver User Agent
    IF v_headers IS NOT NULL AND v_headers ? 'x-audit-user-agent' THEN
        v_user_agent := v_headers->>'x-audit-user-agent';
    ELSIF v_headers IS NOT NULL AND v_headers ? 'user-agent' THEN
        v_user_agent := v_headers->>'user-agent';
    END IF;

    -- Resolver Tenant ID si no se encontró en la fila (ej. fallback)
    IF v_tenant_id IS NULL THEN
        IF v_headers IS NOT NULL AND v_headers ? 'x-audit-tenant-id' AND v_headers->>'x-audit-tenant-id' <> '' THEN
            v_tenant_id := (v_headers->>'x-audit-tenant-id')::uuid;
        ELSIF v_jwt_claims IS NOT NULL AND v_jwt_claims ? 'app_metadata' AND v_jwt_claims->'app_metadata' ? 'tenant_id' THEN
            v_tenant_id := (v_jwt_claims->'app_metadata'->>'tenant_id')::uuid;
        END IF;
    END IF;

    -- Insertar en la tabla audit_logs
    INSERT INTO audit_logs (
        tenant_id,
        user_id,
        user_email,
        accion,
        tabla_afectada,
        datos_anteriores,
        datos_nuevos,
        ip_origen,
        user_agent
    ) VALUES (
        v_tenant_id,
        v_user_id,
        v_user_email,
        v_accion,
        v_tabla_afectada,
        v_datos_anteriores,
        v_datos_nuevos,
        v_ip_origen,
        v_user_agent
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
