"""
EmotiSound Development Launcher
Launches Flask REST backend (port 5000) and React Vite frontend (port 5173) concurrently.
"""

import subprocess
import sys
import os
import signal
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"


def main():
    print("=======================================================")
    print("  EmotiSound Full-Stack Development Server Launcher")
    print("  Backend API:  http://127.0.0.1:5000")
    print("  Frontend UI:  http://127.0.0.1:5173")
    print("=======================================================\n")

    # Start Flask Backend
    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = str(ROOT_DIR)

    print("[1/2] Starting Flask Backend on http://127.0.0.1:5000...")
    backend_proc = subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=str(BACKEND_DIR),
        env=backend_env,
    )

    # Start Vite Frontend
    print("[2/2] Starting Vite Frontend on http://127.0.0.1:5173...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(FRONTEND_DIR),
    )

    def handle_exit(signum, frame):
        print("\nStopping development servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        handle_exit(None, None)


if __name__ == "__main__":
    main()
