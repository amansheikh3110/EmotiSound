"""
EmotiSound Loss Functions
Provides cross-entropy loss with optional class weighting and label smoothing.
"""

from typing import Optional, List
import torch
import torch.nn as nn


def get_loss_criterion(
    class_weights: Optional[torch.Tensor] = None,
    label_smoothing: float = 0.05,
) -> nn.Module:
    """
    Returns CrossEntropyLoss configured with optional inverse class frequency weights
    and label smoothing to improve generalization on acoustic spectrogram features.
    """
    return nn.CrossEntropyLoss(
        weight=class_weights,
        label_smoothing=label_smoothing,
    )


def compute_class_weights(class_counts: List[int], device: torch.device) -> torch.Tensor:
    """
    Computes inverse frequency class weights: total_samples / (num_classes * count_i).
    """
    counts = torch.tensor(class_counts, dtype=torch.float32)
    total = counts.sum()
    weights = total / (len(class_counts) * counts)
    weights = weights / weights.mean()  # Normalize to mean 1.0
    return weights.to(device)
