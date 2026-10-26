"""
Unit tests for CNN architecture and checkpointing.
"""

import tempfile
from pathlib import Path
import torch
from ml.config import EXPECTED_TIME_FRAMES, CANONICAL_CLASSES
from ml.models.model_factory import build_model, save_checkpoint, load_checkpoint


def test_model_forward_pass_and_logits():
    model = build_model("cnn", num_classes=8)
    model.eval()

    batch_size = 3
    dummy_input = torch.randn(batch_size, 1, 128, EXPECTED_TIME_FRAMES)
    with torch.no_grad():
        logits = model(dummy_input)

    assert logits.shape == (batch_size, 8)
    assert not torch.isnan(logits).any()
    assert not torch.isinf(logits).any()

    # Softmax probabilities validation
    probs = torch.softmax(logits, dim=1)
    sums = probs.sum(dim=1).numpy()
    for s in sums:
        assert abs(s - 1.0) < 1e-4


def test_checkpoint_save_and_reload():
    model = build_model("cnn", num_classes=8)
    with tempfile.TemporaryDirectory() as tmpdir:
        ckpt_path = Path(tmpdir) / "test_model.pt"
        save_checkpoint(
            model=model,
            checkpoint_path=ckpt_path,
            classes=CANONICAL_CLASSES,
            best_epoch=1,
            val_loss=1.5,
            val_acc=0.5,
        )
        assert ckpt_path.exists()

        loaded_model, meta = load_checkpoint(ckpt_path)
        assert meta["model_version"] == "1.0.0"
        assert meta["performance"]["best_epoch"] == 1
        assert len(meta["classes"]) == 8
