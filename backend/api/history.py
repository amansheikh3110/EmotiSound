"""
EmotiSound Analysis History API Endpoints
Provides pagination, retrieval, and deletion of stored SQLite audio analyses.
"""

from flask import Blueprint, request, jsonify
from backend.services.audio_service import history_service
from backend.utils.errors import ResourceNotFoundError

history_bp = Blueprint("history", __name__, url_prefix="/api/v1")


@history_bp.route("/history", methods=["GET"])
def get_history():
    """Returns paginated history of past analyses with optional emotion filtering."""
    limit = request.args.get("limit", default=20, type=int)
    offset = request.args.get("offset", default=0, type=int)
    emotion = request.args.get("emotion", default=None, type=str)

    limit = max(1, min(limit, 100))  # Bound between 1 and 100
    offset = max(0, offset)

    history = history_service.get_history(limit=limit, offset=offset, emotion=emotion)
    return jsonify({
        "success": True,
        "data": history,
    }), 200


@history_bp.route("/history/<analysis_id>", methods=["GET"])
def get_analysis_record(analysis_id: str):
    """Retrieves full prediction details for a single saved analysis."""
    record = history_service.get_record(analysis_id)
    if not record:
        raise ResourceNotFoundError(f"Analysis record with ID '{analysis_id}' was not found.")

    return jsonify({
        "success": True,
        "data": record,
    }), 200


@history_bp.route("/history/<analysis_id>", methods=["DELETE"])
def delete_analysis_record(analysis_id: str):
    """Deletes an analysis record from SQLite."""
    deleted = history_service.delete_record(analysis_id)
    if not deleted:
        raise ResourceNotFoundError(f"Analysis record with ID '{analysis_id}' was not found.")

    return jsonify({
        "success": True,
        "message": f"Record '{analysis_id}' deleted successfully.",
    }), 200


@history_bp.route("/history/stats", methods=["GET"])
def get_history_stats():
    """Returns aggregated stats over all past analyses."""
    stats = history_service.get_stats()
    return jsonify({
        "success": True,
        "data": stats,
    }), 200
