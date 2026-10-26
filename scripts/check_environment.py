"""
EmotiSound Environment & Dependency Verification Script
Checks runtime environment, PyTorch installation, audio decoders, and data availability.
"""

import sys
import shutil
import platform
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


def check_env():
    print("=" * 60)
    print("  EmotiSound Environment Diagnostics")
    print("=" * 60)

    # 1. System Info
    print(f"OS Platform     : {platform.system()} {platform.release()} ({platform.machine()})")
    print(f"Python Version  : {sys.version.split()[0]} ({sys.executable})")

    # 2. Node & NPM
    node_path = shutil.which("node")
    npm_path = shutil.which("npm")
    print(f"Node.js Runtime : {'Available (' + node_path + ')' if node_path else 'NOT FOUND'}")
    print(f"NPM CLI         : {'Available (' + npm_path + ')' if npm_path else 'NOT FOUND'}")

    # 3. Core ML Packages
    packages = [
        ("torch", "PyTorch"),
        ("soundfile", "SoundFile"),
        ("librosa", "Librosa"),
        ("sklearn", "Scikit-Learn"),
        ("matplotlib", "Matplotlib"),
        ("flask", "Flask"),
        ("flask_cors", "Flask-CORS"),
        ("pydantic", "Pydantic"),
        ("pytest", "Pytest"),
    ]

    print("\nPackage Verification:")
    all_ok = True
    for mod_name, label in packages:
        try:
            m = __import__(mod_name)
            ver = getattr(m, "__version__", "installed")
            print(f"  [OK] {label:<15}: v{ver}")
        except ImportError as e:
            print(f"  [MISSING] {label:<15}: {e}")
            all_ok = False

    # 4. PyTorch Hardware Acceleration
    try:
        import torch
        cuda_avail = torch.cuda.is_available()
        print(f"\nPyTorch Device  : {'CUDA (' + torch.cuda.get_device_name(0) + ')' if cuda_avail else 'CPU (Safe default)'}")
    except Exception:
        pass

    # 5. Dataset Directories Check
    root = Path(__file__).resolve().parent.parent
    speech_dir = root / "Audio_Speech_Actors_01-24"
    song_dir = root / "Audio_Song_Actors_01-24"
    print("\nDataset Status:")
    print(f"  RAVDESS Speech  : {'FOUND (' + str(len(list(speech_dir.glob('**/*.wav')))) + ' files)' if speech_dir.exists() else 'NOT FOUND'}")
    print(f"  RAVDESS Song    : {'FOUND (' + str(len(list(song_dir.glob('**/*.wav')))) + ' files)' if song_dir.exists() else 'NOT FOUND'}")

    # 6. Checkpoint & Artifacts
    ckpt_path = root / "ml" / "artifacts" / "checkpoints" / "best_model.pt"
    eval_path = root / "ml" / "artifacts" / "reports" / "evaluation_summary.json"
    print("\nModel Artifacts:")
    print(f"  Trained Model   : {'READY (' + str(ckpt_path) + ')' if ckpt_path.exists() else 'Not yet trained'}")
    print(f"  Evaluation Meta : {'READY' if eval_path.exists() else 'Not yet evaluated'}")

    print("\n" + "=" * 60)
    if all_ok:
        print("  All primary dependencies are satisfied!")
    else:
        print("  Some dependencies are missing. Run: pip install -r requirements.txt")
    print("=" * 60)


if __name__ == "__main__":
    check_env()
