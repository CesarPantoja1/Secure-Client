from fastapi import APIRouter, Depends, Request, status
from app.core.rate_limit import limiter
from app.schemas.auth import AuthContext
from app.dependencies.auth import get_auth_context
from app.schemas.notas import CreateNotaRequest, NotaResponse
from app.services.supabase import supabase_admin_client, safe_supabase_call
from app.services.encryption import encrypt_field, decrypt_field, get_encryption_key
from app.core.exceptions import SCMException

router = APIRouter(tags=["notas"])


def serialize_bytea(data: bytes) -> str:
    """Convierte bytes a formato hexadecimal admitido por PostgreSQL bytea"""
    return f"\\x{data.hex()}"


def deserialize_bytea(data: str) -> bytes:
    """Convierte formato bytea string de PostgREST de regreso a bytes"""
    if data.startswith("\\x"):
        return bytes.fromhex(data[2:])
    return bytes.fromhex(data)


@router.post("/notas", response_model=NotaResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("50/minute")
async def create_nota(
    request: Request,
    nota: CreateNotaRequest,
    auth_context: AuthContext = Depends(get_auth_context),
):
    tenant_id = auth_context.tenant_id
    autor_id = auth_context.user_id

    # 1. Verificar que el cliente existe y pertenece al tenant
    cliente_response = safe_supabase_call(
        supabase_admin_client.table("clientes")
        .select("id")
        .eq("id", str(nota.cliente_id))
        .eq("tenant_id", tenant_id)
        .execute
    )
    if not cliente_response.data:
        raise SCMException("Cliente no encontrado", status.HTTP_404_NOT_FOUND)

    # 2. Cifrar contenido sensible si está presente
    contenido_sensible_bytes = None
    if nota.contenido_sensible:
        key = get_encryption_key()
        cifrado = encrypt_field(nota.contenido_sensible, key)
        contenido_sensible_bytes = serialize_bytea(cifrado)

    # 3. Insertar nota
    insert_data = {
        "tenant_id": tenant_id,
        "cliente_id": str(nota.cliente_id),
        "autor_id": autor_id,
        "contenido": nota.contenido,
        "contenido_sensible": contenido_sensible_bytes,
    }

    response = safe_supabase_call(
        supabase_admin_client.table("notas_reunion").insert(insert_data).execute
    )

    if not response.data:
        raise SCMException(
            "Error al crear la nota", status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Retornar con el contenido sensible original (en plano) para no volver a descifrar inmediatamente
    nota_creada = response.data[0]
    nota_creada["contenido_sensible"] = nota.contenido_sensible

    return nota_creada


@router.get("/notas/{cliente_id}", response_model=list[NotaResponse])
@limiter.limit("100/minute")
async def get_notas(
    request: Request,
    cliente_id: str,
    auth_context: AuthContext = Depends(get_auth_context),
):
    tenant_id = auth_context.tenant_id

    # Obtener las notas
    response = safe_supabase_call(
        supabase_admin_client.table("notas_reunion")
        .select("*")
        .eq("cliente_id", cliente_id)
        .eq("tenant_id", tenant_id)
        .order("created_at", desc=True)
        .execute
    )

    notas = response.data
    key = None

    # Procesar descifrado
    for nota in notas:
        if nota.get("contenido_sensible"):
            if not key:
                key = get_encryption_key()
            try:
                cifrado = deserialize_bytea(nota["contenido_sensible"])
                nota["contenido_sensible"] = decrypt_field(cifrado, key)
            except Exception:
                # Si falla el descifrado, podemos reportar un error controlado o limpiar el campo
                # por seguridad no crasheamos el listado, pero ocultamos los datos corruptos.
                nota["contenido_sensible"] = (
                    "[Error: No se pudo descifrar el contenido sensible]"
                )

    return notas
