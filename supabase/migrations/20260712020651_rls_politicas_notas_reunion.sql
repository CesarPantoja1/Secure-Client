-- Activar Row Level Security
ALTER TABLE public.notas_reunion ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Cualquier usuario (admin o empleado) puede ver las notas de los clientes de SU tenant
CREATE POLICY "Permitir SELECT notas_reunion mismo tenant"
ON public.notas_reunion
FOR SELECT
TO authenticated
USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
);

-- Política INSERT: Cualquier usuario puede añadir notas, siempre que asigne el tenant_id y autor_id correctos
CREATE POLICY "Permitir INSERT notas_reunion mismo tenant"
ON public.notas_reunion
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND
    autor_id = auth.uid()
);

-- IMPORTANTE: NO se crean políticas para UPDATE ni DELETE. 
-- Por defecto, Supabase las denegará con un 403 (cumpliendo el requisito de inmutabilidad).
