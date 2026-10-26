"""
EmotiSound Trainer Engine
Coordinates training loops, validation cycles, metrics tracking, and history serialization.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import time
import json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from ml.training.callbacks import EarlyStopping
from ml.models.model_factory import save_checkpoint
from ml.config import CHECKPOINTS_DIR, REPORTS_DIR, CANONICAL_CLASSES


class Trainer:
    """Standardized training engine for speech emotion recognition models."""

    def __init__(
        self,
        model: nn.Module,
        train_loader: DataLoader,
        val_loader: DataLoader,
        criterion: nn.Module,
        optimizer: torch.optim.Optimizer,
        device: torch.device,
        scheduler: Optional[Any] = None,
        early_stopping: Optional[EarlyStopping] = None,
        classes: List[str] = CANONICAL_CLASSES,
    ):
        self.model = model.to(device)
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.criterion = criterion
        self.optimizer = optimizer
        self.device = device
        self.scheduler = scheduler
        self.early_stopping = early_stopping or EarlyStopping(patience=8)
        self.classes = classes

    def train_epoch(self) -> Dict[str, float]:
        """Runs one full training epoch over train_loader."""
        self.model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for batch_idx, (inputs, targets) in enumerate(self.train_loader):
            inputs, targets = inputs.to(self.device), targets.to(self.device)

            self.optimizer.zero_grad()
            outputs = self.model(inputs)
            loss = self.criterion(outputs, targets)
            loss.backward()

            # Gradient clipping to prevent exploding gradients
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=2.0)

            self.optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            preds = outputs.argmax(dim=1)
            correct += (preds == targets).sum().item()
            total += targets.size(0)

        epoch_loss = running_loss / max(1, total)
        epoch_acc = correct / max(1, total)
        return {"loss": float(epoch_loss), "accuracy": float(epoch_acc)}

    def validate(self) -> Dict[str, float]:
        """Runs validation evaluation over val_loader without gradient computation."""
        self.model.eval()
        running_loss = 0.0
        correct = 0
        total = 0

        with torch.no_grad():
            for inputs, targets in self.val_loader:
                inputs, targets = inputs.to(self.device), targets.to(self.device)
                outputs = self.model(inputs)
                loss = self.criterion(outputs, targets)

                running_loss += loss.item() * inputs.size(0)
                preds = outputs.argmax(dim=1)
                correct += (preds == targets).sum().item()
                total += targets.size(0)

        val_loss = running_loss / max(1, total)
        val_acc = correct / max(1, total)
        return {"loss": float(val_loss), "accuracy": float(val_acc)}

    def fit(
        self,
        epochs: int = 35,
        checkpoint_path: Optional[Path] = None,
        history_path: Optional[Path] = None,
    ) -> Dict[str, Any]:
        """
        Executes complete training process with validation checks and early stopping.
        """
        if checkpoint_path is None:
            checkpoint_path = CHECKPOINTS_DIR / "best_model.pt"
        if history_path is None:
            history_path = REPORTS_DIR / "training_history.json"

        history: Dict[str, List] = {
            "epoch": [],
            "train_loss": [],
            "train_acc": [],
            "val_loss": [],
            "val_acc": [],
            "lr": [],
            "duration_sec": [],
        }

        best_val_loss = float("inf")
        best_val_acc = 0.0
        best_epoch = 0

        print(f"\n=======================================================")
        print(f"Starting EmotiSound Training: {epochs} Epochs on {self.device}")
        print(f"=======================================================\n")

        for epoch in range(1, epochs + 1):
            t0 = time.time()

            train_metrics = self.train_epoch()
            val_metrics = self.validate()

            current_lr = float(self.optimizer.param_groups[0]["lr"])
            if self.scheduler is not None:
                if isinstance(self.scheduler, torch.optim.lr_scheduler.ReduceLROnPlateau):
                    self.scheduler.step(val_metrics["loss"])
                else:
                    self.scheduler.step()

            duration = time.time() - t0

            history["epoch"].append(epoch)
            history["train_loss"].append(round(train_metrics["loss"], 4))
            history["train_acc"].append(round(train_metrics["accuracy"], 4))
            history["val_loss"].append(round(val_metrics["loss"], 4))
            history["val_acc"].append(round(val_metrics["accuracy"], 4))
            history["lr"].append(current_lr)
            history["duration_sec"].append(round(duration, 2))

            # Logging
            print(
                f"Epoch [{epoch:02d}/{epochs:02d}] "
                f"Train Loss: {train_metrics['loss']:.4f} | Acc: {train_metrics['accuracy']:.4f} "
                f"| Val Loss: {val_metrics['loss']:.4f} | Acc: {val_metrics['accuracy']:.4f} "
                f"| LR: {current_lr:.6f} ({duration:.1f}s)"
            )

            # Check if this is the best checkpoint based on validation loss
            improved = self.early_stopping(val_metrics["loss"], self.model)
            if improved:
                best_val_loss = val_metrics["loss"]
                best_val_acc = val_metrics["accuracy"]
                best_epoch = epoch
                save_checkpoint(
                    model=self.model,
                    checkpoint_path=checkpoint_path,
                    classes=self.classes,
                    best_epoch=best_epoch,
                    val_loss=best_val_loss,
                    val_acc=best_val_acc,
                    training_meta={"completed_epochs": epoch, "total_epochs": epochs},
                )
                print(f"  --> Saved new best checkpoint at epoch {epoch} (Val Loss: {best_val_loss:.4f}, Val Acc: {best_val_acc:.4f})")

            if self.early_stopping.early_stop:
                print(f"\n[Early Stopping Triggered] No improvement in validation loss for {self.early_stopping.patience} epochs.")
                break

        # Restore best weights into model
        self.early_stopping.restore_best_weights(self.model)

        summary = {
            "best_epoch": best_epoch,
            "best_val_loss": round(float(best_val_loss), 4),
            "best_val_acc": round(float(best_val_acc), 4),
            "total_epochs_trained": len(history["epoch"]),
            "checkpoint_path": str(checkpoint_path),
            "history": history,
        }

        # Save history to JSON
        history_path.parent.mkdir(parents=True, exist_ok=True)
        with open(history_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)

        print(f"\nTraining Complete! Best model saved to: {checkpoint_path}")
        print(f"Best Val Loss: {best_val_loss:.4f} (Accuracy: {best_val_acc * 100:.2f}%) at Epoch {best_epoch}\n")
        return summary
