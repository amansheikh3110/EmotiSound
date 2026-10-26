import React from 'react';
import {
  Mic2,
  CheckCircle2,
  Layers,
  Award,
  Database,
  ArrowRight,
  AudioWaveform,
  Sliders,
  Volume2,
  VolumeX,
  Activity,
  Radio,
  Disc,
  Terminal,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ModelInfo, HistoryRecord, EvaluationMetrics } from '../types/analysis';
import { TabId } from '../components/layout/Sidebar';

interface OverviewProps {
  onNavigate: (tab: TabId) => void;
  modelInfo: ModelInfo | null;
  evaluationMetrics: EvaluationMetrics | null;
  recentHistory: HistoryRecord[];
  totalAnalysesCount: number;
}

const EMOTIONS_INFO = [
  { label: 'neutral', icon: AudioWaveform, desc: 'Balanced fundamental frequency and stable vocal cadence' },
  { label: 'calm', icon: Sliders, desc: 'Slower tempo, decreased intensity, and relaxed pitch dynamic' },
  { label: 'happy', icon: Volume2, desc: 'Elevated pitch center, wide inflection excursions, and high energy' },
  { label: 'sad', icon: VolumeX, desc: 'Depressed F0 contour, low spectral energy, and extended pauses' },
  { label: 'angry', icon: Activity, desc: 'High acoustic power, steep spectral flux, and aggressive attack' },
  { label: 'fearful', icon: Radio, desc: 'High pitch jitter, micro-tremors, and irregular amplitude' },
  { label: 'disgust', icon: Disc, desc: 'Low fundamental frequency, guttural spectral resonance' },
  { label: 'surprised', icon: Layers, desc: 'Rapid upward pitch glide, wide frequency band displacement' },
];

export const Overview: React.FC<OverviewProps> = ({
  onNavigate,
  modelInfo,
  evaluationMetrics,
  recentHistory,
  totalAnalysesCount,
}) => {
  const accuracyText = evaluationMetrics?.overall_accuracy
    ? `${(evaluationMetrics.overall_accuracy * 100).toFixed(1)}%`
    : '42.9%';

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Header */}
      <div className="p-6 md:p-8 rounded-md bg-card border border-border">
        <div className="max-w-2xl flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-sm bg-zinc-900 border border-zinc-800 text-[11px] font-mono font-medium text-zinc-300 w-fit">
            <Terminal className="w-3 h-3 text-zinc-400" />
            PyTorch 2D CNN Engine
          </div>

          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-text-primary leading-tight">
            Speech Emotion Recognition
          </h1>

          <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
            Acoustic pattern classification via log-Mel spectrogram representations (128 frequency bands).
            Trained and benchmarked on held-out test actors under strict speaker-independent protocol.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate('analyze')}
              icon={<Mic2 className="w-4 h-4" />}
            >
              Analyze Audio
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => onNavigate('insights')}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Model Metrics
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card hoverable className="flex items-center gap-3.5 p-4">
          <div className="w-10 h-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-text-muted uppercase font-mono font-medium">Model Status</p>
            <p className="text-base font-bold text-text-primary">
              {modelInfo?.is_ready ? 'Inference Ready' : 'Standby'}
            </p>
            <p className="text-[10px] font-mono text-emerald-400">PyTorch Singleton</p>
          </div>
        </Card>

        <Card hoverable className="flex items-center gap-3.5 p-4">
          <div className="w-10 h-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-text-muted uppercase font-mono font-medium">Emotion Classes</p>
            <p className="text-base font-bold text-text-primary">8 Classes</p>
            <p className="text-[10px] font-mono text-text-muted">RAVDESS Corpus</p>
          </div>
        </Card>

        <Card hoverable className="flex items-center gap-3.5 p-4">
          <div className="w-10 h-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-text-muted uppercase font-mono font-medium">Test Accuracy</p>
            <p className="text-base font-bold text-zinc-100">{accuracyText}</p>
            <p className="text-[10px] font-mono text-text-muted">Unseen Speakers</p>
          </div>
        </Card>

        <Card hoverable className="flex items-center gap-3.5 p-4">
          <div className="w-10 h-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-text-muted uppercase font-mono font-medium">History Records</p>
            <p className="text-base font-bold text-text-primary">{totalAnalysesCount}</p>
            <p className="text-[10px] font-mono text-text-muted">SQLite Storage</p>
          </div>
        </Card>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 8 Emotion Categories */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide font-mono">
              Supported Acoustic Categories
            </h2>
            <span className="text-[11px] text-text-muted font-mono">8 Target Classes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {EMOTIONS_INFO.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="p-3.5 bg-card border border-border rounded-md flex items-start gap-3 hover:border-zinc-700 transition-colors duration-150"
                >
                  <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold capitalize text-text-primary">{item.label}</span>
                      <Badge emotion={item.label} size="sm" />
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recent Inferences */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide font-mono">
              Recent Inferences
            </h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors duration-150 font-mono"
            >
              All ({totalAnalysesCount})
            </button>
          </div>

          {recentHistory.length === 0 ? (
            <div className="p-6 bg-card border border-border rounded-md flex flex-col items-center justify-center text-center">
              <Mic2 className="w-6 h-6 text-text-muted mb-2" />
              <p className="text-xs font-medium text-text-primary mb-1">No past analyses</p>
              <p className="text-[11px] text-text-secondary mb-3">
                Upload an audio file to view classification output.
              </p>
              <Button size="sm" onClick={() => onNavigate('analyze')}>
                Analyze Audio
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentHistory.slice(0, 4).map((record) => (
                <div
                  key={record.id}
                  onClick={() => onNavigate('history')}
                  className="p-3 bg-card border border-border rounded-md flex items-center justify-between hover:border-zinc-700 cursor-pointer transition-colors duration-150"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Badge emotion={record.predicted_emotion} size="sm" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-text-primary truncate" title={record.filename}>
                        {record.filename}
                      </p>
                      <p className="text-[10px] font-mono text-text-muted">
                        {record.audio_metadata?.original_duration?.toFixed(1)}s • {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold text-zinc-100 flex-shrink-0">
                    {(record.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
