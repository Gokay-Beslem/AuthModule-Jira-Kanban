"""Authentication API endpoints (Register, Login, Password Reset)."""

from flask import Blueprint, current_app, jsonify, request

from backend.db import db_session
from backend.security import (
    hash_password,
    validate_email,
    validate_password_strength,
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
