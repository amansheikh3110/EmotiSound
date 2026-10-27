# EmotiSound Test Audio Dataset

Curated, high-fidelity test audio files sampled from the **held-out test actors** (`Actor_11`, `Actor_15` for Male, `Actor_12`, `Actor_16` for Female). None of these actors or voice files were ever presented to the model during training.

Each emotion contains **2 male recordings** and **2 female recordings** (total: 4 files per emotion).

---

## Folder Organization

```
testing/
├── speech/
│   ├── male/      # 16 WAV files (8 emotions × 2 actors: Actor_11, Actor_15)
│   └── female/    # 16 WAV files (8 emotions × 2 actors: Actor_12, Actor_16)
├── song/
│   ├── male/      # 12 WAV files (6 emotions × 2 actors: Actor_11, Actor_15)
│   └── female/    # 12 WAV files (6 emotions × 2 actors: Actor_12, Actor_16)
└── README.md
```

---

## 1. Speech Test Files (`testing/speech/`)

### Male Recordings (`testing/speech/male/`)

| # | Filename | Ground-Truth Emotion | Actor | Gender | Intensity |
| :-: | :--- | :---: | :---: | :---: | :---: |
| 1 | `speech_male_01_neutral_actor11.wav` | **Neutral** | Actor 11 | Male | Normal |
| 2 | `speech_male_01_neutral_actor15.wav` | **Neutral** | Actor 15 | Male | Normal |
| 3 | `speech_male_02_calm_actor11.wav` | **Calm** | Actor 11 | Male | Strong |
| 4 | `speech_male_02_calm_actor15.wav` | **Calm** | Actor 15 | Male | Strong |
| 5 | `speech_male_03_happy_actor11.wav` | **Happy** | Actor 11 | Male | Strong |
| 6 | `speech_male_03_happy_actor15.wav` | **Happy** | Actor 15 | Male | Strong |
| 7 | `speech_male_04_sad_actor11.wav` | **Sad** | Actor 11 | Male | Strong |
| 8 | `speech_male_04_sad_actor15.wav` | **Sad** | Actor 15 | Male | Strong |
| 9 | `speech_male_05_angry_actor11.wav` | **Angry** | Actor 11 | Male | Strong |
| 10 | `speech_male_05_angry_actor15.wav` | **Angry** | Actor 15 | Male | Strong |
| 11 | `speech_male_06_fearful_actor11.wav` | **Fearful** | Actor 11 | Male | Strong |
| 12 | `speech_male_06_fearful_actor15.wav` | **Fearful** | Actor 15 | Male | Strong |
| 13 | `speech_male_07_disgust_actor11.wav` | **Disgust** | Actor 11 | Male | Strong |
| 14 | `speech_male_07_disgust_actor15.wav` | **Disgust** | Actor 15 | Male | Strong |
| 15 | `speech_male_08_surprised_actor11.wav` | **Surprised** | Actor 11 | Male | Strong |
| 16 | `speech_male_08_surprised_actor15.wav` | **Surprised** | Actor 15 | Male | Strong |

### Female Recordings (`testing/speech/female/`)

| # | Filename | Ground-Truth Emotion | Actor | Gender | Intensity |
| :-: | :--- | :---: | :---: | :---: | :---: |
| 1 | `speech_female_01_neutral_actor12.wav` | **Neutral** | Actor 12 | Female | Normal |
| 2 | `speech_female_01_neutral_actor16.wav` | **Neutral** | Actor 16 | Female | Normal |
| 3 | `speech_female_02_calm_actor12.wav` | **Calm** | Actor 12 | Female | Strong |
| 4 | `speech_female_02_calm_actor16.wav` | **Calm** | Actor 16 | Female | Strong |
| 5 | `speech_female_03_happy_actor12.wav` | **Happy** | Actor 12 | Female | Strong |
| 6 | `speech_female_03_happy_actor16.wav` | **Happy** | Actor 16 | Female | Strong |
| 7 | `speech_female_04_sad_actor12.wav` | **Sad** | Actor 12 | Female | Strong |
| 8 | `speech_female_04_sad_actor16.wav` | **Sad** | Actor 16 | Female | Strong |
| 9 | `speech_female_05_angry_actor12.wav` | **Angry** | Actor 12 | Female | Strong |
| 10 | `speech_female_05_angry_actor16.wav` | **Angry** | Actor 16 | Female | Strong |
| 11 | `speech_female_06_fearful_actor12.wav` | **Fearful** | Actor 12 | Female | Strong |
| 12 | `speech_female_06_fearful_actor16.wav` | **Fearful** | Actor 16 | Female | Strong |
| 13 | `speech_female_07_disgust_actor12.wav` | **Disgust** | Actor 12 | Female | Strong |
| 14 | `speech_female_07_disgust_actor16.wav` | **Disgust** | Actor 16 | Female | Strong |
| 15 | `speech_female_08_surprised_actor12.wav` | **Surprised** | Actor 12 | Female | Strong |
| 16 | `speech_female_08_surprised_actor16.wav` | **Surprised** | Actor 16 | Female | Strong |

---

## 2. Song Test Files (`testing/song/`)

*(Note: In the RAVDESS corpus, song recordings encompass 6 emotions: Neutral, Calm, Happy, Sad, Angry, and Fearful).*

### Male Song Recordings (`testing/song/male/`)

| # | Filename | Ground-Truth Emotion | Actor | Gender | Intensity |
| :-: | :--- | :---: | :---: | :---: | :---: |
| 1 | `song_male_01_neutral_actor11.wav` | **Neutral** | Actor 11 | Male | Normal |
| 2 | `song_male_01_neutral_actor15.wav` | **Neutral** | Actor 15 | Male | Normal |
| 3 | `song_male_02_calm_actor11.wav` | **Calm** | Actor 11 | Male | Strong |
| 4 | `song_male_02_calm_actor15.wav` | **Calm** | Actor 15 | Male | Strong |
| 5 | `song_male_03_happy_actor11.wav` | **Happy** | Actor 11 | Male | Strong |
| 6 | `song_male_03_happy_actor15.wav` | **Happy** | Actor 15 | Male | Strong |
| 7 | `song_male_04_sad_actor11.wav` | **Sad** | Actor 11 | Male | Strong |
| 8 | `song_male_04_sad_actor15.wav` | **Sad** | Actor 15 | Male | Strong |
| 9 | `song_male_05_angry_actor11.wav` | **Angry** | Actor 11 | Male | Strong |
| 10 | `song_male_05_angry_actor15.wav` | **Angry** | Actor 15 | Male | Strong |
| 11 | `song_male_06_fearful_actor11.wav` | **Fearful** | Actor 11 | Male | Strong |
| 12 | `song_male_06_fearful_actor15.wav` | **Fearful** | Actor 15 | Male | Strong |

### Female Song Recordings (`testing/song/female/`)

| # | Filename | Ground-Truth Emotion | Actor | Gender | Intensity |
| :-: | :--- | :---: | :---: | :---: | :---: |
| 1 | `song_female_01_neutral_actor12.wav` | **Neutral** | Actor 12 | Female | Normal |
| 2 | `song_female_01_neutral_actor16.wav` | **Neutral** | Actor 16 | Female | Normal |
| 3 | `song_female_02_calm_actor12.wav` | **Calm** | Actor 12 | Female | Strong |
| 4 | `song_female_02_calm_actor16.wav` | **Calm** | Actor 16 | Female | Strong |
| 5 | `song_female_03_happy_actor12.wav` | **Happy** | Actor 12 | Female | Strong |
| 6 | `song_female_03_happy_actor16.wav` | **Happy** | Actor 16 | Female | Strong |
| 7 | `song_female_04_sad_actor12.wav` | **Sad** | Actor 12 | Female | Strong |
| 8 | `song_female_04_sad_actor16.wav` | **Sad** | Actor 16 | Female | Strong |
| 9 | `song_female_05_angry_actor12.wav` | **Angry** | Actor 12 | Female | Strong |
| 10 | `song_female_05_angry_actor16.wav` | **Angry** | Actor 16 | Female | Strong |
| 11 | `song_female_06_fearful_actor12.wav` | **Fearful** | Actor 12 | Female | Strong |
| 12 | `song_female_06_fearful_actor16.wav` | **Fearful** | Actor 16 | Female | Strong |

---

## How to Test in the EmotiSound Web Console

1. Open your browser at **`http://127.0.0.1:5173/`**.
2. Click **`[ + INGEST LOCAL AUDIO FILE ]`** on the top bar.
3. Browse to this `testing/` folder and pick any file (e.g., `testing/speech/male/speech_male_05_angry_actor11.wav`).
4. The system will immediately:
   - Compute and render the 128-band log-Mel spectrogram.
   - Display the interactive oscilloscope waveform.
   - Output the classification decision and posterior probabilities across all 8 channels.
   - Render the multi-parameter chrono-temporal trajectory (Valence, Arousal, Tension, Pitch).
