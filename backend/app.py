"""Flask application factory and entrypoint for the Authentication Module."""

from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from backend.config import Config
from backend.db import init_db
from backend.routes.auth import auth_bp

FRONTEND_DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"


def create_app(test_config: dict | None = None) -> Flask:
    """Create and configure the Flask application instance."""
    static_folder = str(FRONTEND_DIST_DIR) if FRONTEND_DIST_DIR.exists() else None
    app = Flask(__name__, static_folder=static_folder, static_url_path="")
    app.config.from_object(Config)

    if test_config:
        app.config.update(test_config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    init_db(app.config["DB_PATH"])
    app.register_blueprint(auth_bp)

    @app.get("/api/health")
    def health_check():
        return jsonify({"status": "ok", "module": "authentication"}), 200

    if static_folder:

        @app.get("/")
        def serve_index():
            return send_from_directory(static_folder, "index.html")

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(host="127.0.0.1", port=5000, debug=True)
