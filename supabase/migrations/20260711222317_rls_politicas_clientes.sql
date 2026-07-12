-- Habilitar Row Level Security en la tabla clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Idempotencia: borrar políticas si existen antes de crearlas
DROP POLICY IF EXISTS "Miembros del tenant pueden ver clientes" ON clientes;
DROP POLICY IF EXISTS "Miembros del tenant pueden insertar clientes" ON clientes;
DROP POLICY IF EXISTS "Miembros del tenant pueden actualizar clientes" ON clientes;
DROP POLICY IF EXISTS "Solo admin puede eliminar clientes del tenant" ON clientes;

-- Política SELECT
CREATE POLICY "Miembros del tenant pueden ver clientes"
ON clientes FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
);

-- Política INSERT
CREATE POLICY "Miembros del tenant pueden insertar clientes"
ON clientes FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
);

-- Política UPDATE
CREATE POLICY "Miembros del tenant pueden actualizar clientes"
ON clientes FOR UPDATE
TO authenticated
USING (
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
)
WITH CHECK (
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
);

-- Política DELETE
CREATE POLICY "Solo admin puede eliminar clientes del tenant"
ON clientes FOR DELETE
TO authenticated
USING (
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
