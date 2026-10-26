"""
EmotiSound Health and Readiness API Endpoints
"""

from flask import Blueprint, jsonify
from backend.services.model_service import model_service

health_bp = Blueprint("health", __name__, url_prefix="/api/v1")


@health_bp.route("/health", methods=["GET"])
def get_health():
    """Returns application health status."""
    return jsonify({
        "success": True,
        "status": "healthy",
        "service": "EmotiSound REST API",
        "version": "1.0.0",
    }), 200


@health_bp.route("/ready", methods=["GET"])
def get_ready():
    """Returns model inference readiness status."""
    is_ready = model_service.is_ready()
    return jsonify({
        "success": True,
        "is_ready": is_ready,
        "status": "ready" if is_ready else "model_unavailable",
        "message": (
            "Model is loaded and ready for audio emotion inference."
            if is_ready
            else "Trained checkpoint not found. Model must be trained before inference."
        ),
    }), 200
