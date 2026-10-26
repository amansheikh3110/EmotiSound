"""
EmotiSound Controlled Audio Augmentation Module
Provides waveform and spectrogram level augmentations for training robustness.
Validation and testing datasets never receive augmentation.
"""

from typing import Optional
import random
import numpy as np
import torch


class AudioAugmentor:
    """Waveform and SpecAugment transformations with conservative bounds to preserve emotion labels."""

    def __init__(
        self,
        noise_level: float = 0.004,
        max_shift_fraction: float = 0.1,
        min_gain: float = 0.85,
        max_gain: float = 1.15,
        freq_mask_max: int = 12,
        time_mask_max: int = 20,
        enabled: bool = True,
    ):
        self.noise_level = noise_level
        self.max_shift_fraction = max_shift_fraction
        self.min_gain = min_gain
        self.max_gain = max_gain
        self.freq_mask_max = freq_mask_max
        self.time_mask_max = time_mask_max
        self.enabled = enabled

    def add_noise(self, y: np.ndarray) -> np.ndarray:
        """Adds subtle Gaussian white noise."""
        noise = np.random.normal(0, self.noise_level, size=y.shape)
        return (y + noise).astype(np.float32)

    def time_shift(self, y: np.ndarray) -> np.ndarray:
        """Rolls the signal horizontally by a small fraction of duration."""
        shift_amount = int(random.uniform(-self.max_shift_fraction, self.max_shift_fraction) * len(y))
        return np.roll(y, shift_amount).astype(np.float32)

    def change_gain(self, y: np.ndarray) -> np.ndarray:
        """Applies gentle gain factor."""
        gain = random.uniform(self.min_gain, self.max_gain)
        return (y * gain).astype(np.float32)

    def augment_waveform(self, y: np.ndarray) -> np.ndarray:
        """Applies probabilistic waveform-level augmentations."""
        if not self.enabled:
            return y

        augmented = y.copy()
        if random.random() < 0.5:
            augmented = self.change_gain(augmented)
        if random.random() < 0.4:
            augmented = self.time_shift(augmented)
        if random.random() < 0.4:
            augmented = self.add_noise(augmented)

        return augmented

    def spec_augment(self, spec: torch.Tensor) -> torch.Tensor:
        """
        Applies frequency and time masking (SpecAugment) to a spectrogram tensor: (B, C, F, T) or (C, F, T).
        spec tensor shape: (..., n_mels, time_frames)
        """
        if not self.enabled:
            return spec

        augmented = spec.clone()
        num_mels = augmented.shape[-2]
        num_time = augmented.shape[-1]

        # Frequency mask
        if random.random() < 0.5:
            f_len = random.randint(1, self.freq_mask_max)
            f_start = random.randint(0, max(0, num_mels - f_len))
            augmented[..., f_start : f_start + f_len, :] = 0.0

        # Time mask
        if random.random() < 0.5:
            t_len = random.randint(1, self.time_mask_max)
            t_start = random.randint(0, max(0, num_time - t_len))
            augmented[..., :, t_start : t_start + t_len] = 0.0

        return augmented
