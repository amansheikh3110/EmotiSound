# EmotiSound — Speech Emotion Recognition & Audio Intelligence Platform

> **A professional-grade, reproducible Deep Learning project using PyTorch 2D Convolutional Neural Networks on log-Mel spectrograms with strict speaker-independent evaluation, a Flask REST API, and a modern dark React dashboard.**

---

## 1. Project Overview & Vision

**EmotiSound** is an end-to-end speech emotion recognition (SER) platform designed to analyze human vocal recordings and classify vocal patterns into eight standard emotion categories. Rather than treating speech classification as an opaque black box or superficial web mockup, EmotiSound implements a scientifically defensible deep learning architecture backed by:

- **Mathematical Audio Signal Processing**: Deterministic duration conditioning, 16,000 Hz resampling, and 128-bin log-Mel spectrogram extraction.
- **Custom PyTorch 2D CNN**: 4-stage convolutional neural network with 2D Batch Normalization, Spatial & Dense Dropout, and Adaptive Average Pooling (653,288 parameters).
- **Leakage-Free Speaker-Independent Evaluation**: Zero speaker overlap across Train (16 actors), Validation (4 actors), and Test (4 actors) partitions on the RAVDESS corpus.
- **Real-Time Interactive Web Dashboard**: Dark editorial UI engineered with React 18, TypeScript, Tailwind CSS, HTML5 Canvas waveform rendering, and Recharts probability distributions.
- **Auditable History & Reports**: SQLite database persistence and exportable scientific evaluation summaries in JSON, CSV, and Markdown.

---

## 2. Supported Emotion Categories

EmotiSound classifies vocal acoustic features across the **eight canonical RAVDESS categories**:

|  Code  |       Emotion       | Description                    | Acoustic Characteristics                                                 |
| :----: | :-----------------: | :----------------------------- | :----------------------------------------------------------------------- |
| `01` |  **Neutral**  | Neutral vocal expression       | Balanced fundamental frequency (F0), moderate tempo, low jitter          |
| `02` |   **Calm**   | Relaxed, soothing cadence      | Reduced intensity, prolonged vowel durations, soft harmonic decay        |
| `03` |   **Happy**   | Elevated, joyful pitch         | High pitch excursions, increased spectral energy in high frequencies     |
| `04` |    **Sad**    | Somber, subdued tone           | Depressed F0 contour, reduced energy, extended inter-word pauses         |
| `05` |   **Angry**   | Intense, forceful articulation | High acoustic power, sharp spectral flux, rapid attack times             |
| `06` |  **Fearful**  | Tremulous, anxious voicing     | Elevated pitch variance, shimmer, irregular amplitude modulations        |
| `07` |  **Disgust**  | Averse, guttural resonance     | Low F0, concentrated low-frequency formant energy, harsh timbral texture |
| `08` | **Surprised** | Sudden, startled exclamation   | Abrupt upward pitch glides, wide dynamic range, brief duration           |

---

## 3. System Architecture

```
                                    EMOTISOUND ARCHITECTURE
                                
  +-----------------------------------------------------------------------------------------+
  |                                   Layer C: React Frontend                               |
  |  [ Audio Uploader ]  -->  [ Canvas Waveform ]  -->  [ Recharts Probability Bar Chart ]   |
  |  [ Spectrogram Heatmap ]     [ SQLite History View ]     [ Model Insights & Evaluation ]|
  +--------------------------------------------+--------------------------------------------+
                                               | HTTP / REST API (Port 5000)
                                               v
  +-----------------------------------------------------------------------------------------+
  |                                    Layer B: Flask REST API                              |
  |  - /api/v1/health       - /api/v1/ready       - /api/v1/analyze     - /api/v1/model     |
  |  - /api/v1/evaluation   - /api/v1/history     - /api/v1/history/:id - SQLite DB        |
  +--------------------------------------------+--------------------------------------------+
                                               |
                                               v
  +-----------------------------------------------------------------------------------------+
  |                               Layer A: Deep Learning Engine                             |
  |                                                                                         |
  |   Raw Audio (WAV / MP3 / FLAC)                                                          |
  |         |                                                                               |
  |         v                                                                               |
  |   File & Signal Validation  --> Reject non-finite samples or pure silence (< 1e-4 RMS)  |
  |         |                                                                               |
  |         v                                                                               |
  |   Audio Conditioning        --> 16,000 Hz Mono, Deterministic 4.0s (64,000 samples)     |
  |         |                                                                               |
  |         v                                                                               |
  |   Feature Extractor         --> 128-bin log-Mel Spectrogram (N_FFT=1024, Hop=256)       |
  |         |                       Shape: (1, 1, 128, 251) Tensor                          |
  |         v                                                                               |
  |   PyTorch 2D CNN            --> 4 Conv Blocks (32->64->128->256) + BatchNorm + Dropout  |
  |         |                       AdaptiveAvgPool2d((2, 2)) + Dense Classification Head   |
  |         v                                                                               |
  |   Softmax Logits            --> 8 Emotion Probabilities (Sum = 1.0)                     |
  +-----------------------------------------------------------------------------------------+
```

---

## 4. Technology Stack

### Machine Learning & Acoustics

- **PyTorch 2.10.0**: Neural network architecture, backpropagation, and state-dict checkpoints.
- **Librosa 1.0.0**: Mel filterbank generation, log-power decibel conversion, audio resampling.
- **SoundFile 0.14.0**: Multi-format audio stream decoding and encoding.
- **Scikit-Learn 1.8.0**: Stratified disjoint splitting, classification reports, and confusion matrices.
- **Matplotlib 3.10.6**: Production visualization of confusion matrices and loss/accuracy curves.

### Backend & Persistence

- **Flask 3.1.3**: REST API with blueprint routing and global JSON exception formatting.
- **Flask-CORS 6.0.5**: Origin security configuration for local development.
- **SQLite 3**: Local, lightweight storage for analysis sessions and probability vectors.
- **Pytest 9.0.2**: Automated unit and integration testing suite.

### Frontend

- **React 18.3**: Component composition, hooks, and reactive UI states.
- **Vite 5.4**: Fast ES-module development and production bundling.
- **TypeScript 5.6**: Type-safe contracts across API payloads and acoustic models.
- **Tailwind CSS 3.4**: Tailored dark SaaS design system with midnight and charcoal hues.
- **Recharts 2.15**: Interactive probability distribution horizontal bar charts.
- **Lucide React 0.475**: Cohesive iconography.

---

## 5. Dataset & Speaker-Independent Partitioning

The model is trained on the **Ryerson Audio-Visual Database of Emotional Speech and Song (RAVDESS)**:

- **Speech Subset**: 1,440 audio files from 24 professional actors (12 male, 12 female).
- **Song Subset**: 1,012 audio files from 23 professional actors (12 male, 11 female).

### Preventing Speaker Leakage

In Speech Emotion Recognition, randomly shuffling utterances across train and test sets leads to **speaker memorization** rather than true acoustic emotion recognition. EmotiSound strictly partitions by actor ID:

- **Training Actors (16 actors, 960 samples, ~67%)**: `01, 02, 03, 04, 07, 08, 09, 10, 13, 14, 18, 19, 21, 22, 23, 24`
- **Validation Actors (4 actors, 240 samples, ~17%)**: `05, 06, 17, 20`
- **Test Actors (4 actors, 240 samples, ~17%)**: `11, 12, 15, 16`

$$
\text{Train} \cap \text{Val} = \emptyset, \quad \text{Train} \cap \text{Test} = \emptyset, \quad \text{Val} \cap \text{Test} = \emptyset
$$

Gender is balanced 50% male and 50% female across all three subsets.

---

## ⚡ Quick Setup on a New Laptop / Machine

Follow these step-by-step instructions to set up and run EmotiSound on any new computer:

### Prerequisites

- **Python**: Version 3.10+ (tested up to 3.13)
- **Node.js**: Version 18+ and npm (tested on Node v20/v22)
- **Git**: Installed and configured

> [!NOTE]
> **No Re-training Required**: The pre-trained PyTorch model (`ml/artifacts/checkpoints/best_model.pt`), evaluation metrics, and audio sample presets (`Audio_Speech_Actors_01-24/Actor_01/`) are already bundled in the repo. Inference, presets, and visualization work right out of the box!

---

### Step 1: Clone the Repository

```powershell
git clone https://github.com/amansheikh3110/EmotiSound.git
cd EmotiSound
```

### Step 2: Set Up Python Backend Environment

Open a terminal in the project root:

**On Windows (PowerShell):**

```powershell
# Create virtual environment
python -m venv .venv

# If script execution is restricted on Windows, run once:
# Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

# Activate virtual environment
.\.venv\Scripts\activate

# Install all backend and deep learning dependencies
pip install -r requirements.txt
```

**On macOS / Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Step 3: Install Frontend Dependencies

```powershell
cd frontend
npm install
cd ..
```

---

### Step 4: Run the Application

Open **two terminal windows**:

**Terminal 1 — Backend Flask REST API:**

```powershell
# Ensure .venv is activated
python backend/app.py
```

*API server will start on `http://127.0.0.1:5000`.*

**Terminal 2 — React Engineering Console:**

```powershell
cd frontend
npm run dev
```

*Vite dev server will start on `http://127.0.0.1:5173`.*

Open your browser to:
👉 **`http://localhost:5173`**

Click any canonical emotion preset (`[01: NEU]` through `[08: SUR]`) or upload your own `.wav` file to run real-time inference, log-Mel spectrogram rendering, and chrono-acoustic trajectory analysis.

---

## 6. Development Tools & Diagnostics

### Verify Environment & Hardware Acceleration

```powershell
python scripts/check_environment.py
```

### Verify Audio Pipeline Integrity

```powershell
python scripts/verify_installation.py
```

---

## 7. Model Training & Evaluation

### Inspect the Dataset

```powershell
python scripts/download_or_prepare_data.py --inspect
```

### Train the CNN Model

```powershell
python scripts/train_model.py --epochs 25 --batch-size 32 --lr 0.001
```

*Trained checkpoint is automatically saved to `ml/artifacts/checkpoints/best_model.pt`.*

### Evaluate on the Held-Out Test Set

```powershell
python scripts/evaluate_model.py
```

*Generates `confusion_matrix.png`, `training_curves.png`, and `evaluation_summary.json`.*

### Run Automated PyTest Suite

```powershell
python -m pytest ml/tests backend/tests -v
```

---

## 8. Running the Application

### Option A: Simultaneous Development Launcher

```powershell
python scripts/run_development.py
```

### Option B: Individual Service Launch

**Terminal 1 — Flask REST API:**

```powershell
python backend/app.py
# Server running at http://127.0.0.1:5000
```

**Terminal 2 — React Frontend:**

```powershell
cd frontend
npm run dev
# Web application available at http://127.0.0.1:5173
```

---

## 9. REST API Documentation (`/api/v1`)

| Method     | Endpoint                           | Description                                                                                |
| :--------- | :--------------------------------- | :----------------------------------------------------------------------------------------- |
| `GET`    | `/api/v1/health`                 | Application status, service name, and version                                              |
| `GET`    | `/api/v1/ready`                  | Model readiness state for inference                                                        |
| `POST`   | `/api/v1/analyze`                | Accepts multipart audio upload (`file` or `audio`), returns prediction & probabilities |
| `GET`    | `/api/v1/model`                  | Model parameters, input spectrogram dimensions, and architecture metadata                  |
| `GET`    | `/api/v1/evaluation`             | Held-out test set accuracy, F1-scores, and confusion matrix data                           |
| `GET`    | `/api/v1/evaluation/plots/:name` | Serves `confusion_matrix.png` or `training_curves.png`                                 |
| `GET`    | `/api/v1/history`                | Paginated SQLite history (`?limit=20&offset=0&emotion=happy`)                            |
| `GET`    | `/api/v1/history/:id`            | Detailed record for a single analysis                                                      |
| `DELETE` | `/api/v1/history/:id`            | Deletes an analysis record from SQLite                                                     |
| `GET`    | `/api/v1/history/stats`          | Aggregated count and emotion distribution                                                  |

---

## 10. Held-Out Evaluation Results

Evaluated on unseen speakers (`Actor_11`, `Actor_12`, `Actor_15`, `Actor_16`):

- **Overall Accuracy**: **42.92%** *(Random baseline on 8 classes is 12.5%)*
- **Macro Precision**: **0.4909**
- **Macro Recall**: **0.4531**
- **Macro F1-Score**: **0.4160**
- **Weighted F1-Score**: **0.4268**
- **Macro ROC-AUC**: **0.8316**

*Confusion matrix and training loss/accuracy curves are stored in `ml/artifacts/evaluation/`.*

---

## 11. Academic Limitations & Ethical Disclaimer

1. **Acoustic Vocal Feature Model**: The predictions represent learned mathematical classifications of acoustic speech properties (pitch, harmonics, cadence). They **do not** prove or determine an individual's true psychological emotional state.
2. **Dataset Demographics**: The RAVDESS corpus consists of North American professional actors reciting standard statements. Real-world spontaneous speech contains overlapping dialogue, ambient noise, and dialect variations that may alter inference distributions.
3. **Privacy**: Original audio files are processed in memory and are **not** permanently retained in the database by default.
