import { apiRequest } from './client';
import {
  AnalysisResult,
  ModelInfo,
  HistoryRecord,
  EvaluationMetrics,
  TrainingHistory,
} from '../types/analysis';

export interface HealthResponse {
  success: boolean;
  status: string;
  service: string;
  version: string;
}

export interface ReadinessResponse {
  success: boolean;
  is_ready: boolean;
  status: string;
  message: string;
}

export interface HistoryListResponse {
  items: HistoryRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface EvaluationResponse {
  is_evaluated: boolean;
  message?: string;
  metrics: EvaluationMetrics;
  training_history: TrainingHistory | null;
}

export interface SamplePreset {
  emotion: string;
  code: string;
  actor: string;
  filename: string;
  url: string;
  available: boolean;
}

export const api = {
  // Health & Readiness
  getHealth: () => apiRequest<HealthResponse>('/health'),
  getReadiness: () => apiRequest<ReadinessResponse>('/ready'),

  // Inference & Model
  getModelInfo: async () => {
    const res = await apiRequest<{ success: boolean; data: ModelInfo }>('/model');
    return res.data;
  },

  analyzeAudio: async (file: File | Blob, filename: string = 'recording.wav') => {
    const formData = new FormData();
    formData.append('file', file, filename);
    const res = await apiRequest<{ success: boolean; data: AnalysisResult }>('/analyze', {
      method: 'POST',
      body: formData,
    });
    return res.data;
  },

  getSamples: async () => {
    const res = await apiRequest<{ success: boolean; data: SamplePreset[] }>('/samples');
    return res.data;
  },

  loadSampleBlob: async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load preset: ${res.status}`);
    return await res.blob();
  },

  // Evaluation
  getEvaluation: async () => {
    const res = await apiRequest<{
      success: boolean;
      is_evaluated: boolean;
      message?: string;
      data: { metrics: EvaluationMetrics; training_history: TrainingHistory | null } | null;
    }>('/evaluation');

    return {
      is_evaluated: res.is_evaluated,
      message: res.message,
      data: res.data,
    };
  },

  // History
  getHistory: async (limit: number = 20, offset: number = 0, emotion?: string) => {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (emotion) params.append('emotion', emotion);
    const res = await apiRequest<{ success: boolean; data: HistoryListResponse }>(`/history?${params.toString()}`);
    return res.data;
  },

  getHistoryRecord: async (id: string) => {
    const res = await apiRequest<{ success: boolean; data: HistoryRecord }>(`/history/${id}`);
    return res.data;
  },

  deleteHistoryRecord: async (id: string) => {
    const res = await apiRequest<{ success: boolean; message: string }>(`/history/${id}`, {
      method: 'DELETE',
    });
    return res;
  },

  getHistoryStats: async () => {
    const res = await apiRequest<{ success: boolean; data: { total_analyses: number; emotion_distribution: Record<string, number> } }>('/history/stats');
    return res.data;
  },
};
