"""
EmotiSound Evaluation Plots Generator
Produces high-resolution figures for Confusion Matrix and Loss/Accuracy Training Curves.
"""

from pathlib import Path
from typing import List, Dict, Any
import numpy as np
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt


def plot_confusion_matrix(
    cm: List[List[float]],
    classes: List[str],
    output_path: Path,
    normalize: bool = True,
    title: str = "EmotiSound - Test Confusion Matrix",
) -> Path:
    """Renders and saves a confusion matrix heatmap."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    cm_arr = np.array(cm)

    fig, ax = plt.subplots(figsize=(8, 7), dpi=150)
    im = ax.imshow(cm_arr, interpolation="nearest", cmap="Blues")
    cbar = ax.figure.colorbar(im, ax=ax)
    cbar.ax.set_ylabel("Normalized Proportion" if normalize else "Count", rotation=-90, va="bottom")

    ax.set(
        xticks=np.arange(cm_arr.shape[1]),
        yticks=np.arange(cm_arr.shape[0]),
        xticklabels=classes,
        yticklabels=classes,
        title=title,
        ylabel="True Emotion Category",
        xlabel="Predicted Emotion Category",
    )

    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")

    fmt = ".2f" if normalize else "d"
    thresh = cm_arr.max() / 2.0
    for i in range(cm_arr.shape[0]):
        for j in range(cm_arr.shape[1]):
            val = cm_arr[i, j]
            ax.text(
                j,
                i,
                format(val, fmt),
                ha="center",
                va="center",
                color="white" if val > thresh else "black",
                fontsize=9,
            )

    fig.tight_layout()
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return output_path


def plot_training_curves(
    history: Dict[str, List],
    output_path: Path,
) -> Path:
    """Renders and saves dual subplots for training/validation loss and accuracy."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    epochs = history.get("epoch", list(range(1, len(history["train_loss"]) + 1)))

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5), dpi=150)

    # Loss curves
    ax1.plot(epochs, history["train_loss"], label="Train Loss", color="#8B7CFF", lw=2)
    ax1.plot(epochs, history["val_loss"], label="Val Loss", color="#52D6E8", lw=2, linestyle="--")
    ax1.set_title("Cross-Entropy Loss over Epochs", fontsize=12, fontweight="bold")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Loss")
    ax1.grid(True, linestyle=":", alpha=0.6)
    ax1.legend()

    # Accuracy curves
    ax2.plot(epochs, history["train_acc"], label="Train Accuracy", color="#8B7CFF", lw=2)
    ax2.plot(epochs, history["val_acc"], label="Val Accuracy", color="#52D6E8", lw=2, linestyle="--")
    ax2.set_title("Classification Accuracy over Epochs", fontsize=12, fontweight="bold")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Accuracy")
    ax2.grid(True, linestyle=":", alpha=0.6)
    ax2.legend()

    fig.tight_layout()
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return output_path
