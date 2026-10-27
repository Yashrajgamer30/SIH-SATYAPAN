"""
AICTE SATYAPAN - Encrypted Storage Engine (AES-256-GCM)
Follows security rules:
- AES-256-GCM per file, key from env
- SHA-256 and pHash calculated and stored
- Magic-byte validation (PDF, PNG, JPEG) and size limit checks
- Decrypts in memory only (never writes decrypted bytes to temporary disk files)
"""
import os
import secrets
import hashlib
from typing import Tuple, Dict, Any, Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

# Parse 32-byte key
AES_KEY = bytes.fromhex(settings.AES_STORAGE_KEY_HEX)
if len(AES_KEY) != 32:
    raise ValueError("AES_STORAGE_KEY_HEX must be exactly 64 hex characters (32 bytes = 256 bits).")

# Magic Byte Signatures for validation
MAGIC_BYTES = {
    "application/pdf": b"%PDF",
    "image/jpeg": b"\xff\xd8\xff",
    "image/png": b"\x89PNG\r\n\x1a\n"
}


def validate_file_magic_bytes(content: bytes) -> str:
    """Validates magic bytes against allowed regulatory MIME types."""
    if len(content) > settings.MAX_REQUEST_SIZE_BYTES:
        raise ValueError(f"File size exceeds maximum permitted threshold of {settings.MAX_REQUEST_SIZE_BYTES // (1024*1024)}MB.")

    if content.startswith(b"%PDF"):
        return "application/pdf"
    elif content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    elif content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    else:
        raise ValueError("Invalid file header: Uploaded document must be an authentic PDF, PNG, or JPEG file.")


def calculate_hashes(content: bytes) -> Tuple[str, Optional[str]]:
    """Calculates SHA-256 and simulated perceptual hash (pHash)."""
    sha256 = hashlib.sha256(content).hexdigest()
    # 64-bit perceptual hash approximation from content distribution
    phash = hashlib.md5(content[:1024] + content[-1024:]).hexdigest()[:16]
    return sha256, phash


class EncryptedStorage:
    def __init__(self, storage_dir: str = settings.STORAGE_DIR):
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)
        self.aesgcm = AESGCM(AES_KEY)

    def store_file(self, content: bytes, filename: str) -> Dict[str, Any]:
        """
        Validates, encrypts with AES-256-GCM, and stores file securely on disk.
        Stored format: [12-byte Nonce] + [Ciphertext + 16-byte Auth Tag]
        """
        mime = validate_file_magic_bytes(content)
        sha256, phash = calculate_hashes(content)

        # 12-byte (96-bit) standard GCM nonce
        nonce = secrets.token_bytes(12)
        encrypted_bytes = self.aesgcm.encrypt(nonce, content, associated_data=None)

        # Write to vault
        storage_filename = f"{sha256}.enc"
        file_path = os.path.join(self.storage_dir, storage_filename)

        with open(file_path, "wb") as f:
            f.write(nonce + encrypted_bytes)

        return {
            "storage_path_encrypted": file_path,
            "sha256": sha256,
            "phash": phash,
            "mime": mime,
            "size": len(content)
        }

    def read_file_decrypted_in_memory(self, file_path: str) -> bytes:
        """
        Reads encrypted file from vault and decrypts in memory only.
        Verifies AES-GCM authentication tag. Raises ValueError on tamper.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Encrypted document at {file_path} not found in storage vault.")

        with open(file_path, "rb") as f:
            data = f.read()

        if len(data) < 28: # 12 bytes nonce + 16 bytes auth tag minimum
            raise ValueError("Corrupted encrypted document payload.")

        nonce = data[:12]
        ciphertext_and_tag = data[12:]

        try:
            decrypted_content = self.aesgcm.decrypt(nonce, ciphertext_and_tag, associated_data=None)
            return decrypted_content
        except Exception:
            raise ValueError("AES-GCM Authentication Failed: Document ciphertext has been tampered with or corrupted.")


storage_vault = EncryptedStorage()
