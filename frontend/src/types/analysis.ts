export type EmotionClass =
  | 'neutral'
  | 'calm'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'disgust'
  | 'surprised';

export interface AudioMetadata {
  original_duration: number;
  processed_duration: number;
  sample_rate: number;
  was_padded: boolean;
  was_truncated: boolean;
  samples_count?: number;
}

export interface TemporalTelemetry {
  timestamps: number[];
  energy_contour: number[];
  pitch_contour_hz: number[];
  valence_trajectory: number[];
  arousal_trajectory: number[];
  tension_contour: number[];
  dominant_emotion_per_frame: string[];
  segments: Array<{
    start_sec: number;
    end_sec: number;
    emotion: string;
    confidence: number;
    intensity: 'low' | 'moderate' | 'high' | 'peak';
  }>;
  summary: {
    mean_pitch_hz: number;
    pitch_dynamics_hz: number;
    peak_intensity_db: number;
    dynamic_range_db: number;
    mean_valence: number;
    mean_arousal: number;
    emotional_trajectory_type: string;
    dominant_affect_label: string;
  };
}

export interface VisualizationData {
  waveform_points: number[];
  spectrogram_matrix?: number[][];
  spectrogram_shape: [number, number];
  time_duration_sec: number;
  freq_min_hz: number;
  freq_max_hz: number;
  n_mels: number;
  min_db: number;
  max_db: number;
  temporal_telemetry?: TemporalTelemetry;
}

export interface ModelInfo {
  is_ready: boolean;
  model_name: string;
  model_version: string;
  num_classes: number;
  supported_classes: string[];
  audio_config: {
    sample_rate: number;
    target_duration_seconds: number;
    n_mels: number;
    n_fft: number;
    hop_length: number;
  };
  training_performance?: {
    best_epoch?: number;
    best_val_loss?: number;
    best_val_accuracy?: number;
    status?: string;
  };
}

export interface AnalysisResult {
  id?: string;
  created_at?: string;
  predicted_emotion: string;
  confidence: number;
  probabilities: Record<string, number>;
  filename: string;
  audio_metadata: AudioMetadata;
  visualization?: VisualizationData;
  inference_duration_ms: number;
  model_info: {
    name: string;
    version: string;
    classes_count: number;
  };
  disclaimer: string;
}

export interface HistoryRecord {
  id: string;
  filename: string;
  predicted_emotion: string;
  confidence: number;
  probabilities: Record<string, number>;
  audio_metadata: AudioMetadata;
  model_version: string;
  created_at: string;
}

export interface PerClassMetric {
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface EvaluationMetrics {
  overall_accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  weighted_f1: number;
  roc_auc_macro: number | null;
  total_test_samples: number;
  classes: string[];
  per_class: Record<string, PerClassMetric>;
  confusion_matrix: number[][];
  confusion_matrix_normalized: number[][];
  best_epoch?: number;
  test_actors?: string[];
}

export interface TrainingHistory {
  epoch: number[];
  train_loss: number[];
  train_acc: number[];
  val_loss: number[];
  val_acc: number[];
  lr: number[];
  duration_sec: number[];
}
