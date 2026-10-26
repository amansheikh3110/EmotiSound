import React, { useState } from 'react';
import { Download, ArrowLeft, FileText } from 'lucide-react';
import { PredictionSummary } from '../components/emotion/PredictionSummary';
import { EmotionProbabilityChart } from '../components/emotion/EmotionProbabilityChart';
import { Waveform } from '../components/audio/Waveform';
import { Spectrogram } from '../components/audio/Spectrogram';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { Button } from '../components/common/Button';
import { AnalysisResult } from '../types/analysis';
import { TabId } from '../components/layout/Sidebar';

interface AnalysisResultsProps {
  result: AnalysisResult | null;
  audioUrl: string | null;
  onNavigate: (tab: TabId) => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  audioUrl,
  onNavigate,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-md max-w-lg mx-auto my-12">
        <FileText className="w-10 h-10 text-text-muted mb-3" />
        <h2 className="text-base font-bold text-text-primary mb-1">No Active Analysis</h2>
        <p className="text-xs text-text-secondary mb-5">
          Select or upload an audio file to view computed acoustic parameters and classification probabilities.
        </p>
        <Button size="sm" onClick={() => onNavigate('analyze')}>
          Analyze Recording
        </Button>
      </div>
    );
  }

  const handleDownloadReport = () => {
    const reportData = {
      analysis_id: result.id || 'adhoc_session',
      timestamp: result.created_at || new Date().toISOString(),
      model: result.model_info,
      predicted_emotion: result.predicted_emotion,
      confidence_score: result.confidence,
      probability_distribution: result.probabilities,
      audio_metadata: result.audio_metadata,
      inference_duration_ms: result.inference_duration_ms,
      disclaimer: result.disclaimer,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emotisound_analysis_${result.predicted_emotion}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('analyze')}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ingestion</span>
        </button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownloadReport}
          icon={<Download className="w-3.5 h-3.5" />}
        >
          Export JSON
        </Button>
      </div>

      {/* Prediction Summary */}
      <PredictionSummary result={result} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Waveform & Spectrogram */}
        <div className="flex flex-col gap-5">
          {audioUrl && (
            <div className="flex flex-col gap-3 p-4 bg-card border border-border rounded-md">
              <h4 className="text-xs font-bold uppercase tracking-wide font-mono text-text-primary">
                Acoustic Waveform Playback
              </h4>

              <Waveform
                waveformPoints={result.visualization?.waveform_points || []}
                currentTime={currentTime}
                duration={duration || result.audio_metadata.original_duration}
                height={75}
              />

              <AudioPlayer
                audioUrl={audioUrl}
                onTimeUpdate={(c, d) => {
                  setCurrentTime(c);
                  setDuration(d);
                }}
              />
            </div>
          )}

          {/* Mel Spectrogram */}
          <Spectrogram data={result.visualization} />
        </div>

        {/* Right Column: Probability Chart */}
        <div>
          <EmotionProbabilityChart
            probabilities={result.probabilities}
            predictedEmotion={result.predicted_emotion}
          />
        </div>
      </div>
    </div>
  );
};
