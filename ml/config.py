"""
EmotiSound Machine Learning Configuration
Centralizes all audio parameters, emotion class mappings, model hyper-parameters, and paths.
"""

from pathlib import Path
import torch

# Base Directories
ML_DIR = Path(__file__).resolve().parent
ROOT_DIR = ML_DIR.parent
DATA_DIR = ML_DIR / "data"
ARTIFACTS_DIR = ML_DIR / "artifacts"
CHECKPOINTS_DIR = ARTIFACTS_DIR / "checkpoints"
EVALUATION_DIR = ARTIFACTS_DIR / "evaluation"
REPORTS_DIR = ARTIFACTS_DIR / "reports"

# Ensure artifact subdirectories exist
for d in [DATA_DIR, CHECKPOINTS_DIR, EVALUATION_DIR, REPORTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Standard RAVDESS 8-Emotion Mapping
RAVDESS_CODE_TO_LABEL = {
    "01": "neutral",
    "02": "calm",
    "03": "happy",
    "04": "sad",
    "05": "angry",
    "06": "fearful",
    "07": "disgust",
    "08": "surprised",
}

# Canonical 8-class list
CANONICAL_CLASSES = [
    "neutral",
    "calm",
    "happy",
    "sad",
    "angry",
    "fearful",
    "disgust",
    "surprised",
]

# Audio Preprocessing Specification
SAMPLE_RATE = 16000
TARGET_DURATION = 4.0  # seconds
TARGET_SAMPLES = int(SAMPLE_RATE * TARGET_DURATION)  # 64,000 samples
N_FFT = 1024
HOP_LENGTH = 256
N_MELS = 128
F_MIN = 0.0
F_MAX = 8000.0
EPSILON = 1e-6
EXPECTED_TIME_FRAMES = 1 + (TARGET_SAMPLES // HOP_LENGTH)  # 251 frames

# Model Architecture Parameters
MODEL_NAME = "EmotiSoundCNN"
MODEL_VERSION = "1.0.0"
IN_CHANNELS = 1

# Training Hyperparameters
DEFAULT_BATCH_SIZE = 32
DEFAULT_LEARNING_RATE = 0.001
DEFAULT_EPOCHS = 35
EARLY_STOPPING_PATIENCE = 8
WEIGHT_DECAY = 1e-4
RANDOM_SEED = 42

# Device Selection (automatic CUDA with CPU fallback)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Upload and Inference Safeguards
MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB
MAX_AUDIO_DURATION_SECONDS = 30.0  # Allow up to 30s upload, processed with windowing/padding
MIN_AUDIO_DURATION_SECONDS = 0.2
ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}
