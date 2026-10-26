"""
EmotiSound Model Factory and Checkpoint Management
Centralized factory for building models, validating shapes, and safely saving/loading checkpoints.
"""

from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import torch
import torch.nn as nn

from ml.config import (
    MODEL_NAME,
    MODEL_VERSION,
    CANONICAL_CLASSES,
    SAMPLE_RATE,
    TARGET_DURATION,
    N_FFT,
    HOP_LENGTH,
    N_MELS,
    EXPECTED_TIME_FRAMES,
    CHECKPOINTS_DIR,
)
from ml.models.cnn import EmotiSoundCNN


def build_model(
    model_type: str = "cnn",
    num_classes: int = len(CANONICAL_CLASSES),
    in_channels: int = 1,
    dropout_rate: float = 0.35,
) -> nn.Module:
    """Builds and returns an initialized neural network model."""
    if model_type.lower() == "cnn":
        return EmotiSoundCNN(
            num_classes=num_classes,
            in_channels=in_channels,
            dropout_rate=dropout_rate,
        )
    raise ValueError(f"Unknown model architecture type: '{model_type}'")


def save_checkpoint(
    model: nn.Module,
    checkpoint_path: Path,
    classes: list = CANONICAL_CLASSES,
    best_epoch: int = 0,
    val_loss: float = 0.0,
    val_acc: float = 0.0,
    training_meta: Optional[Dict[str, Any]] = None,
) -> Path:
    """
    Saves state dictionary and complete metadata manifest.
    Adheres strictly to Section 9 of the project specification.
    """
    checkpoint_path = Path(checkpoint_path)
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)

    meta = {
        "model_architecture": MODEL_NAME,
        "model_version": MODEL_VERSION,
        "state_dict": model.state_dict(),
        "classes": classes,
        "class_to_idx": {c: i for i, c in enumerate(classes)},
        "audio_config": {
            "sample_rate": SAMPLE_RATE,
            "target_duration": TARGET_DURATION,
            "n_fft": N_FFT,
            "hop_length": HOP_LENGTH,
            "n_mels": N_MELS,
            "expected_time_frames": EXPECTED_TIME_FRAMES,
        },
        "performance": {
            "best_epoch": best_epoch,
            "best_val_loss": round(float(val_loss), 4),
            "best_val_accuracy": round(float(val_acc), 4),
        },
        "training_meta": training_meta or {},
        "pytorch_version": torch.__version__,
    }

    torch.save(meta, checkpoint_path)
    return checkpoint_path


def load_checkpoint(
    checkpoint_path: Path,
    device: torch.device = torch.device("cpu"),
) -> Tuple[nn.Module, Dict[str, Any]]:
    """
    Safely loads a model checkpoint from disk using state_dict.
    Sets model to eval() mode.
    """
    path = Path(checkpoint_path)
    if not path.exists():
        raise FileNotFoundError(f"Checkpoint does not exist: {path}")

    # Load with map_location
    try:
        checkpoint = torch.load(path, map_location=device, weights_only=False)
    except Exception as exc:
        raise RuntimeError(f"Failed to load checkpoint file '{path.name}': {str(exc)}") from exc

    classes = checkpoint.get("classes", CANONICAL_CLASSES)
    model = build_model(model_type="cnn", num_classes=len(classes))
    model.load_state_dict(checkpoint["state_dict"])
    model.to(device)
    model.eval()

    return model, checkpoint
