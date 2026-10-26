"""
EmotiSound Evaluation Reports Module
Exports structured evaluation summaries to JSON, CSV, and Markdown.
"""

from pathlib import Path
from typing import Dict, Any
import json
import csv


def export_reports(
    metrics: Dict[str, Any],
    reports_dir: Path,
) -> Dict[str, Path]:
    """Exports evaluation summary into JSON, CSV, and Markdown files."""
    reports_dir = Path(reports_dir)
    reports_dir.mkdir(parents=True, exist_ok=True)

    json_path = reports_dir / "evaluation_summary.json"
    csv_path = reports_dir / "classification_report.csv"
    md_path = reports_dir / "evaluation_report.md"

    # 1. JSON Export
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    # 2. CSV Export
    classes = metrics["classes"]
    per_class = metrics["per_class"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Class", "Precision", "Recall", "F1-Score", "Support"])
        for c in classes:
            m = per_class[c]
            writer.writerow([c, m["precision"], m["recall"], m["f1_score"], m["support"]])
        writer.writerow([])
        writer.writerow(["Macro Avg", metrics["macro_precision"], metrics["macro_recall"], metrics["macro_f1"], metrics["total_test_samples"]])
        writer.writerow(["Weighted Avg", "-", "-", metrics["weighted_f1"], metrics["total_test_samples"]])
        writer.writerow(["Overall Accuracy", "-", "-", metrics["overall_accuracy"], metrics["total_test_samples"]])

    # 3. Markdown Export
    md_lines = [
        "# EmotiSound Model Evaluation Report",
        "",
        "## Speaker-Independent Test Set Performance",
        "",
        f"- **Overall Accuracy**: `{metrics['overall_accuracy'] * 100:.2f}%`",
        f"- **Macro Precision**: `{metrics['macro_precision']:.4f}`",
        f"- **Macro Recall**: `{metrics['macro_recall']:.4f}`",
        f"- **Macro F1-Score**: `{metrics['macro_f1']:.4f}`",
        f"- **Weighted F1-Score**: `{metrics['weighted_f1']:.4f}`",
        f"- **Macro ROC-AUC**: `{metrics.get('roc_auc_macro', 'N/A')}`",
        f"- **Total Test Samples**: `{metrics['total_test_samples']}` (Held-out Actors)",
        "",
        "## Per-Class Classification Report",
        "",
        "| Emotion Category | Precision | Recall | F1-Score | Support |",
        "| :--- | :---: | :---: | :---: | :---: |",
    ]

    for c in classes:
        m = per_class[c]
        md_lines.append(
            f"| **{c.capitalize()}** | {m['precision']:.4f} | {m['recall']:.4f} | {m['f1_score']:.4f} | {m['support']} |"
        )

    md_lines.extend([
        "",
        "## Limitations & Academic Transparency",
        "",
        "1. **Acoustic Vocal Pattern Only**: These predictions reflect learned classification of vocal acoustics, not guaranteed psychological ground truth.",
        "2. **Dataset Demographics**: The evaluation is conducted on the RAVDESS actor corpus under controlled studio conditions.",
        "3. **Speaker Independence**: The test set contains strictly unseen speakers (disjoint actor IDs), verifying acoustic generalization across individuals.",
        "",
    ])

    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    return {
        "json": json_path,
        "csv": csv_path,
        "markdown": md_path,
    }
