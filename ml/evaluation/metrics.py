"""
EmotiSound Evaluation Metrics Calculator
Computes comprehensive classification metrics on the held-out speaker-independent test set.
"""

from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    roc_auc_score,
)


def compute_evaluation_metrics(
    y_true: List[int],
    y_pred: List[int],
    y_probs: np.ndarray,
    classes: List[str],
) -> Dict[str, Any]:
    """
    Computes overall accuracy, macro/weighted precision/recall/F1, per-class metrics,
    normalized and raw confusion matrices, and ROC-AUC.
    """
    y_true_arr = np.array(y_true)
    y_pred_arr = np.array(y_pred)

    overall_accuracy = float(accuracy_score(y_true_arr, y_pred_arr))

    # Macro and Weighted Averages
    p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(
        y_true_arr, y_pred_arr, average="macro", zero_division=0
    )
    p_weighted, r_weighted, f1_weighted, _ = precision_recall_fscore_support(
        y_true_arr, y_pred_arr, average="weighted", zero_division=0
    )

    # Per-Class Precision, Recall, F1, Support
    p_per_class, r_per_class, f1_per_class, support_per_class = precision_recall_fscore_support(
        y_true_arr, y_pred_arr, average=None, labels=list(range(len(classes))), zero_division=0
    )

    per_class_metrics = {}
    for i, cls_name in enumerate(classes):
        per_class_metrics[cls_name] = {
            "precision": round(float(p_per_class[i]), 4),
            "recall": round(float(r_per_class[i]), 4),
            "f1_score": round(float(f1_per_class[i]), 4),
            "support": int(support_per_class[i]),
        }

    # Confusion Matrix (raw counts and row-normalized percentages)
    cm_raw = confusion_matrix(y_true_arr, y_pred_arr, labels=list(range(len(classes))))
    with np.errstate(all="ignore"):
        cm_norm = cm_raw.astype(float) / cm_raw.sum(axis=1)[:, np.newaxis]
        cm_norm = np.nan_to_num(cm_norm)

    # Multi-class One-vs-Rest ROC-AUC
    roc_auc = None
    try:
        # Check that every class is present in true labels
        if len(np.unique(y_true_arr)) == len(classes) and y_probs.shape[1] == len(classes):
            roc_auc = float(roc_auc_score(y_true_arr, y_probs, multi_class="ovr", average="macro"))
    except Exception:
        roc_auc = None

    return {
        "overall_accuracy": round(overall_accuracy, 4),
        "macro_precision": round(float(p_macro), 4),
        "macro_recall": round(float(r_macro), 4),
        "macro_f1": round(float(f1_macro), 4),
        "weighted_f1": round(float(f1_weighted), 4),
        "roc_auc_macro": round(roc_auc, 4) if roc_auc is not None else None,
        "total_test_samples": int(len(y_true)),
        "classes": classes,
        "per_class": per_class_metrics,
        "confusion_matrix": cm_raw.tolist(),
        "confusion_matrix_normalized": [[round(float(v), 4) for v in row] for row in cm_norm],
    }
