"""
EmotiSound Speaker-Independent Dataset Splitter
Splits RAVDESS audio dataset strictly by actor identity to avoid speaker leakage.
Guarantees pairwise disjoint actor sets across train, validation, and test splits.
"""

from pathlib import Path
from typing import Dict, List, Set, Any, Union
import json
import random
import glob

from ml.config import (
    DATA_DIR,
    ROOT_DIR,
    RANDOM_SEED,
    RAVDESS_CODE_TO_LABEL,
    CANONICAL_CLASSES,
)


def parse_ravdess_filename(filename: str) -> Dict[str, Any]:
    """
    Parses RAVDESS format: Modality-Channel-Emotion-Intensity-Statement-Repetition-Actor.wav
    Example: 03-01-03-01-02-01-12.wav
    """
    stem = Path(filename).stem
    parts = stem.split("-")
    if len(parts) != 7:
        raise ValueError(f"Invalid RAVDESS filename format: {filename}")

    modality, channel, emotion_code, intensity, statement, repetition, actor = parts

    return {
        "filename": Path(filename).name,
        "modality": modality,
        "channel": channel,
        "emotion_code": emotion_code,
        "emotion": RAVDESS_CODE_TO_LABEL.get(emotion_code, "unknown"),
        "intensity": "normal" if intensity == "01" else "strong",
        "statement": statement,
        "repetition": repetition,
        "actor": actor,
        "gender": "male" if int(actor) % 2 != 0 else "female",
    }


def find_dataset_files(data_dirs: Union[Path, List[Path]]) -> List[Path]:
    """Finds all .wav files in given directory or list of directories recursively."""
    if isinstance(data_dirs, (str, Path)):
        dirs = [Path(data_dirs)]
    else:
        dirs = [Path(d) for d in data_dirs]

    files: List[Path] = []
    patterns = ["*.wav", "**/*.wav"]
    for d in dirs:
        if not d.exists():
            continue
        for pat in patterns:
            for f in d.glob(pat):
                if f.is_file():
                    files.append(f)
    return sorted(list(set(files)))


def create_speaker_independent_splits(
    audio_dir: Union[Path, List[Path]],
    output_manifest_path: Path = None,
    seed: int = RANDOM_SEED,
) -> Dict[str, Any]:
    """
    Creates speaker-independent splits with stratified gender balance.
    Train: ~70% (16 actors), Val: ~15% (4 actors), Test: ~15% (4 actors).
    Asserts pairwise disjoint actor sets.
    """
    if output_manifest_path is None:
        output_manifest_path = DATA_DIR / "split_manifest.json"

    audio_files = find_dataset_files(audio_dir)
    if not audio_files:
        raise FileNotFoundError(f"No .wav audio files found in {audio_dir}")

    actor_to_files: Dict[str, List[Dict[str, Any]]] = {}
    valid_files_count = 0
    rejected_files: List[str] = []

    for fpath in audio_files:
        try:
            meta = parse_ravdess_filename(fpath.name)
            meta["filepath"] = str(fpath.resolve())
            actor = meta["actor"]
            actor_to_files.setdefault(actor, []).append(meta)
            valid_files_count += 1
        except Exception as e:
            rejected_files.append(f"{fpath.name}: {str(e)}")

    all_actors = sorted(list(actor_to_files.keys()))
    if len(all_actors) < 3:
        raise ValueError(f"Need at least 3 actors for train/val/test split. Found {len(all_actors)}.")

    # Separate male and female actors for balanced stratification
    male_actors = [a for a in all_actors if int(a) % 2 != 0]
    female_actors = [a for a in all_actors if int(a) % 2 == 0]

    rng = random.Random(seed)
    rng.shuffle(male_actors)
    rng.shuffle(female_actors)

    # Balanced split: 2 male + 2 female for test, 2 male + 2 female for val, rest for train
    test_actors = sorted(male_actors[:2] + female_actors[:2])
    val_actors = sorted(male_actors[2:4] + female_actors[2:4])
    train_actors = sorted(male_actors[4:] + female_actors[4:])

    # Critical Assertion: Pairwise disjoint actor sets
    train_set, val_set, test_set = set(train_actors), set(val_actors), set(test_actors)
    assert train_set.isdisjoint(val_set), "Speaker leakage detected between Train and Val!"
    assert train_set.isdisjoint(test_set), "Speaker leakage detected between Train and Test!"
    assert val_set.isdisjoint(test_set), "Speaker leakage detected between Val and Test!"

    # Compile samples for each split
    train_samples = [item for a in train_actors for item in actor_to_files[a]]
    val_samples = [item for a in val_actors for item in actor_to_files[a]]
    test_samples = [item for a in test_actors for item in actor_to_files[a]]

    # Ensure class representation statistics
    def get_class_counts(samples: List[Dict[str, Any]]) -> Dict[str, int]:
        counts: Dict[str, int] = {}
        for s in samples:
            c = s["emotion"]
            counts[c] = counts.get(c, 0) + 1
        return counts

    manifest = {
        "metadata": {
            "source_directory": str(audio_dir),
            "random_seed": seed,
            "total_files_discovered": len(audio_files),
            "valid_files_count": valid_files_count,
            "rejected_files_count": len(rejected_files),
            "rejected_files": rejected_files,
            "total_actors": len(all_actors),
            "train_actors": train_actors,
            "val_actors": val_actors,
            "test_actors": test_actors,
            "train_sample_count": len(train_samples),
            "val_sample_count": len(val_samples),
            "test_sample_count": len(test_samples),
            "train_class_distribution": get_class_counts(train_samples),
            "val_class_distribution": get_class_counts(val_samples),
            "test_class_distribution": get_class_counts(test_samples),
            "supported_classes": CANONICAL_CLASSES,
        },
        "train": train_samples,
        "val": val_samples,
        "test": test_samples,
    }

    output_manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    return manifest


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        target_dirs = [Path(sys.argv[1])]
    else:
        target_dirs = []
        speech_dir = ROOT_DIR / "Audio_Speech_Actors_01-24"
        song_dir = ROOT_DIR / "Audio_Song_Actors_01-24"
        if speech_dir.exists():
            target_dirs.append(speech_dir)
        if song_dir.exists():
            target_dirs.append(song_dir)

    print(f"Creating speaker-independent split for: {[str(d.name) for d in target_dirs]}")
    res = create_speaker_independent_splits(target_dirs)
    meta = res["metadata"]
    print("Split completed successfully!")
    print(f"Total files discovered: {meta['total_files_discovered']}")
    print(f"Train Actors ({len(meta['train_actors'])}): {meta['train_actors']} -> {meta['train_sample_count']} samples")
    print(f"Val Actors   ({len(meta['val_actors'])}): {meta['val_actors']} -> {meta['val_sample_count']} samples")
    print(f"Test Actors  ({len(meta['test_actors'])}): {meta['test_actors']} -> {meta['test_sample_count']} samples")
