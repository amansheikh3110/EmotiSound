"""
EmotiSound Training Callbacks
Provides early stopping, model checkpointing, and structured logging during training.
"""

from pathlib import Path
from typing import Dict, Any, Optional
import copy
import torch
import torch.nn as nn


class EarlyStopping:
    """Monitors a validation metric (e.g. val_loss) and triggers early stopping when progress halts."""

    def __init__(self, patience: int = 8, min_delta: float = 1e-4, mode: str = "min"):
        self.patience = patience
        self.min_delta = min_delta
        self.mode = mode
        self.counter = 0
        self.best_score: Optional[float] = None
        self.early_stop = False
        self.best_weights: Optional[Dict[str, Any]] = None

    def __call__(self, val_metric: float, model: nn.Module) -> bool:
        score = -val_metric if self.mode == "min" else val_metric

        if self.best_score is None:
            self.best_score = score
            self.best_weights = copy.deepcopy(model.state_dict())
            return True  # Improved
        elif score < self.best_score + self.min_delta:
            self.counter += 1
            if self.counter >= self.patience:
                self.early_stop = True
            return False  # No improvement
        else:
            self.best_score = score
            self.best_weights = copy.deepcopy(model.state_dict())
            self.counter = 0
            return True  # Improved

    def restore_best_weights(self, model: nn.Module) -> None:
        """Restores model parameters from the best recorded checkpoint."""
        if self.best_weights is not None:
            model.load_state_dict(self.best_weights)
