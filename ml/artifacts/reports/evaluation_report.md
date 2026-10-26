# EmotiSound Model Evaluation Report

## Speaker-Independent Test Set Performance

- **Overall Accuracy**: `42.92%`
- **Macro Precision**: `0.4909`
- **Macro Recall**: `0.4531`
- **Macro F1-Score**: `0.4160`
- **Weighted F1-Score**: `0.4268`
- **Macro ROC-AUC**: `0.8316`
- **Total Test Samples**: `240` (Held-out Actors)

## Per-Class Classification Report

| Emotion Category | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Neutral** | 0.1512 | 0.8125 | 0.2549 | 16 |
| **Calm** | 0.6047 | 0.8125 | 0.6933 | 32 |
| **Happy** | 0.5238 | 0.3438 | 0.4151 | 32 |
| **Sad** | 0.1667 | 0.0312 | 0.0526 | 32 |
| **Angry** | 0.6667 | 0.2500 | 0.3636 | 32 |
| **Fearful** | 0.5500 | 0.3438 | 0.4231 | 32 |
| **Disgust** | 0.6190 | 0.4062 | 0.4906 | 32 |
| **Surprised** | 0.6452 | 0.6250 | 0.6349 | 32 |

## Limitations & Academic Transparency

1. **Acoustic Vocal Pattern Only**: These predictions reflect learned classification of vocal acoustics, not guaranteed psychological ground truth.
2. **Dataset Demographics**: The evaluation is conducted on the RAVDESS actor corpus under controlled studio conditions.
3. **Speaker Independence**: The test set contains strictly unseen speakers (disjoint actor IDs), verifying acoustic generalization across individuals.
