-- Crear tabla tenants
CREATE TABLE IF NOT EXISTS tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    plan text,
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Crear tabla users (vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    tenant_id uuid REFERENCES tenants(id),
    email text NOT NULL,
    nombre_completo text,
    role text CHECK (role IN ('admin','empleado')),
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Crear índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON users(tenant_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
