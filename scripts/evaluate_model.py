"""
EmotiSound Evaluate Model Script
Command-line convenience wrapper for evaluating the trained checkpoint on the held-out test partition.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from ml.evaluation.evaluate import run_evaluation

if __name__ == "__main__":
    run_evaluation()
