import os
import re
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Set
from jose import jwt, JWTError
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.core.config import settings

ph = PasswordHasher()

# In-memory Revocation List for revoked JWT tokens (JTI / access tokens)
REVOKED_TOKENS: Set[str] = set()

# Pending MFA challenge store: { "challenge_id": { "user_id": str, "otp": str, "expires_at": datetime } }
MFA_CHALLENGES: Dict[str, Dict[str, Any]] = {}


def hash_password(password: str) -> str:
    """Hashes password using native Argon2id."""
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against Argon2 hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False
    except Exception:
        return False


def create_access_token(user_id: str, role: str, institute_id: Optional[str] = None, expires_delta: Optional[timedelta] = None) -> str:
    """Generates 15-minute JWT access token."""
    delta = expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + delta
    payload = {
        "sub": user_id,
        "role": role,
        "institute_id": institute_id,
        "type": "access",
        "jti": hashlib.sha256(f"{user_id}:{expire.timestamp()}".encode()).hexdigest()[:16],
        "exp": expire
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Generates 7-day refresh token stored in httpOnly SameSite=Strict cookie."""
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "jti": hashlib.sha256(f"refresh:{user_id}:{expire.timestamp()}".encode()).hexdigest()[:16],
        "exp": expire
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decodes and validates JWT token signature and expiration."""
    if token in REVOKED_TOKENS:
        raise ValueError("Token has been revoked upon logout.")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid or expired token: {str(e)}")


def revoke_token(token: str):
    """Adds token to the revocation list."""
    REVOKED_TOKENS.add(token)


# Short-Lived Signed URLs for Document Viewing (valid for 5 minutes)
def generate_signed_document_token(document_id: str, user_id: str, expiry_minutes: int = 5) -> str:
    expire = int((datetime.utcnow() + timedelta(minutes=expiry_minutes)).timestamp())
    sig_raw = f"{document_id}:{user_id}:{expire}"
    sig = hmac.new(settings.SECRET_KEY.encode(), sig_raw.encode(), hashlib.sha256).hexdigest()
    return f"{expire}.{sig}"


def verify_signed_document_token(document_id: str, user_id: str, token: str) -> bool:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return False
        expire_str, sig = parts
        expire = int(expire_str)
        if datetime.utcnow().timestamp() > expire:
            return False # Expired signed URL
        expected_raw = f"{document_id}:{user_id}:{expire}"
        expected_sig = hmac.new(settings.SECRET_KEY.encode(), expected_raw.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(sig, expected_sig)
    except Exception:
        return False


# PII Masking Helpers
def mask_pan(pan: Optional[str]) -> str:
    """Masks PAN: ABCDE1234F -> ABCDE****F."""
    if not pan:
        return "N/A"
    clean = pan.strip().upper()
    if len(clean) == 10:
        return f"{clean[:5]}****{clean[-1]}"
    return f"{clean[:2]}****"


def mask_mobile(phone: Optional[str]) -> str:
    """Masks mobile number: +91-9823456789 -> 98****6789."""
    if not phone:
        return "N/A"
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if len(digits) >= 10:
        return f"{digits[:2]}****{digits[-4:]}"
    return f"{phone[:2]}****"


def mask_aadhaar(aadhaar: Optional[str]) -> str:
    """Masks Aadhaar: 1234 5678 9012 -> **** **** 9012."""
    if not aadhaar:
        return "N/A"
    digits = re.sub(r'\D', '', aadhaar)
    if len(digits) >= 4:
        return f"**** **** {digits[-4:]}"
    return "****"
