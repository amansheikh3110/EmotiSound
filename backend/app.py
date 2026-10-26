"""
EmotiSound Flask Application Entrypoint
Factory function for initializing the Flask REST API with CORS and blueprints.
"""

import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from flask import Flask
from flask_cors import CORS

from backend.config import Config, DevelopmentConfig
from backend.utils.errors import register_error_handlers
from backend.api.health import health_bp
from backend.api.inference import inference_bp
from backend.api.evaluation import evaluation_bp
from backend.api.history import history_bp


def create_app(config_class=DevelopmentConfig) -> Flask:
    """Creates and configures the EmotiSound Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure CORS for local frontend dev origin
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}},
        supports_credentials=True,
    )

    # Register error handlers
    register_error_handlers(app)

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(inference_bp)
    app.register_blueprint(evaluation_bp)
    app.register_blueprint(history_bp)

    return app


if __name__ == "__main__":
    app = create_app()
    print("\n=======================================================")
    print("  EmotiSound Backend Server Launching on Port 5000")
    print("  Endpoints available at: http://127.0.0.1:5000/api/v1")
    print("=======================================================\n")
    app.run(host="127.0.0.1", port=5000, debug=False, threaded=True)
