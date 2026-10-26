"""
EmotiSound API Error Classes and Standard Handlers
Provides consistent JSON error response formatting across all endpoints.
"""

from typing import Dict, Any, Optional
from flask import jsonify, Response


class APIError(Exception):
    """Base class for all EmotiSound API exceptions."""
    status_code: int = 500
    error_type: str = "internal_error"

    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        rv = {
            "success": False,
            "error": {
                "type": self.error_type,
                "message": self.message,
            }
        }
        if self.details:
            rv["error"]["details"] = self.details
        return rv


class ValidationError(APIError):
    status_code = 400
    error_type = "validation_error"


class UnsupportedAudioError(APIError):
    status_code = 415
    error_type = "unsupported_media_type"


class PayloadTooLargeError(APIError):
    status_code = 413
    error_type = "payload_too_large"


class ModelNotReadyError(APIError):
    status_code = 503
    error_type = "model_not_ready"


class ResourceNotFoundError(APIError):
    status_code = 404
    error_type = "not_found"


def register_error_handlers(app):
    """Registers global JSON error handlers on the Flask app."""

    @app.errorhandler(APIError)
    def handle_api_error(error: APIError) -> Response:
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(400)
    def handle_bad_request(error) -> Response:
        return jsonify({
            "success": False,
            "error": {"type": "bad_request", "message": str(error)}
        }), 400

    @app.errorhandler(404)
    def handle_not_found(error) -> Response:
        return jsonify({
            "success": False,
            "error": {"type": "not_found", "message": "The requested endpoint or resource was not found."}
        }), 404

    @app.errorhandler(413)
    def handle_large_file(error) -> Response:
        return jsonify({
            "success": False,
            "error": {"type": "payload_too_large", "message": "Uploaded file exceeds the maximum 20MB limit."}
        }), 413

    @app.errorhandler(500)
    def handle_internal_server_error(error) -> Response:
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": {"type": "internal_server_error", "message": f"Server processing error: {str(error)}"}
        }), 500
