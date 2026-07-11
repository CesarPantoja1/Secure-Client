import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag
from app.core.config import settings


def get_encryption_key() -> bytes:
    """
    Obtiene la clave de cifrado desde la configuración y la decodifica de base64.
    Lanza ValueError si la clave no tiene exactamente 32 bytes (256 bits).
    """
    # Usamos el atributo de instancia, con un respaldo para el caso de alias mayúscula
    key_str = getattr(
        settings,
        "field_encryption_key",
        getattr(settings, "FIELD_ENCRYPTION_KEY", None),
    )
    if not key_str:
        # Podríamos omitir esto si asumimos que en test puede venir vacía, pero la especificación pide longitud
        pass

    key_bytes = base64.b64decode(key_str)

    if len(key_bytes) != 32:
        raise ValueError("FIELD_ENCRYPTION_KEY debe decodificar a exactamente 32 bytes")

    return key_bytes


def encrypt_field(plaintext: str, key: bytes) -> bytes:
    """
    Cifra un texto plano utilizando AES-256-GCM.
    Retorna la concatenación del nonce (12 bytes) y el ciphertext con el tag de autenticación.
    """
    nonce = os.urandom(12)
    plaintext_bytes = plaintext.encode("utf-8")
    aesgcm = AESGCM(key)
    ciphertext_with_tag = aesgcm.encrypt(nonce, plaintext_bytes, associated_data=None)
    return nonce + ciphertext_with_tag


def decrypt_field(encrypted_data: bytes, key: bytes) -> str:
    """
    Descifra datos cifrados con AES-256-GCM y verifica su integridad.
    Retorna el texto plano original.
    """
    if len(encrypted_data) < 28:
        raise ValueError("Datos cifrados inválidos: longitud insuficiente")

    nonce = encrypted_data[:12]
    ciphertext_with_tag = encrypted_data[12:]

    aesgcm = AESGCM(key)
    try:
        plaintext_bytes = aesgcm.decrypt(
            nonce, ciphertext_with_tag, associated_data=None
        )
        return plaintext_bytes.decode("utf-8")
    except InvalidTag:
        raise ValueError(
            "Falló la verificación de integridad del cifrado. Los datos pueden estar corruptos."
        )


if __name__ == "__main__":
    print("Iniciando pruebas manuales de cifrado...")

    # 1. Generar una clave de prueba
    test_key_str = base64.b64encode(os.urandom(32)).decode()
    test_key_bytes = base64.b64decode(test_key_str)

    # 2. Cifrar texto de prueba
    original_text = "Texto secreto de prueba para SCM"
    print(f"Texto original: {original_text}")
    encrypted = encrypt_field(original_text, test_key_bytes)

    # 3. Descifrar y verificar
    decrypted = decrypt_field(encrypted, test_key_bytes)
    if decrypted == original_text:
        print("Prueba de cifrado/descifrado: OK")
    else:
        print("Prueba de cifrado/descifrado: FAIL")

    # 4. Verificar que el ciphertext no contiene el texto original
    if original_text.encode("utf-8") not in encrypted:
        print("Prueba de confidencialidad (ciphertext != plaintext): OK")
    else:
        print("Prueba de confidencialidad (ciphertext != plaintext): FAIL")

    # 5. Intentar descifrar con clave incorrecta
    wrong_key_bytes = os.urandom(32)
    try:
        decrypt_field(encrypted, wrong_key_bytes)
        print("Prueba de clave incorrecta: FAIL (debió lanzar excepción)")
    except ValueError as e:
        if "Falló la verificación de integridad del cifrado" in str(e):
            print("Prueba de clave incorrecta: OK")
        else:
            print(f"Prueba de clave incorrecta: FAIL (excepción inesperada: {e})")
