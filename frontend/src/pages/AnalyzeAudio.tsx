import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, Music } from 'lucide-react';
import { AudioUploader } from '../components/audio/AudioUploader';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { Waveform } from '../components/audio/Waveform';
import { Button } from '../components/common/Button';
import { api } from '../api/endpoints';
import { AnalysisResult, ModelInfo } from '../types/analysis';

interface AnalyzeAudioProps {
  modelInfo: ModelInfo | null;
  onAnalysisSuccess: (result: AnalysisResult, audioUrl: string) => void;
}

export const AnalyzeAudio: React.FC<AnalyzeAudioProps> = ({
  modelInfo,
  onAnalysisSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveformPoints, setWaveformPoints] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Extracting acoustic features...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setWaveformPoints([]);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setAudioUrl(url);

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) return;
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        const channelData = decoded.getChannelData(0);
        const step = Math.max(1, Math.floor(channelData.length / 300));
        const points = [];
        for (let i = 0; i < channelData.length; i += step) {
          points.push(channelData[i]);
          if (points.length >= 300) break;
        }
        setWaveformPoints(points);
        setDuration(decoded.duration);
      } catch (err) {
        console.warn('Could not decode audio in browser canvas preview:', err);
      }
    };

    reader.readAsArrayBuffer(selectedFile);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    if (!modelInfo?.is_ready) {
      setErrorMessage("Model is not ready for inference. Please ensure the model checkpoint is loaded.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStatus('Uploading audio stream...');

    try {
      setTimeout(() => setLoadingStatus('Computing log-Mel spectrogram (128 bins)...'), 300);
      setTimeout(() => setLoadingStatus('Executing PyTorch 2D CNN inference...'), 700);

      const result = await api.analyzeAudio(selectedFile);
      if (audioUrl) {
        onAnalysisSuccess(result, audioUrl);
      }
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setErrorMessage(err.message || "Failed to analyze audio. Please ensure the file is valid and the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setWaveformPoints([]);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
          Analyze Audio Recording
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Upload a voice sample to compute its log-Mel spectrogram and infer acoustic emotion category.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-800 rounded-md flex items-start gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Analysis Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Upload Box */}
      <AudioUploader
        onFileSelected={(file) => setSelectedFile(file)}
        selectedFile={selectedFile}
        onClear={handleClear}
        isLoading={isLoading}
      />

      {/* Audio Playback & Waveform Preview */}
      {selectedFile && audioUrl && (
        <div className="flex flex-col gap-4 p-5 bg-card border border-border rounded-md">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wide font-mono text-text-primary flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-zinc-400" /> Waveform Signal Preview
            </h3>
            <span className="text-[11px] font-mono text-text-muted">
              {duration ? `${duration.toFixed(2)}s` : 'Reading...'}
            </span>
          </div>

          <Waveform
            waveformPoints={waveformPoints}
            currentTime={currentTime}
            duration={duration}
            height={80}
            onSeek={(ratio) => {
              setCurrentTime(ratio * duration);
            }}
          />

          <AudioPlayer
            audioUrl={audioUrl}
            onTimeUpdate={(c, d) => {
              setCurrentTime(c);
              setDuration(d);
            }}
          />

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border mt-1">
            <div className="text-[11px] font-mono text-text-secondary">
              Input normalized to 16,000 Hz, 4.0s duration window.
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleAnalyze}
              isLoading={isLoading}
              disabled={!selectedFile || isLoading || !modelInfo?.is_ready}
              icon={<Activity className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              {isLoading ? loadingStatus : 'Execute Classification'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
