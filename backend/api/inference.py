"""
EmotiSound Inference, Presets, and Model Information API Endpoints
"""

from pathlib import Path
from flask import Blueprint, request, jsonify, send_from_directory
from backend.config import PROJECT_ROOT
from backend.services.audio_service import audio_service
from backend.services.model_service import model_service
from backend.utils.errors import ValidationError, ResourceNotFoundError

inference_bp = Blueprint("inference", __name__, url_prefix="/api/v1")

SPEECH_DATASET_DIR = PROJECT_ROOT / "Audio_Speech_Actors_01-24"

CURATED_PRESETS = [
    {"emotion": "neutral", "code": "01", "filename": "03-01-01-01-01-01-01.wav", "actor": "Actor_01"},
    {"emotion": "calm", "code": "02", "filename": "03-01-02-01-01-01-01.wav", "actor": "Actor_01"},
    {"emotion": "happy", "code": "03", "filename": "03-01-03-01-01-01-01.wav", "actor": "Actor_01"},
    {"emotion": "sad", "code": "04", "filename": "03-01-04-01-01-01-01.wav", "actor": "Actor_01"},
    {"emotion": "angry", "code": "05", "filename": "03-01-05-01-01-01-01.wav", "actor": "Actor_01"},
    {"emotion": "fearful", "code": "06", "filename": "03-01-06-01-01-01-01.wav", "actor": "Actor_01"},
    {"emotion": "disgust", "code": "07", "filename": "03-01-07-01-01-01-01.wav", "actor": "Actor_01"},
    {"emotion": "surprised", "code": "08", "filename": "03-01-08-01-01-01-01.wav", "actor": "Actor_01"},
]


@inference_bp.route("/analyze", methods=["POST"])
def analyze_audio():
    """
    Accepts multipart form audio file upload under 'file' or 'audio'.
    Validates audio, runs genuine deep learning inference, and returns probabilities.
    """
    if "file" not in request.files and "audio" not in request.files:
        raise ValidationError("Request must contain an audio file under field 'file' or 'audio'.")

    file_obj = request.files.get("file") or request.files.get("audio")
    result = audio_service.process_and_analyze(file_obj)

    return jsonify({
        "success": True,
        "data": result,
    }), 200


@inference_bp.route("/samples", methods=["GET"])
def get_sample_presets():
    """Returns list of curated canonical RAVDESS audio sample presets."""
    samples = []
    for p in CURATED_PRESETS:
        rel_path = f"{p['actor']}/{p['filename']}"
        full_path = SPEECH_DATASET_DIR / p["actor"] / p["filename"]
        samples.append({
            "emotion": p["emotion"],
            "code": p["code"],
            "actor": p["actor"],
            "filename": p["filename"],
            "url": f"/api/v1/samples/{rel_path}",
            "available": full_path.exists(),
        })

    return jsonify({
        "success": True,
        "data": samples,
    }), 200


@inference_bp.route("/samples/<path:filepath>", methods=["GET"])
def serve_sample_audio(filepath: str):
    """Serves sample audio files for immediate playback and testing."""
    full_path = SPEECH_DATASET_DIR / filepath
    if not full_path.exists() or not full_path.is_file():
        raise ResourceNotFoundError(f"Audio sample '{filepath}' not found.")

    return send_from_directory(
        full_path.parent,
        full_path.name,
        mimetype="audio/wav"
    )


@inference_bp.route("/model", methods=["GET"])
def get_model_info():
    """Returns technical metadata, supported emotion labels, and model parameters."""
    info = model_service.get_model_info()
    return jsonify({
        "success": True,
        "data": info,
    }), 200
