-- Crear tabla revoked_tokens para lista negra de JWTs
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    jti text UNIQUE NOT NULL,
    exp timestamptz NOT NULL,
    revoked_at timestamptz DEFAULT now()
);

-- Crear índices para optimizar búsquedas por JTI y limpieza de expirados
CREATE INDEX IF NOT EXISTS revoked_tokens_jti_idx ON revoked_tokens(jti);
CREATE INDEX IF NOT EXISTS revoked_tokens_exp_idx ON revoked_tokens(exp);
