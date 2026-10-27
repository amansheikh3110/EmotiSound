"""
EmotiSound Model Service
Manages singleton predictor instance, model readiness checks, and architecture metadata.
"""

from typing import Dict, Any, Optional
from ml.config import (
    CHECKPOINTS_DIR,
    MODEL_NAME,
    MODEL_VERSION,
    CANONICAL_CLASSES,
    SAMPLE_RATE,
    TARGET_DURATION,
    N_MELS,
    N_FFT,
    HOP_LENGTH,
)
from ml.inference.predictor import EmotionPredictor


class ModelService:
    """Singleton service managing deep learning inference engine and model status."""

    _instance: Optional["ModelService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_service()
        return cls._instance

    def _init_service(self):
        self.predictor = EmotionPredictor()
        self._last_ckpt_mtime = None
        self._check_reload()

    def _check_reload(self):
        """Automatically reloads weights if checkpoint file on disk has been updated."""
        ckpt_path = self.predictor.checkpoint_path
        if ckpt_path.exists():
            try:
                mtime = ckpt_path.stat().st_mtime
                if self._last_ckpt_mtime is None or mtime > self._last_ckpt_mtime:
                    self._last_ckpt_mtime = mtime
                    self.predictor._load_model_if_available()
            except Exception as e:
                print(f"[Warning] Failed to check checkpoint reload: {e}")

    def reload_model(self):
        """Forces reload of model checkpoint from disk."""
        self._last_ckpt_mtime = None
        return self.predictor._load_model_if_available()

    def is_ready(self) -> bool:
        """Checks if a trained model is ready for inference."""
        self._check_reload()
        return self.predictor.is_ready()

    def get_model_info(self) -> Dict[str, Any]:
        """Returns comprehensive model metadata adhering to Section 13 specification."""
        self._check_reload()
        ready = self.is_ready()
        ckpt_meta = self.predictor.checkpoint_meta or {}

        return {
            "is_ready": ready,
            "model_name": MODEL_NAME,
            "model_version": ckpt_meta.get("model_version", MODEL_VERSION),
            "num_classes": len(self.predictor.classes),
            "supported_classes": self.predictor.classes,
            "audio_config": {
                "sample_rate": SAMPLE_RATE,
                "target_duration_seconds": TARGET_DURATION,
                "n_mels": N_MELS,
                "n_fft": N_FFT,
                "hop_length": HOP_LENGTH,
            },
            "training_performance": ckpt_meta.get("performance", {
                "status": "Not trained" if not ready else "Trained",
            }),
            "pytorch_version": ckpt_meta.get("pytorch_version", "unknown"),
        }

    def predict(self, audio_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Runs inference via predictor."""
        self._check_reload()
        return self.predictor.predict(audio_bytes, filename=filename)


# Singleton accessor
model_service = ModelService()
