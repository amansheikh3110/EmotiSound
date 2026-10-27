"""
EmotiSound Training Entrypoint
CLI script to prepare data splits, instantiate the CNN model, and train with full reproducibility.
"""

from typing import Optional, List, Union
import argparse
from pathlib import Path
import random
import torch
import numpy as np
from torch.utils.data import DataLoader

from ml.config import (
    ROOT_DIR,
    DATA_DIR,
    CHECKPOINTS_DIR,
    REPORTS_DIR,
    DEFAULT_BATCH_SIZE,
    DEFAULT_LEARNING_RATE,
    DEFAULT_EPOCHS,
    EARLY_STOPPING_PATIENCE,
    RANDOM_SEED,
    DEVICE,
    CANONICAL_CLASSES,
)
from ml.preprocessing.split_dataset import create_speaker_independent_splits
from ml.preprocessing.dataset import SpeechEmotionDataset
from ml.preprocessing.augmentation import AudioAugmentor
from ml.models.model_factory import build_model, load_checkpoint
from ml.training.losses import get_loss_criterion, compute_class_weights
from ml.training.callbacks import EarlyStopping
from ml.training.trainer import Trainer


def set_seed(seed: int = RANDOM_SEED):
    """Sets random seeds for reproducibility across Python, NumPy, and PyTorch."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def run_training(
    data_dir: Optional[Union[Path, List[Path]]] = None,
    epochs: int = DEFAULT_EPOCHS,
    batch_size: int = DEFAULT_BATCH_SIZE,
    lr: Optional[float] = None,
    patience: int = EARLY_STOPPING_PATIENCE,
    seed: int = RANDOM_SEED,
    device: torch.device = DEVICE,
    cache_in_memory: bool = True,
    resume_from: Optional[Path] = None,
    auto_evaluate: bool = True,
):
    set_seed(seed)

    # Resolve dataset directories (default to both Speech and Song if available)
    if data_dir is None:
        target_dirs = []
        speech_dir = ROOT_DIR / "Audio_Speech_Actors_01-24"
        song_dir = ROOT_DIR / "Audio_Song_Actors_01-24"
        if speech_dir.exists():
            target_dirs.append(speech_dir)
        if song_dir.exists():
            target_dirs.append(song_dir)
        if not target_dirs:
            raise FileNotFoundError("No RAVDESS audio dataset found.")
        data_dir = target_dirs
    elif isinstance(data_dir, (str, Path)):
        data_dir = [Path(data_dir)]

    dir_names = [d.name if isinstance(d, Path) else str(d) for d in data_dir]
    print(f"Dataset source directories: {dir_names}")
    print(f"Active Device: {device}")

    # 1. Split dataset into speaker-independent train/val/test
    manifest = create_speaker_independent_splits(data_dir, seed=seed)
    meta = manifest["metadata"]

    train_samples = manifest["train"]
    val_samples = manifest["val"]

    classes = meta.get("supported_classes", CANONICAL_CLASSES)
    class_to_idx = {c: i for i, c in enumerate(classes)}

    print(f"Discovered classes ({len(classes)}): {classes}")
    print(f"Total files: {meta['total_files_discovered']}")
    print(f"Train samples: {len(train_samples)}, Val samples: {len(val_samples)}")

    # 2. Build Datasets
    augmentor = AudioAugmentor(enabled=True)
    train_dataset = SpeechEmotionDataset(
        samples=train_samples,
        class_to_idx=class_to_idx,
        is_training=True,
        augmentor=augmentor,
        cache_in_memory=cache_in_memory,
    )

    val_dataset = SpeechEmotionDataset(
        samples=val_samples,
        class_to_idx=class_to_idx,
        is_training=False,
        cache_in_memory=cache_in_memory,
    )

    # 3. Build DataLoaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,  # Single-process for Windows compatibility
        pin_memory=(device.type == "cuda"),
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,
        pin_memory=(device.type == "cuda"),
    )

    # 4. Instantiate or Resume Model
    if resume_from and Path(resume_from).exists():
        print(f"\n[CONTINUE TRAINING] Resuming weights from checkpoint: {resume_from}")
        model, ckpt_meta = load_checkpoint(Path(resume_from), device=device)
        model.train()
        # Default fine-tuning learning rate (lower to preserve learned features)
        if lr is None:
            lr = 0.0003
        print(f"Model successfully loaded! Fine-tuning with learning rate: {lr}")
    else:
        model = build_model(
            model_type="cnn",
            num_classes=len(classes),
            in_channels=1,
            dropout_rate=0.35,
        )
        if lr is None:
            lr = DEFAULT_LEARNING_RATE
        print("Model Architecture created from scratch:", model.count_parameters())

    # 5. Class weighting for loss
    class_counts = [meta["train_class_distribution"].get(c, 1) for c in classes]
    class_weights = compute_class_weights(class_counts, device=device)
    criterion = get_loss_criterion(class_weights=class_weights, label_smoothing=0.05)

    # 6. Optimizer and Learning Rate Scheduler
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=2, min_lr=1e-6
    )

    early_stopping = EarlyStopping(patience=patience, mode="min")

    trainer = Trainer(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        criterion=criterion,
        optimizer=optimizer,
        device=device,
        scheduler=scheduler,
        early_stopping=early_stopping,
        classes=classes,
    )

    summary = trainer.fit(
        epochs=epochs,
        checkpoint_path=CHECKPOINTS_DIR / "best_model.pt",
        history_path=REPORTS_DIR / "training_history.json",
    )

    # 7. Post-training held-out test evaluation
    if auto_evaluate:
        print("\n=======================================================")
        print("Executing Post-Training Evaluation on Held-Out Test Set")
        print("=======================================================\n")
        try:
            from ml.evaluation.evaluate import run_evaluation
            eval_metrics = run_evaluation(
                checkpoint_path=CHECKPOINTS_DIR / "best_model.pt",
                manifest_path=DATA_DIR / "split_manifest.json",
                device=device,
            )
            print(f"Evaluation complete! Test Accuracy: {eval_metrics['overall_accuracy'] * 100:.2f}%")
        except Exception as eval_err:
            print(f"[Warning] Evaluation failed to complete: {eval_err}")

    return summary


def main():
    parser = argparse.ArgumentParser(description="EmotiSound Speech Emotion Recognition Model Training")
    parser.add_argument("--data-dir", type=str, default=None, help="Path to RAVDESS audio dataset directory")
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS, help="Maximum epochs to train")
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE, help="Batch size for training")
    parser.add_argument("--lr", type=float, default=None, help="Initial learning rate")
    parser.add_argument("--patience", type=int, default=EARLY_STOPPING_PATIENCE, help="Early stopping patience")
    parser.add_argument("--seed", type=int, default=RANDOM_SEED, help="Random seed")
    parser.add_argument("--resume-from", type=str, default=None, help="Path to checkpoint to continue training from")
    parser.add_argument("--no-cache", action="store_true", help="Disable in-memory caching")
    parser.add_argument("--no-eval", action="store_true", help="Disable automatic post-training evaluation")

    args = parser.parse_args()

    data_dir = Path(args.data_dir) if args.data_dir else None
    resume_path = Path(args.resume_from) if args.resume_from else None

    run_training(
        data_dir=data_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        patience=args.patience,
        seed=args.seed,
        cache_in_memory=not args.no_cache,
        resume_from=resume_path,
        auto_evaluate=not args.no_eval,
    )


if __name__ == "__main__":
    main()
