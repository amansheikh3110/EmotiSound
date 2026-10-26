"""
EmotiSound Evaluation Runner
Evaluates a trained model checkpoint on the held-out speaker-independent test set.
Generates confusion matrices, metrics reports, and training curves.
"""

from pathlib import Path
from typing import Dict, Any, Optional
import json
import torch
import numpy as np
from torch.utils.data import DataLoader

from ml.config import (
    ROOT_DIR,
    DATA_DIR,
    CHECKPOINTS_DIR,
    EVALUATION_DIR,
    REPORTS_DIR,
    DEVICE,
    CANONICAL_CLASSES,
)
from ml.models.model_factory import load_checkpoint
from ml.preprocessing.dataset import SpeechEmotionDataset
from ml.evaluation.metrics import compute_evaluation_metrics
from ml.evaluation.plots import plot_confusion_matrix, plot_training_curves
from ml.evaluation.reports import export_reports


def run_evaluation(
    checkpoint_path: Optional[Path] = None,
    manifest_path: Optional[Path] = None,
    device: torch.device = DEVICE,
) -> Dict[str, Any]:
    """Runs full evaluation on the test partition of the split manifest."""
    if checkpoint_path is None:
        checkpoint_path = CHECKPOINTS_DIR / "best_model.pt"
    if manifest_path is None:
        manifest_path = DATA_DIR / "split_manifest.json"

    if not checkpoint_path.exists():
        raise FileNotFoundError(f"Model checkpoint not found: {checkpoint_path}. Train the model first.")

    if not manifest_path.exists():
        raise FileNotFoundError(f"Dataset split manifest not found: {manifest_path}. Prepare the data first.")

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    test_samples = manifest.get("test", [])
    if not test_samples:
        raise ValueError("No test samples found in split manifest.")

    # Load model
    model, checkpoint_meta = load_checkpoint(checkpoint_path, device=device)
    classes = checkpoint_meta.get("classes", CANONICAL_CLASSES)
    class_to_idx = {c: i for i, c in enumerate(classes)}

    print(f"Loaded model checkpoint from: {checkpoint_path}")
    print(f"Evaluating on {len(test_samples)} held-out test samples (Actors: {manifest['metadata'].get('test_actors')})")

    # Build Test Dataset and Loader
    test_dataset = SpeechEmotionDataset(
        samples=test_samples,
        class_to_idx=class_to_idx,
        is_training=False,
        cache_in_memory=True,
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=32,
        shuffle=False,
        num_workers=0,
    )

    all_targets = []
    all_preds = []
    all_probs = []

    model.eval()
    with torch.no_grad():
        for inputs, targets in test_loader:
            inputs = inputs.to(device)
            logits = model(inputs)
            probs = torch.softmax(logits, dim=1).cpu().numpy()
            preds = np.argmax(probs, axis=1)

            all_targets.extend(targets.numpy().tolist())
            all_preds.extend(preds.tolist())
            all_probs.append(probs)

    all_probs_arr = np.vstack(all_probs)

    # Compute Metrics
    metrics = compute_evaluation_metrics(
        y_true=all_targets,
        y_pred=all_preds,
        y_probs=all_probs_arr,
        classes=classes,
    )

    # Attach Metadata
    metrics["model_version"] = checkpoint_meta.get("model_version", "1.0.0")
    metrics["best_epoch"] = checkpoint_meta.get("performance", {}).get("best_epoch", 0)
    metrics["test_actors"] = manifest["metadata"].get("test_actors", [])

    # Export Reports
    export_reports(metrics, REPORTS_DIR)

    # Plot Confusion Matrix
    cm_plot_path = EVALUATION_DIR / "confusion_matrix.png"
    plot_confusion_matrix(
        cm=metrics["confusion_matrix_normalized"],
        classes=classes,
        output_path=cm_plot_path,
        normalize=True,
    )

    # Plot Training Curves if history exists
    history_path = REPORTS_DIR / "training_history.json"
    if history_path.exists():
        with open(history_path, "r", encoding="utf-8") as f:
            h_data = json.load(f)
            plot_training_curves(h_data["history"], EVALUATION_DIR / "training_curves.png")

    print(f"\n=======================================================")
    print(f"EmotiSound Evaluation Summary on Held-out Test Set")
    print(f"=======================================================")
    print(f"Overall Accuracy: {metrics['overall_accuracy'] * 100:.2f}%")
    print(f"Macro Precision : {metrics['macro_precision']:.4f}")
    print(f"Macro Recall    : {metrics['macro_recall']:.4f}")
    print(f"Macro F1-Score  : {metrics['macro_f1']:.4f}")
    print(f"Weighted F1     : {metrics['weighted_f1']:.4f}")
    if metrics.get("roc_auc_macro"):
        print(f"Macro ROC-AUC   : {metrics['roc_auc_macro']:.4f}")
    print(f"Evaluation artifacts saved to: {REPORTS_DIR} and {EVALUATION_DIR}")
    print(f"=======================================================\n")

    return metrics


if __name__ == "__main__":
    run_evaluation()
