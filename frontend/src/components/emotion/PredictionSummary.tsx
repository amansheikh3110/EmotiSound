import React from 'react';
import { Activity, Clock, Zap, Cpu, Info } from 'lucide-react';
import { AnalysisResult } from '../../types/analysis';
import { Badge } from '../common/Badge';

interface PredictionSummaryProps {
  result: AnalysisResult;
}

export const PredictionSummary: React.FC<PredictionSummaryProps> = ({ result }) => {
  const { predicted_emotion, confidence, audio_metadata, inference_duration_ms, model_info } = result;
  const percent = (confidence * 100).toFixed(1);

  return (
    <div className="p-6 bg-card border border-border rounded-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-mono font-semibold tracking-wider text-text-muted flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
              Predicted Category
            </span>
            <Badge emotion={predicted_emotion} size="sm" />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary capitalize flex items-center gap-3">
            {predicted_emotion}
            <span className="text-xl md:text-2xl font-mono font-semibold text-zinc-100">
              {percent}%
            </span>
          </h2>

          <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
            Highest log-Mel acoustic score assigned to{' '}
            <strong className="text-text-primary capitalize">{predicted_emotion}</strong> among the 8 supported categories.
          </p>
        </div>

        {/* Technical telemetry pill */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-zinc-900 border border-border p-3 rounded-md text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-400" /> Duration
            </span>
            <span className="font-mono text-xs font-semibold text-text-primary">
              {audio_metadata.original_duration.toFixed(2)}s
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              <Zap className="w-3 h-3 text-zinc-400" /> Inference
            </span>
            <span className="font-mono text-xs font-semibold text-zinc-100">
              {inference_duration_ms} ms
            </span>
          </div>

          <div className="flex flex-col gap-0.5 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              <Cpu className="w-3 h-3 text-zinc-400" /> Model
            </span>
            <span className="font-mono text-xs font-semibold text-text-primary truncate" title={model_info.name}>
              CNN v{model_info.version}
            </span>
          </div>
        </div>
      </div>

      {/* Disclosures banner */}
      <div className="mt-5 pt-3.5 border-t border-border flex flex-wrap items-center gap-3 text-[11px] text-text-muted font-mono">
        {audio_metadata.was_padded && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-zinc-900 border border-border text-zinc-300">
            <Info className="w-3 h-3 text-zinc-400" /> Padded to 4.0s
          </span>
        )}
        {audio_metadata.was_truncated && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-zinc-900 border border-border text-zinc-300">
            <Info className="w-3 h-3 text-amber-400" /> Truncated to 4.0s
          </span>
        )}
        <span>Sample Rate: {audio_metadata.sample_rate.toLocaleString()} Hz Mono</span>
      </div>
    </div>
  );
};
