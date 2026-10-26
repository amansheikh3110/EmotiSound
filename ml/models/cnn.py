"""
EmotiSound Custom 2D Convolutional Neural Network
Accepts log-Mel spectrogram inputs (B, 1, 128, 251) and outputs unnormalized emotion logits.
"""

from typing import Dict, Any
import torch
import torch.nn as nn


class EmotiSoundCNN(nn.Module):
    """
    4-Stage 2D CNN with Batch Normalization, Dropout Regularization,
    Adaptive Average Pooling, and a Dense Classification Head.
    """

    def __init__(
        self,
        num_classes: int = 8,
        in_channels: int = 1,
        dropout_rate: float = 0.35,
    ):
        super().__init__()
        self.num_classes = num_classes
        self.in_channels = in_channels

        # Conv Block 1
        self.conv_block1 = nn.Sequential(
            nn.Conv2d(in_channels, 32, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),  # -> (32, 64, 125)
            nn.Dropout2d(p=0.1),
        )

        # Conv Block 2
        self.conv_block2 = nn.Sequential(
            nn.Conv2d(32, 64, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),  # -> (64, 32, 62)
            nn.Dropout2d(p=0.2),
        )

        # Conv Block 3
        self.conv_block3 = nn.Sequential(
            nn.Conv2d(64, 128, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),  # -> (128, 16, 31)
            nn.Dropout2d(p=0.25),
        )

        # Conv Block 4
        self.conv_block4 = nn.Sequential(
            nn.Conv2d(128, 256, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((2, 2)),  # -> (256, 2, 2)
        )

        # Classification Head: 256 * 2 * 2 = 1024 features
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256 * 2 * 2, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout_rate),
            nn.Linear(256, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        Args:
            x: Tensor of shape (Batch, 1, 128, 251)
        Returns:
            Logits of shape (Batch, num_classes)
        """
        x = self.conv_block1(x)
        x = self.conv_block2(x)
        x = self.conv_block3(x)
        x = self.conv_block4(x)
        logits = self.classifier(x)
        return logits

    def count_parameters(self) -> Dict[str, int]:
        """Returns total and trainable parameter counts."""
        total = sum(p.numel() for p in self.parameters())
        trainable = sum(p.numel() for p in self.parameters() if p.requires_grad)
        return {"total_parameters": total, "trainable_parameters": trainable}
