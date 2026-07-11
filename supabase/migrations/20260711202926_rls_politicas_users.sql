-- Habilitar Row Level Security en la tabla users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política SELECT: todos los roles del tenant pueden ver usuarios de su tenant
CREATE POLICY "Usuarios visibles por miembros de su tenant"
ON users FOR SELECT
TO authenticated
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

-- Política INSERT: solo admin del tenant puede crear usuarios
CREATE POLICY "Admin puede insertar usuarios en su tenant"
ON users FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Política UPDATE: solo admin del tenant puede actualizar usuarios
CREATE POLICY "Admin puede actualizar usuarios de su tenant"
ON users FOR UPDATE
TO authenticated
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Política DELETE: solo admin del tenant puede eliminar/desactivar usuarios
CREATE POLICY "Admin puede eliminar usuarios de su tenant"
ON users FOR DELETE
TO authenticated
USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
