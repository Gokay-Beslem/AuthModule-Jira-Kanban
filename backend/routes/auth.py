"""Authentication API endpoints (Register, Login, Password Reset)."""

import secrets
import time
from functools import wraps

from flask import Blueprint, current_app, g, jsonify, request

from backend.db import db_session
from backend.security import (
    create_access_token,
    hash_password,
    validate_email,
    validate_password_strength,
    verify_access_token,
    verify_password,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def serialize_user(row) -> dict:
    """Return a public representation of a user row without sensitive fields."""
    return {
        "id": row["id"],
        "full_name": row["full_name"],
        "email": row["email"],
        "created_at": row["created_at"],
    }


@auth_bp.post("/register")
def register():
    """Register a new user account in SQLite (AUTH-4)."""
    payload = request.get_json(silent=True) or {}
    full_name = (payload.get("full_name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if len(full_name) < 3:
        return jsonify({"error": "Ad Soyad en az 3 karakter olmalıdır."}), 400

    email_error = validate_email(email)
    if email_error:
        return jsonify({"error": email_error}), 400

    password_error = validate_password_strength(password)
    if password_error:
        return jsonify({"error": password_error}), 400

    db_path = current_app.config["DB_PATH"]
    password_hash = hash_password(password)

    with db_session(db_path) as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?", (email,)
        ).fetchone()
        if existing:
            return (
                jsonify({"error": "Bu e-posta adresi ile zaten bir hesap kayıtlı."}),
                409,
            )

        cursor = conn.execute(
            "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)",
            (full_name, email, password_hash),
        )
        created_user = conn.execute(
            "SELECT id, full_name, email, created_at FROM users WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()

    return (
        jsonify(
            {
                "message": "Kullanıcı kaydı başarıyla oluşturuldu.",
                "user": serialize_user(created_user),
            }
        ),
        201,
    )


def require_auth(handler):
    """Decorator verifying Bearer token and loading g.current_user from SQLite."""

    @wraps(handler)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Yetkilendirme token'ı eksik."}), 401

        token = auth_header.split(" ", 1)[1].strip()
        payload = verify_access_token(
            token,
            current_app.config["SECRET_KEY"],
            current_app.config["TOKEN_TTL_SECONDS"],
        )
        if not payload:
            return jsonify({"error": "Oturum token'ı geçersiz veya süresi dolmuş."}), 401

        with db_session(current_app.config["DB_PATH"]) as conn:
            user = conn.execute(
                "SELECT id, full_name, email, created_at FROM users WHERE id = ?",
                (payload.get("user_id"),),
            ).fetchone()

        if not user:
            return jsonify({"error": "Kullanıcı bulunamadı."}), 401

        g.current_user = user
        return handler(*args, **kwargs)

    return wrapper


@auth_bp.post("/login")
def login():
    """Authenticate an existing user and issue a signed Bearer token (AUTH-5)."""
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    email_error = validate_email(email)
    if email_error:
        return jsonify({"error": email_error}), 400

    if not password:
        return jsonify({"error": "Şifre alanı zorunludur."}), 400

    with db_session(current_app.config["DB_PATH"]) as conn:
        user = conn.execute(
            "SELECT id, full_name, email, password_hash, created_at FROM users WHERE email = ?",
            (email,),
        ).fetchone()

    if not user or not verify_password(password, user["password_hash"]):
        return jsonify({"error": "E-posta adresi veya şifre hatalı."}), 401

    token = create_access_token(
        user["id"], user["email"], current_app.config["SECRET_KEY"]
    )
    return (
        jsonify(
            {
                "message": "Giriş başarılı.",
                "token": token,
                "user": serialize_user(user),
            }
        ),
        200,
    )


@auth_bp.get("/me")
@require_auth
def get_me():
    """Return the currently authenticated user's profile (AUTH-5)."""
    return jsonify({"user": serialize_user(g.current_user)}), 200


@auth_bp.post("/forgot-password")
def forgot_password():
    """Generate a single-use, time-limited password reset token (AUTH-6)."""
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()

    email_error = validate_email(email)
    if email_error:
        return jsonify({"error": email_error}), 400

    ttl = current_app.config["RESET_TOKEN_TTL_SECONDS"]
    expires_at = int(time.time()) + ttl
    reset_token = secrets.token_urlsafe(24)

    with db_session(current_app.config["DB_PATH"]) as conn:
        user = conn.execute(
            "SELECT id FROM users WHERE email = ?", (email,)
        ).fetchone()
        if not user:
            return (
                jsonify({"error": "Bu e-posta adresine kayıtlı kullanıcı bulunamadı."}),
                404,
            )

        conn.execute(
            "UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0",
            (user["id"],),
        )
        conn.execute(
            "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
            (user["id"], reset_token, expires_at),
        )

    return (
        jsonify(
            {
                "message": "Şifre sıfırlama kodu oluşturuldu.",
                "reset_token": reset_token,
                "expires_in_seconds": ttl,
            }
        ),
        200,
    )


@auth_bp.post("/reset-password")
def reset_password():
    """Verify reset token and update user's password hash in SQLite (AUTH-6)."""
    payload = request.get_json(silent=True) or {}
    token = (payload.get("token") or "").strip()
    new_password = payload.get("new_password") or ""

    if not token:
        return jsonify({"error": "Sıfırlama kodu (token) zorunludur."}), 400

    password_error = validate_password_strength(new_password)
    if password_error:
        return jsonify({"error": password_error}), 400

    now_ts = int(time.time())
    new_hash = hash_password(new_password)

    with db_session(current_app.config["DB_PATH"]) as conn:
        reset_row = conn.execute(
            "SELECT id, user_id, expires_at, used FROM password_resets WHERE token = ?",
            (token,),
        ).fetchone()

        if not reset_row:
            return jsonify({"error": "Geçersiz şifre sıfırlama kodu."}), 400
        if reset_row["used"]:
            return jsonify({"error": "Bu şifre sıfırlama kodu daha önce kullanılmış."}), 400
        if reset_row["expires_at"] < now_ts:
            return jsonify({"error": "Şifre sıfırlama kodunun süresi dolmuş."}), 400

        conn.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (new_hash, reset_row["user_id"]),
        )
        conn.execute(
            "UPDATE password_resets SET used = 1 WHERE id = ?",
            (reset_row["id"],),
        )

    return jsonify({"message": "Şifreniz başarıyla güncellendi."}), 200
