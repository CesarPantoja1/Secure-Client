-- Crear tabla clientes (Idempotente)
CREATE TABLE IF NOT EXISTS clientes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    email text,
    telefono text,
    tipo text CHECK (tipo IN ('contable', 'medico', 'marketing')),
    notas_sensibles bytea,
    created_by uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Crear índices para optimizar consultas por tenant_id
CREATE INDEX IF NOT EXISTS clientes_tenant_id_idx ON clientes(tenant_id);
