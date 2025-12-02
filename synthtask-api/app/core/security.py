"""
Utilitários de segurança para criptografar/descriptografar dados sensíveis (ex.: credenciais de integrações).
Usa criptografia simétrica Fernet. A chave deriva de ENCRYPTION_SECRET.
"""
import base64
import hashlib
from typing import Union

from cryptography.fernet import Fernet

from .config import settings


def _derive_fernet_key(secret: str) -> bytes:
    """Derivar uma chave Fernet válida a partir de uma string secreta.
    Fernet requer uma chave de 32 bytes codificada em base64 urlsafe.
    """
    # Usar SHA256 para obter 32 bytes e então codificar em base64 urlsafe
    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


_FERNET = Fernet(_derive_fernet_key(settings.ENCRYPTION_SECRET))


def encrypt(plaintext: Union[str, bytes]) -> str:
    """Criptografar texto plano em um token base64 urlsafe."""
    if isinstance(plaintext, str):
        plaintext = plaintext.encode("utf-8")
    token = _FERNET.encrypt(plaintext)
    return token.decode("utf-8")


def decrypt(token: Union[str, bytes]) -> str:
    """Descriptografar o token de volta para texto plano."""
    if isinstance(token, str):
        token = token.encode("utf-8")
    data = _FERNET.decrypt(token)
    return data.decode("utf-8")