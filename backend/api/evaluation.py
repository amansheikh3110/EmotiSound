"""
EmotiSound Model Evaluation API Endpoints
Serves genuine scientific evaluation metrics and artifacts from held-out test evaluations.
"""

from pathlib import Path
import json
from flask import Blueprint, jsonify, send_file
from ml.config import REPORTS_DIR, EVALUATION_DIR
from backend.utils.errors import ResourceNotFoundError

evaluation_bp = Blueprint("evaluation", __name__, url_prefix="/api/v1")


@evaluation_bp.route("/evaluation", methods=["GET"])
def get_evaluation_report():
    """Returns genuine evaluation summary metrics from the saved evaluation report."""
    report_file = REPORTS_DIR / "evaluation_summary.json"
    history_file = REPORTS_DIR / "training_history.json"

    if not report_file.exists():
        return jsonify({
            "success": True,
            "is_evaluated": False,
            "message": "Model evaluation has not yet been executed. Train and evaluate the model to view test metrics.",
            "data": None,
        }), 200

    with open(report_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Attach training history if available
    training_history = None
    if history_file.exists():
        try:
            with open(history_file, "r", encoding="utf-8") as hf:
                h_data = json.load(hf)
                training_history = h_data.get("history")
        except Exception:
            pass

    return jsonify({
        "success": True,
        "is_evaluated": True,
        "data": {
            "metrics": data,
            "training_history": training_history,
        }
    }), 200


@evaluation_bp.route("/evaluation/plots/<plot_name>", methods=["GET"])
def get_evaluation_plot(plot_name: str):
    """Serves high-resolution plot images (confusion_matrix.png, training_curves.png)."""
    valid_plots = {"confusion_matrix.png", "training_curves.png"}
    if plot_name not in valid_plots:
        raise ResourceNotFoundError(f"Plot '{plot_name}' not found.")

    plot_path = EVALUATION_DIR / plot_name
    if not plot_path.exists():
        raise ResourceNotFoundError(f"Evaluation plot '{plot_name}' has not been generated yet.")

    return send_file(plot_path, mimetype="image/png")
