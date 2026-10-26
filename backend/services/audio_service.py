"""
EmotiSound Audio and Analysis History Services
Manages audio stream validation, SQLite history persistence, and downloadable report generation.
"""

from io import BytesIO
from typing import Dict, Any, Optional
from werkzeug.datastructures import FileStorage

from backend.utils.file_validation import validate_uploaded_audio
from backend.utils.errors import ValidationError, ModelNotReadyError
from backend.services.model_service import model_service
from backend.database.repository import AnalysisRepository


class AudioService:
    """Handles audio upload processing and orchestration."""

    def __init__(self):
        self._repository = AnalysisRepository()

    @property
    def repository(self) -> AnalysisRepository:
        try:
            from flask import current_app
            if current_app and "DATABASE_PATH" in current_app.config:
                return AnalysisRepository(current_app.config["DATABASE_PATH"])
        except (RuntimeError, ImportError):
            pass
        return self._repository

    def process_and_analyze(self, file_storage: FileStorage) -> Dict[str, Any]:
        """Validates uploaded audio, checks model readiness, runs inference, and persists history."""
        # 1. File validation
        filename, ext = validate_uploaded_audio(file_storage)

        # 2. Model readiness check
        if not model_service.is_ready():
            raise ModelNotReadyError(
                "EmotiSound deep learning model is not yet trained or loaded. "
                "Please run model training first before requesting inference."
            )

        # 3. Read bytes into memory safely
        file_storage.seek(0)
        audio_bytes = file_storage.read()

        # 4. Inference
        try:
            result = model_service.predict(audio_bytes, filename=filename)
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise ValidationError(f"Audio processing failed: {str(e)}") from e

        # 5. Persist record in SQLite history
        saved_record = self.repository.save_analysis(result)
        result["id"] = saved_record["id"]
        result["created_at"] = saved_record["created_at"]

        return result


class HistoryService:
    """Manages history querying and report downloading."""

    def __init__(self):
        self._repository = AnalysisRepository()

    @property
    def repository(self) -> AnalysisRepository:
        try:
            from flask import current_app
            if current_app and "DATABASE_PATH" in current_app.config:
                return AnalysisRepository(current_app.config["DATABASE_PATH"])
        except (RuntimeError, ImportError):
            pass
        return self._repository

    def get_history(self, limit: int = 20, offset: int = 0, emotion: Optional[str] = None) -> Dict[str, Any]:
        return self.repository.get_all(limit=limit, offset=offset, emotion_filter=emotion)

    def get_record(self, record_id: str) -> Optional[Dict[str, Any]]:
        return self.repository.get_by_id(record_id)

    def delete_record(self, record_id: str) -> bool:
        return self.repository.delete_by_id(record_id)

    def get_stats(self) -> Dict[str, Any]:
        return self.repository.get_stats()


audio_service = AudioService()
history_service = HistoryService()
