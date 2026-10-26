"""
EmotiSound PyTorch Dataset
Loads audio files, applies optional data augmentation, extracts log-Mel spectrograms, and maps emotion labels.
"""

from pathlib import Path
from typing import Dict, List, Any, Optional
import torch
from torch.utils.data import Dataset
import numpy as np

from ml.config import (
    CANONICAL_CLASSES,
)
from ml.preprocessing.audio_loader import AudioLoader
from ml.preprocessing.feature_extractor import FeatureExtractor
from ml.preprocessing.augmentation import AudioAugmentor


class SpeechEmotionDataset(Dataset):
    """
    PyTorch Dataset for Speech Emotion Recognition.
    Handles raw audio loading, deterministic duration conditioning,
    feature extraction (log-Mel), optional augmentation, and label indexing.
    """

    def __init__(
        self,
        samples: List[Dict[str, Any]],
        class_to_idx: Optional[Dict[str, int]] = None,
        is_training: bool = False,
        augmentor: Optional[AudioAugmentor] = None,
        cache_in_memory: bool = False,
    ):
        self.samples = samples
        self.is_training = is_training
        self.augmentor = augmentor if is_training else None
        self.cache_in_memory = cache_in_memory

        # Establish class mapping
        if class_to_idx is None:
            self.class_to_idx = {cls_name: i for i, cls_name in enumerate(CANONICAL_CLASSES)}
        else:
            self.class_to_idx = class_to_idx

        self.audio_loader = AudioLoader()
        self.feature_extractor = FeatureExtractor()

        # Cache pre-conditioned waveforms for rapid epoch iterations on CPU
        self._cache: Dict[int, Tuple[np.ndarray, int, Dict[str, Any]]] = {}

        if self.cache_in_memory:
            self._preload_cache()

    def _preload_cache(self) -> None:
        """Preloads waveforms into RAM for high-throughput training."""
        for idx in range(len(self.samples)):
            self._get_waveform_and_meta(idx)

    def _get_waveform_and_meta(self, idx: int):
        if idx in self._cache:
            return self._cache[idx]

        item = self.samples[idx]
        filepath = item["filepath"]
        y_raw, _, orig_dur = self.audio_loader.load_raw(filepath)
        y_fixed, meta = self.audio_loader.fix_duration(y_raw, orig_dur)
        label_idx = self.class_to_idx[item["emotion"]]

        if self.cache_in_memory:
            self._cache[idx] = (y_fixed, label_idx, meta)

        return y_fixed, label_idx, meta

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        y, label_idx, meta = self._get_waveform_and_meta(idx)

        # Apply waveform-level data augmentation during training only
        if self.is_training and self.augmentor:
            y = self.augmentor.augment_waveform(y)

        # Extract log-Mel spectrogram: shape (1, 1, 128, 251)
        tensor, log_mel = self.feature_extractor.to_model_tensor(y)
        # Squeeze batch dim so dataset returns (1, 128, 251)
        tensor = tensor.squeeze(0)

        # Apply SpecAugment if enabled during training
        if self.is_training and self.augmentor:
            tensor = self.augmentor.spec_augment(tensor)

        return tensor, torch.tensor(label_idx, dtype=torch.long)
