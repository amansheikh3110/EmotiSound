"""
Unit tests for speaker-independent data splitting.
"""

from pathlib import Path
import json
from ml.config import DATA_DIR, ROOT_DIR
from ml.preprocessing.split_dataset import create_speaker_independent_splits


def test_splits_speaker_independence():
    speech_dir = ROOT_DIR / "Audio_Speech_Actors_01-24"
    if not speech_dir.exists():
        speech_dir = ROOT_DIR / "Audio_Song_Actors_01-24"

    manifest = create_speaker_independent_splits(speech_dir)
    meta = manifest["metadata"]

    train_actors = set(meta["train_actors"])
    val_actors = set(meta["val_actors"])
    test_actors = set(meta["test_actors"])

    # Core assertion: pairwise disjoint actor sets
    assert train_actors.isdisjoint(val_actors), "Train and Val actors overlap!"
    assert train_actors.isdisjoint(test_actors), "Train and Test actors overlap!"
    assert val_actors.isdisjoint(test_actors), "Val and Test actors overlap!"

    # Non-empty splits
    assert len(manifest["train"]) > 0
    assert len(manifest["val"]) > 0
    assert len(manifest["test"]) > 0
