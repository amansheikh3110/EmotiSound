"""
EmotiSound Audio Loader and Signal Validator
Safely loads, validates, resamples, and conditions audio signals.
"""

from io import BytesIO
from pathlib import Path
from typing import Dict, Tuple, Union
import numpy as np
import soundfile as sf
import librosa

from ml.config import (
    SAMPLE_RATE,
    TARGET_DURATION,
    TARGET_SAMPLES,
    MIN_AUDIO_DURATION_SECONDS,
    MAX_AUDIO_DURATION_SECONDS,
    ALLOWED_AUDIO_EXTENSIONS,
)


class AudioValidationError(Exception):
    """Raised when an audio input fails validation criteria."""
    pass


class AudioLoader:
    """Robust audio loader supporting path and byte buffer inputs with safety constraints."""

    def __init__(
        self,
        sample_rate: int = SAMPLE_RATE,
        target_duration: float = TARGET_DURATION,
        silence_threshold_rms: float = 1e-4,
    ):
        self.sample_rate = sample_rate
        self.target_duration = target_duration
        self.target_samples = int(sample_rate * target_duration)
        self.silence_threshold_rms = silence_threshold_rms

    def load_raw(
        self, audio_source: Union[str, Path, BytesIO, bytes]
    ) -> Tuple[np.ndarray, int, float]:
        """
        Loads raw audio into a 1D float32 numpy array resampled to self.sample_rate.
        Validates finiteness, duration, and signal energy.
        """
        try:
            if isinstance(audio_source, bytes):
                audio_file = BytesIO(audio_source)
            elif isinstance(audio_source, (str, Path)):
                path = Path(audio_source)
                if not path.exists():
                    raise AudioValidationError(f"Audio file does not exist: {path.name}")
                if path.suffix.lower() not in ALLOWED_AUDIO_EXTENSIONS:
                    raise AudioValidationError(
                        f"Unsupported audio format '{path.suffix}'. Allowed: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}"
                    )
                audio_file = str(path)
            elif isinstance(audio_source, BytesIO):
                audio_file = audio_source
                audio_file.seek(0)
            else:
                raise AudioValidationError("Invalid audio input type.")

            # Load with librosa (uses soundfile / soxr under the hood)
            y, sr = librosa.load(audio_file, sr=self.sample_rate, mono=True)

        except AudioValidationError:
            raise
        except Exception as exc:
            raise AudioValidationError(f"Could not decode audio stream: {str(exc)}") from exc

        # Basic numerical validity
        if y is None or len(y) == 0:
            raise AudioValidationError("Audio stream contains zero samples.")

        if not np.all(np.isfinite(y)):
            raise AudioValidationError("Audio stream contains non-finite numerical values (NaN or Inf).")

        raw_duration = float(len(y) / self.sample_rate)

        if raw_duration < MIN_AUDIO_DURATION_SECONDS:
            raise AudioValidationError(
                f"Audio duration ({raw_duration:.2f}s) is too short. Minimum duration is {MIN_AUDIO_DURATION_SECONDS}s."
            )

        if raw_duration > MAX_AUDIO_DURATION_SECONDS:
            raise AudioValidationError(
                f"Audio duration ({raw_duration:.2f}s) exceeds maximum allowed limit of {MAX_AUDIO_DURATION_SECONDS}s."
            )

        # Silence / near-silence rejection
        rms = float(np.sqrt(np.mean(np.square(y))))
        if rms < self.silence_threshold_rms:
            raise AudioValidationError(
                "Audio signal is empty or below audible threshold (pure silence detected)."
            )

        return y.astype(np.float32), sr, raw_duration

    def fix_duration(
        self, y: np.ndarray, original_duration: float
    ) -> Tuple[np.ndarray, Dict[str, Union[float, bool, int]]]:
        """
        Pads or truncates waveform deterministically to target duration (4.0s = 64,000 samples).
        - If shorter: Pads with zeros at end (deterministic).
        - If longer: Center crops to the most salient 4.0s segment, or takes first 4s deterministically.
        """
        curr_len = len(y)
        was_padded = False
        was_truncated = False

        if curr_len < self.target_samples:
            pad_len = self.target_samples - curr_len
            y_fixed = np.pad(y, (0, pad_len), mode="constant", constant_values=0.0)
            was_padded = True
        elif curr_len > self.target_samples:
            # Deterministic center crop for centered speech content
            start = (curr_len - self.target_samples) // 2
            y_fixed = y[start : start + self.target_samples]
            was_truncated = True
        else:
            y_fixed = y.copy()

        # Normalization: Mild peak scaling without removing dynamics
        max_val = np.max(np.abs(y_fixed))
        if max_val > 0:
            y_fixed = y_fixed / max(max_val, 1.0)  # Prevents clipping while retaining amplitude if already <= 1

        metadata = {
            "original_duration": round(original_duration, 3),
            "processed_duration": round(float(len(y_fixed) / self.sample_rate), 3),
            "sample_rate": self.sample_rate,
            "was_padded": was_padded,
            "was_truncated": was_truncated,
            "samples_count": len(y_fixed),
        }

        return y_fixed.astype(np.float32), metadata

    def process(
        self, audio_source: Union[str, Path, BytesIO, bytes]
    ) -> Tuple[np.ndarray, Dict[str, Union[float, bool, int]]]:
        """Convenience method that performs raw loading and fixed-duration conditioning."""
        raw_y, _, original_dur = self.load_raw(audio_source)
        return self.fix_duration(raw_y, original_dur)
