-- Crear tabla tareas
CREATE TABLE IF NOT EXISTS tareas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    titulo text NOT NULL,
    descripcion text,
    estado text CHECK (estado IN ('pendiente', 'en_progreso', 'completada')) DEFAULT 'pendiente',
    prioridad text CHECK (prioridad IN ('alta', 'media', 'baja')) DEFAULT 'media',
    asignado_a uuid REFERENCES users(id) ON DELETE SET NULL,
    fecha_limite date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Índices de optimización
CREATE INDEX IF NOT EXISTS tareas_tenant_id_idx ON tareas(tenant_id);
CREATE INDEX IF NOT EXISTS tareas_cliente_id_idx ON tareas(cliente_id);
CREATE INDEX IF NOT EXISTS tareas_asignado_a_idx ON tareas(asignado_a);
CREATE INDEX IF NOT EXISTS tareas_estado_idx ON tareas(estado);
