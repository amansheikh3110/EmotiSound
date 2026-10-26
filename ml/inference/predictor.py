"""
EmotiSound Predictor and Inference Engine
Loads model checkpoint once, preprocesses input audio deterministically,
computes emotion probabilities, and packages technical metadata.
"""

from pathlib import Path
from typing import Dict, Any, Union, Optional
from io import BytesIO
import time
import torch
import numpy as np

from ml.config import (
    CHECKPOINTS_DIR,
    MODEL_NAME,
    MODEL_VERSION,
    CANONICAL_CLASSES,
    DEVICE,
)
from ml.models.model_factory import load_checkpoint
from ml.preprocessing.audio_loader import AudioLoader, AudioValidationError
from ml.preprocessing.feature_extractor import FeatureExtractor


class EmotionPredictor:
    """Thread-safe inference predictor for speech emotion classification."""

    def __init__(
        self,
        checkpoint_path: Optional[Path] = None,
        device: torch.device = DEVICE,
    ):
        self.device = device
        self.checkpoint_path = Path(checkpoint_path) if checkpoint_path else CHECKPOINTS_DIR / "best_model.pt"
        self.model: Optional[torch.nn.Module] = None
        self.checkpoint_meta: Optional[Dict[str, Any]] = None
        self.classes = CANONICAL_CLASSES
        self.audio_loader = AudioLoader()
        self.feature_extractor = FeatureExtractor()

        self._load_model_if_available()

    def _load_model_if_available(self) -> bool:
        """Attempts to load checkpoint. Returns True if loaded successfully."""
        if self.checkpoint_path.exists():
            try:
                self.model, self.checkpoint_meta = load_checkpoint(self.checkpoint_path, device=self.device)
                self.classes = self.checkpoint_meta.get("classes", CANONICAL_CLASSES)
                return True
            except Exception as e:
                print(f"[Warning] Failed to load checkpoint {self.checkpoint_path}: {e}")
                self.model = None
                return False
        return False

    def is_ready(self) -> bool:
        """Returns True if a trained model is loaded and available for inference."""
        if self.model is None:
            self._load_model_if_available()
        return self.model is not None

    def predict(
        self,
        audio_source: Union[str, Path, BytesIO, bytes],
        filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Runs full inference on raw audio input.
        Validates signal, extracts log-Mel spectrogram, computes softmax probabilities.
        """
        if not self.is_ready():
            raise RuntimeError(
                "Model is not ready for inference. A trained checkpoint was not found. Please train the model first."
            )

        start_time = time.time()

        # 1. Condition audio and fix duration to 4.0s
        raw_y, sr, original_dur = self.audio_loader.load_raw(audio_source)
        y_fixed, audio_meta = self.audio_loader.fix_duration(raw_y, original_dur)

        # 2. Extract standardized log-Mel tensor: (1, 1, 128, 251)
        tensor, log_mel = self.feature_extractor.to_model_tensor(y_fixed)
        tensor = tensor.to(self.device)

        # 3. Model forward pass in inference mode
        with torch.inference_mode():
            logits = self.model(tensor)
            probabilities = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()

        inference_time_ms = round((time.time() - start_time) * 1000, 2)

        # 4. Map probabilities to classes
        probs_dict = {}
        for i, cls_name in enumerate(self.classes):
            probs_dict[cls_name] = round(float(probabilities[i]), 4)

        # Find top predicted class
        top_idx = int(np.argmax(probabilities))
        top_class = self.classes[top_idx]
        top_probability = round(float(probabilities[top_idx]), 4)

        # Visualization payload with synchronized chrono-temporal emotion telemetry
        viz_payload = self.feature_extractor.get_visualization_payload(
            y_fixed,
            log_mel,
            predicted_emotion=top_class,
            probabilities=probs_dict,
        )

        return {
            "predicted_emotion": top_class,
            "confidence": top_probability,
            "probabilities": probs_dict,
            "filename": filename or "audio_input",
            "audio_metadata": audio_meta,
            "visualization": viz_payload,
            "inference_duration_ms": inference_time_ms,
            "model_info": {
                "name": MODEL_NAME,
                "version": self.checkpoint_meta.get("model_version", MODEL_VERSION) if self.checkpoint_meta else MODEL_VERSION,
                "classes_count": len(self.classes),
            },
            "disclaimer": (
                "This prediction reflects the model's acoustic classification of the audio recording. "
                "It does not represent or determine a speaker's actual psychological state."
            ),
        }
