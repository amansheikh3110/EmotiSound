"""
EmotiSound Dataset Preparation and Inspection Utility
Inspects RAVDESS datasets, validates files, generates statistics, and creates speaker-independent splits.
"""

import argparse
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import json
import soundfile as sf
import numpy as np

from ml.config import (
    DATA_DIR,
    RAVDESS_CODE_TO_LABEL,
    CANONICAL_CLASSES,
)
from ml.preprocessing.split_dataset import (
    find_dataset_files,
    parse_ravdess_filename,
    create_speaker_independent_splits,
)


def inspect_dataset(audio_dir: Path):
    """
    Performs full scientific inspection of audio files in target directory.
    Reports file counts, duration statistics, sample rates, class balance, and actor counts.
    """
    print(f"\n=======================================================")
    print(f"  Inspecting Dataset: {audio_dir}")
    print(f"=======================================================\n")

    files = find_dataset_files(audio_dir)
    total_discovered = len(files)
    print(f"Total audio files discovered: {total_discovered}")

    if total_discovered == 0:
        print("[Error] No .wav files discovered in directory.")
        return

    valid_files = 0
    rejected_files = []
    durations = []
    sample_rates = {}
    emotions_count = {}
    actors_set = set()

    for idx, f in enumerate(files):
        try:
            meta = parse_ravdess_filename(f.name)
            info = sf.info(str(f))

            dur = info.duration
            durations.append(dur)
            sr = info.samplerate
            sample_rates[sr] = sample_rates.get(sr, 0) + 1

            emo = meta["emotion"]
            emotions_count[emo] = emotions_count.get(emo, 0) + 1
            actors_set.add(meta["actor"])
            valid_files += 1

        except Exception as e:
            rejected_files.append((f.name, str(e)))

    print(f"Valid audio files: {valid_files}")
    print(f"Rejected files   : {len(rejected_files)}")
    if rejected_files:
        print("  Sample rejection reasons:")
        for name, reason in rejected_files[:5]:
            print(f"    - {name}: {reason}")

    # Actor stats
    print(f"\nUnique Actors Found: {len(actors_set)}")
    print(f"Actor IDs: {sorted(list(actors_set))}")
    print(f"Actor Independent Splitting Feasible: {'YES (>=3 actors required)' if len(actors_set) >= 3 else 'NO'}")

    # Duration Stats
    if durations:
        d_arr = np.array(durations)
        print(f"\nDuration Statistics (seconds):")
        print(f"  Mean   : {d_arr.mean():.2f}s")
        print(f"  Median : {np.median(d_arr):.2f}s")
        print(f"  Min    : {d_arr.min():.2f}s")
        print(f"  Max    : {d_arr.max():.2f}s")
        print(f"  Std    : {d_arr.std():.2f}s")

    # Sample Rates
    print(f"\nSample Rate Distribution: {sample_rates}")

    # Emotion class representation
    print(f"\nClass Representation Breakdown:")
    for cls_name in CANONICAL_CLASSES:
        cnt = emotions_count.get(cls_name, 0)
        status = "PRESENT" if cnt > 0 else "ABSENT"
        print(f"  - {cls_name:<10}: {cnt:>4} files [{status}]")

    all_canonical_present = all(emotions_count.get(c, 0) > 0 for c in CANONICAL_CLASSES)
    print(f"\nFull 8-Class Canonical Coverage: {'YES' if all_canonical_present else 'PARTIAL'}")
    print(f"=======================================================\n")


def main():
    parser = argparse.ArgumentParser(description="Prepare and inspect speech emotion dataset")
    parser.add_argument("--dir", type=str, default=None, help="Directory containing RAVDESS wav files")
    parser.add_argument("--inspect", action="store_true", help="Inspect and generate statistics")
    parser.add_argument("--split", action="store_true", help="Generate speaker-independent split manifest")

    args = parser.parse_args()

    # Determine default data dir
    if args.dir:
        target_dir = Path(args.dir)
    elif (ROOT_DIR / "Audio_Speech_Actors_01-24").exists():
        target_dir = ROOT_DIR / "Audio_Speech_Actors_01-24"
    elif (ROOT_DIR / "Audio_Song_Actors_01-24").exists():
        target_dir = ROOT_DIR / "Audio_Song_Actors_01-24"
    else:
        print("[Error] No dataset found. Provide dataset path with --dir <path>.")
        return

    if args.inspect or (not args.split):
        inspect_dataset(target_dir)

    if args.split:
        print(f"Generating speaker-independent split manifest for {target_dir}...")
        create_speaker_independent_splits(target_dir)
        print(f"Manifest written to {DATA_DIR / 'split_manifest.json'}")


if __name__ == "__main__":
    main()
