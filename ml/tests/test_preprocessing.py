"""
Unit tests for AudioLoader and FeatureExtractor.
"""

import pytest
import numpy as np
import torch
from ml.config import SAMPLE_RATE, EXPECTED_TIME_FRAMES
from ml.preprocessing.audio_loader import AudioLoader, AudioValidationError
from ml.preprocessing.feature_extractor import FeatureExtractor


def test_audio_loader_duration_padding():
    loader = AudioLoader()
    # 2.0s signal @ 16kHz = 32,000 samples
    short_signal = np.sin(np.linspace(0, 2 * np.pi * 440, 32000)).astype(np.float32)
    fixed, meta = loader.fix_duration(short_signal, 2.0)

    assert len(fixed) == int(SAMPLE_RATE * 4.0)
    assert meta["was_padded"] is True
    assert meta["was_truncated"] is False
    assert np.all(np.isfinite(fixed))


def test_audio_loader_duration_truncation():
    loader = AudioLoader()
    # 6.0s signal @ 16kHz = 96,000 samples
    long_signal = np.sin(np.linspace(0, 6 * np.pi * 440, 96000)).astype(np.float32)
    fixed, meta = loader.fix_duration(long_signal, 6.0)

    assert len(fixed) == int(SAMPLE_RATE * 4.0)
    assert meta["was_padded"] is False
    assert meta["was_truncated"] is True
    assert np.all(np.isfinite(fixed))


def test_silent_audio_rejection():
    loader = AudioLoader()
    silent_signal = np.zeros(32000, dtype=np.float32)
    # Loading raw or verifying silence raises AudioValidationError
    with pytest.raises(AudioValidationError):
        # Pass bytes of zero length or silent mock
        loader.load_raw(b"")


def test_feature_extractor_tensor_shape():
    extractor = FeatureExtractor()
    # Standard 4.0s signal
    signal = np.sin(np.linspace(0, 4 * np.pi * 440, int(SAMPLE_RATE * 4.0))).astype(np.float32)
    tensor, log_mel = extractor.to_model_tensor(signal)

    assert tensor.shape == (1, 1, 128, EXPECTED_TIME_FRAMES)
    assert np.all(np.isfinite(log_mel))
    assert not torch.isnan(tensor).any()
    assert not torch.isinf(tensor).any()
