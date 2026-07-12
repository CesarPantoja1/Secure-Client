-- Habilitar RLS en tareas
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;

-- Idempotencia
DROP POLICY IF EXISTS "Miembros del tenant pueden ver tareas" ON tareas;
DROP POLICY IF EXISTS "Miembros del tenant pueden insertar tareas" ON tareas;
DROP POLICY IF EXISTS "Miembros del tenant pueden actualizar tareas" ON tareas;
DROP POLICY IF EXISTS "Solo admin puede eliminar tareas" ON tareas;

-- Políticas
CREATE POLICY "Miembros del tenant pueden ver tareas"
ON tareas FOR SELECT
TO authenticated
USING ( (auth.jwt() ->> 'tenant_id') = tenant_id::text );

CREATE POLICY "Miembros del tenant pueden insertar tareas"
ON tareas FOR INSERT
TO authenticated
WITH CHECK ( (auth.jwt() ->> 'tenant_id') = tenant_id::text );

CREATE POLICY "Miembros del tenant pueden actualizar tareas"
ON tareas FOR UPDATE
TO authenticated
USING ( (auth.jwt() ->> 'tenant_id') = tenant_id::text )
WITH CHECK ( (auth.jwt() ->> 'tenant_id') = tenant_id::text );

CREATE POLICY "Solo admin puede eliminar tareas"
ON tareas FOR DELETE
TO authenticated
USING (
    (auth.jwt() ->> 'tenant_id') = tenant_id::text
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
