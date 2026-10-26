"""
EmotiSound Training Entrypoint
CLI script to prepare data splits, instantiate the CNN model, and train with full reproducibility.
"""

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
from ml.models.model_factory import build_model
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
    data_dir: Path,
    epochs: int = DEFAULT_EPOCHS,
    batch_size: int = DEFAULT_BATCH_SIZE,
    lr: float = DEFAULT_LEARNING_RATE,
    patience: int = EARLY_STOPPING_PATIENCE,
    seed: int = RANDOM_SEED,
    device: torch.device = DEVICE,
    cache_in_memory: bool = True,
):
    set_seed(seed)

    print(f"Dataset source directory: {data_dir}")
    print(f"Active Device: {device}")

    # 1. Split dataset into speaker-independent train/val/test
    manifest = create_speaker_independent_splits(data_dir, seed=seed)
    meta = manifest["metadata"]

    train_samples = manifest["train"]
    val_samples = manifest["val"]

    classes = meta.get("supported_classes", CANONICAL_CLASSES)
    class_to_idx = {c: i for i, c in enumerate(classes)}

    print(f"Discovered classes: {classes}")
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

    # 4. Instantiate Model
    model = build_model(
        model_type="cnn",
        num_classes=len(classes),
        in_channels=1,
        dropout_rate=0.35,
    )
    print("Model Architecture created:", model.count_parameters())

    # 5. Class weighting for loss
    class_counts = [meta["train_class_distribution"].get(c, 1) for c in classes]
    class_weights = compute_class_weights(class_counts, device=device)
    criterion = get_loss_criterion(class_weights=class_weights, label_smoothing=0.05)

    # 6. Optimizer and Learning Rate Scheduler
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=3, min_lr=1e-6
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

    return summary


def main():
    parser = argparse.ArgumentParser(description="EmotiSound Speech Emotion Recognition Model Training")
    parser.add_argument("--data-dir", type=str, default=None, help="Path to RAVDESS audio dataset directory")
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS, help="Maximum epochs to train")
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE, help="Batch size for training")
    parser.add_argument("--lr", type=float, default=DEFAULT_LEARNING_RATE, help="Initial learning rate")
    parser.add_argument("--patience", type=int, default=EARLY_STOPPING_PATIENCE, help="Early stopping patience")
    parser.add_argument("--seed", type=int, default=RANDOM_SEED, help="Random seed")
    parser.add_argument("--no-cache", action="store_true", help="Disable in-memory caching")

    args = parser.parse_args()

    # Determine default data dir
    if args.data_dir:
        data_dir = Path(args.data_dir)
    elif (ROOT_DIR / "Audio_Speech_Actors_01-24").exists():
        data_dir = ROOT_DIR / "Audio_Speech_Actors_01-24"
    elif (ROOT_DIR / "Audio_Song_Actors_01-24").exists():
        data_dir = ROOT_DIR / "Audio_Song_Actors_01-24"
    else:
        raise FileNotFoundError("No RAVDESS audio dataset found. Run dataset preparation first.")

    run_training(
        data_dir=data_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        patience=args.patience,
        seed=args.seed,
        cache_in_memory=not args.no_cache,
    )


if __name__ == "__main__":
    main()
