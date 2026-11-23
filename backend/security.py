"""Security helpers for password hashing, input validation, and token management."""

import re
from typing import Optional

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")


def validate_email(email: str) -> Optional[str]:
    """Validate email syntax; return Turkish error message or None when valid."""
    cleaned = (email or "").strip()
    if not cleaned:
        return "E-posta adresi zorunludur."
    if not EMAIL_REGEX.match(cleaned):
        return "Geçerli bir e-posta adresi giriniz."
    return None


def validate_password_strength(password: str) -> Optional[str]:
    """Validate password complexity (>= 8 chars, upper, lower, digit)."""
    if not password:
        return "Şifre zorunludur."
    if len(password) < 8:
        return "Şifre en az 8 karakter olmalıdır."
    has_upper = any(ch.isupper() for ch in password)
    has_lower = any(ch.islower() for ch in password)
    has_digit = any(ch.isdigit() for ch in password)
    if not (has_upper and has_lower and has_digit):
        return "Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir."
    return None


def hash_password(password: str) -> str:
    """Hash a plaintext password using PBKDF2-HMAC-SHA256."""
    return generate_password_hash(password, method="pbkdf2:sha256")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plaintext password against its stored hash."""
    return check_password_hash(password_hash, password)


def create_access_token(user_id: int, email: str, secret_key: str) -> str:
    """Generate a signed time-limited authentication token."""
    serializer = URLSafeTimedSerializer(secret_key, salt="auth-access-token")
    return serializer.dumps({"user_id": user_id, "email": email})


def verify_access_token(token: str, secret_key: str, max_age: int) -> Optional[dict]:
    """Verify a signed token and return payload or None if invalid/expired."""
    serializer = URLSafeTimedSerializer(secret_key, salt="auth-access-token")
    try:
        return serializer.loads(token, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return None
