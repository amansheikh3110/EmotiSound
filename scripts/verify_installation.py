"""
EmotiSound Installation Verification
Runs end-to-end unit checks verifying that audio decoding, feature extraction,
CNN inference, and directory structures are working properly.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import numpy as np
import torch
from ml.preprocessing.audio_loader import AudioLoader
from ml.preprocessing.feature_extractor import FeatureExtractor
from ml.models.model_factory import build_model
from ml.config import SAMPLE_RATE, EXPECTED_TIME_FRAMES


def verify():
    print("=======================================================")
    print("  EmotiSound Installation & Integrity Verification")
    print("=======================================================")

    # 1. Synthetic waveform generation
    print("\n[1/4] Verifying Audio Pipeline...")
    duration = 3.5  # 3.5 seconds
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    synthetic_wave = 0.5 * np.sin(2 * np.pi * 440 * t)  # 440 Hz tone
    loader = AudioLoader()
    fixed_wave, meta = loader.fix_duration(synthetic_wave, duration)
    assert len(fixed_wave) == int(SAMPLE_RATE * 4.0), "Waveform duration padding failed!"
    assert meta["was_padded"] is True, "Padding metadata flag incorrect!"
    print("  --> Audio Loader and padding passed!")

    # 2. Feature Extractor
    print("\n[2/4] Verifying Feature Extraction...")
    extractor = FeatureExtractor()
    tensor, log_mel = extractor.to_model_tensor(fixed_wave)
    assert tensor.shape == (1, 1, 128, EXPECTED_TIME_FRAMES), f"Tensor shape mismatch: {tensor.shape}"
    assert np.all(np.isfinite(log_mel)), "Spectrogram contains non-finite values!"
    print(f"  --> Log-Mel spectrogram extracted: shape {tensor.shape}, finite values verified!")

    # 3. Model Forward Pass
    print("\n[3/4] Verifying CNN Architecture...")
    model = build_model("cnn", num_classes=8)
    model.eval()
    with torch.no_grad():
        out = model(tensor)
    assert out.shape == (1, 8), f"Output logits shape mismatch: {out.shape}"
    probs = torch.softmax(out, dim=1).numpy()
    assert np.isclose(np.sum(probs), 1.0, atol=1e-4), "Softmax probabilities do not sum to 1.0!"
    print(f"  --> Forward pass passed! Output shape: {out.shape}, Softmax sum: {np.sum(probs):.4f}")

    # 4. Directory Structure
    print("\n[4/4] Verifying Directory Layout...")
    for sub in ["ml", "backend", "scripts"]:
        assert (ROOT_DIR / sub).exists(), f"Directory missing: {sub}"
    print("  --> Directory layout verified!")

    print("\n=======================================================")
    print("  All verification checks PASSED successfully!")
    print("=======================================================\n")


if __name__ == "__main__":
    verify()
