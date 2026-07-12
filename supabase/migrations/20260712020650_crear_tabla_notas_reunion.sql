-- Crear tabla notas_reunion
CREATE TABLE public.notas_reunion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    contenido TEXT,
    contenido_sensible BYTEA,
    autor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para optimizar las consultas más comunes (listar notas de un cliente)
CREATE INDEX idx_notas_reunion_tenant_id ON public.notas_reunion(tenant_id);
CREATE INDEX idx_notas_reunion_cliente_id ON public.notas_reunion(cliente_id);
CREATE INDEX idx_notas_reunion_autor_id ON public.notas_reunion(autor_id);
CREATE INDEX idx_notas_reunion_created_at ON public.notas_reunion(created_at DESC);
