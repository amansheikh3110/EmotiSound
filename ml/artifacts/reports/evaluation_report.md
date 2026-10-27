# EmotiSound Model Evaluation Report

## Speaker-Independent Test Set Performance

- **Overall Accuracy**: `44.23%`
- **Macro Precision**: `0.4613`
- **Macro Recall**: `0.4941`
- **Macro F1-Score**: `0.4310`
- **Weighted F1-Score**: `0.4100`
- **Macro ROC-AUC**: `0.8313`
- **Total Test Samples**: `416` (Held-out Actors)

## Per-Class Classification Report

| Emotion Category | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Neutral** | 0.2763 | 0.6562 | 0.3889 | 32 |
| **Calm** | 0.4896 | 0.7344 | 0.5875 | 64 |
| **Happy** | 0.4082 | 0.3125 | 0.3540 | 64 |
| **Sad** | 0.2593 | 0.1094 | 0.1538 | 64 |
| **Angry** | 0.5556 | 0.4688 | 0.5085 | 64 |
| **Fearful** | 0.7333 | 0.1719 | 0.2785 | 64 |
| **Disgust** | 0.4082 | 0.6250 | 0.4938 | 32 |
| **Surprised** | 0.5600 | 0.8750 | 0.6829 | 32 |

## Limitations & Academic Transparency

1. **Acoustic Vocal Pattern Only**: These predictions reflect learned classification of vocal acoustics, not guaranteed psychological ground truth.
2. **Dataset Demographics**: The evaluation is conducted on the RAVDESS actor corpus under controlled studio conditions.
3. **Speaker Independence**: The test set contains strictly unseen speakers (disjoint actor IDs), verifying acoustic generalization across individuals.
