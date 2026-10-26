import React, { useState, useEffect, useRef } from 'react';
import { api, SamplePreset } from '../../api/endpoints';
import { AnalysisResult, ModelInfo } from '../../types/analysis';
import { ChronoEmotionTimeline } from './ChronoEmotionTimeline';

interface AnalyzerDeckProps {
  modelInfo: ModelInfo | null;
  onAnalysisSuccess: (result: AnalysisResult, audioUrl: string) => void;
  activeResult: AnalysisResult | null;
  activeAudioUrl: string | null;
}

const EMOTIONS = [
  { code: '01', name: 'neutral', hex: '#64748b' },
  { code: '02', name: 'calm', hex: '#0284c7' },
  { code: '03', name: 'happy', hex: '#d97706' },
  { code: '04', name: 'sad', hex: '#2563eb' },
  { code: '05', name: 'angry', hex: '#dc2626' },
  { code: '06', name: 'fearful', hex: '#7c3aed' },
  { code: '07', name: 'disgust', hex: '#059669' },
  { code: '08', name: 'surprised', hex: '#ea580c' },
];

export const AnalyzerDeck: React.FC<AnalyzerDeckProps> = ({
  modelInfo,
  onAnalysisSuccess,
  activeResult,
  activeAudioUrl,
}) => {
  const [samples, setSamples] = useState<SamplePreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>('neutral');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('READY FOR INGESTION');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentAudioBlobUrl, setCurrentAudioBlobUrl] = useState<string | null>(activeAudioUrl);
  const [currentFilename, setCurrentFilename] = useState<string>(activeResult?.filename || '03-01-01-01-01-01-01.wav');
  const [waveformPoints, setWaveformPoints] = useState<number[]>(activeResult?.visualization?.waveform_points || []);

  // Spectrogram canvas ref
  const specCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load sample presets on mount
  useEffect(() => {
    api.getSamples().then((data) => {
      setSamples(data);
    }).catch((err) => console.warn('Could not fetch sample presets:', err));
  }, []);

  // Keep state synced with activeResult
  useEffect(() => {
    if (activeResult) {
      setCurrentFilename(activeResult.filename);
      if (activeResult.visualization?.waveform_points) {
        setWaveformPoints(activeResult.visualization.waveform_points);
      }
    }
    if (activeAudioUrl) {
      setCurrentAudioBlobUrl(activeAudioUrl);
    }
  }, [activeResult, activeAudioUrl]);

  // Handle preset loading & immediate analysis
  const handleSelectPreset = async (sample: SamplePreset) => {
    setSelectedPreset(sample.emotion);
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(`FETCHING PRESET: [${sample.emotion.toUpperCase()}]`);

    try {
      const blob = await api.loadSampleBlob(sample.url);
      const url = URL.createObjectURL(blob);
      setCurrentAudioBlobUrl(url);
      setCurrentFilename(sample.filename);

      extractWaveformFromBlob(blob);

      setStatusMessage(`EXECUTING PYTORCH INFERENCE...`);
      const result = await api.analyzeAudio(blob, sample.filename);
      onAnalysisSuccess(result, url);
      setStatusMessage(`INFERENCE COMPLETE: [${result.predicted_emotion.toUpperCase()}]`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze preset.');
      setStatusMessage('ERROR OCCURRED');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle local file upload
  const handleFileUpload = async (file: File) => {
    setSelectedPreset(null);
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(`INGESTING LOCAL FILE: ${file.name}`);

    try {
      const url = URL.createObjectURL(file);
      setCurrentAudioBlobUrl(url);
      setCurrentFilename(file.name);

      extractWaveformFromBlob(file);

      setStatusMessage('EXECUTING 2D-CNN INFERENCE...');
      const result = await api.analyzeAudio(file, file.name);
      onAnalysisSuccess(result, url);
      setStatusMessage(`CLASSIFIED: [${result.predicted_emotion.toUpperCase()}]`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload processing failed.');
      setStatusMessage('ERROR OCCURRED');
    } finally {
      setIsLoading(false);
    }
  };

  const extractWaveformFromBlob = (blob: Blob) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) return;
        const decoded = await audioCtx.decodeAudioData(buffer);
        const channel = decoded.getChannelData(0);
        const step = Math.max(1, Math.floor(channel.length / 300));
        const pts: number[] = [];
        for (let i = 0; i < channel.length; i += step) {
          pts.push(channel[i]);
          if (pts.length >= 300) break;
        }
        setWaveformPoints(pts);
        setDuration(decoded.duration);
      } catch (err) {
        console.warn('Waveform decode warning:', err);
      }
    };
    reader.readAsArrayBuffer(blob);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onMeta = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);

    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [currentAudioBlobUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((err) => console.error(err));
    }
  };

  const handleReset = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      setCurrentTime(0);
    }
  };

  // Render Oscilloscope
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 80 * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = 80;
    const midY = h / 2;

    // Recessed hardware screen background
    ctx.fillStyle = '#0f1013';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#22242c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Centerline
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    // Vertical time grid ticks
    for (let s = 1; s <= 4; s++) {
      const gx = (s / 4) * w;
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
    }
    ctx.stroke();

    if (!waveformPoints || waveformPoints.length === 0) {
      return;
    }

    const playedRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
    const numPoints = waveformPoints.length;
    const barWidth = Math.max(1, (w / numPoints) - 1);

    for (let i = 0; i < numPoints; i++) {
      const x = (i / numPoints) * w;
      const pointRatio = i / numPoints;
      const amplitude = Math.abs(waveformPoints[i]);
      const barHeight = Math.max(2, amplitude * (h * 0.88));

      ctx.fillStyle = pointRatio <= playedRatio ? '#fafaf8' : '#383b47';
      ctx.fillRect(x, midY - barHeight / 2, barWidth, barHeight);
    }

    // Tactical red playhead line
    if (duration > 0 && currentTime > 0) {
      const px = playedRatio * w;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
    }
  }, [waveformPoints, currentTime, duration]);

  // Render Log-Mel Spectrogram
  useEffect(() => {
    const canvas = specCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = 180;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Recessed dark screen
    ctx.fillStyle = '#0a0b0e';
    ctx.fillRect(0, 0, w, h);

    const padLeft = 45;
    const padBottom = 20;
    const plotW = Math.max(10, w - padLeft - 10);
    const plotH = Math.max(10, h - padBottom - 10);

    // Helper acoustic colormap (Audition / Magma inspired)
    const getColor = (val: number): [number, number, number] => {
      // 0.00 - 0.20: Noise floor -> Dark Navy
      if (val < 0.20) {
        const t = val / 0.20;
        return [
          Math.floor(10 + (22 - 10) * t),
          Math.floor(12 + (38 - 12) * t),
          Math.floor(20 + (90 - 20) * t),
        ];
      }
      // 0.20 - 0.45: Low energy -> Cobalt Blue
      if (val < 0.45) {
        const t = (val - 0.20) / 0.25;
        return [
          Math.floor(22 + (30 - 22) * t),
          Math.floor(38 + (100 - 38) * t),
          Math.floor(90 + (220 - 90) * t),
        ];
      }
      // 0.45 - 0.70: Mid formants -> Vivid Cyan / Amber transition
      if (val < 0.70) {
        const t = (val - 0.45) / 0.25;
        return [
          Math.floor(30 + (240 - 30) * t),
          Math.floor(100 + (160 - 100) * t),
          Math.floor(220 + (30 - 220) * t),
        ];
      }
      // 0.70 - 0.88: Strong harmonics -> Warm Amber / Orange
      if (val < 0.88) {
        const t = (val - 0.70) / 0.18;
        return [
          Math.floor(240 + (255 - 240) * t),
          Math.floor(160 + (80 - 160) * t),
          Math.floor(30 + (10 - 30) * t),
        ];
      }
      // 0.88 - 1.00: Peak resonance -> Brilliant Yellow-White
      const t = (val - 0.88) / 0.12;
      return [
        255,
        Math.floor(80 + (240 - 80) * t),
        Math.floor(10 + (180 - 10) * t),
      ];
    };

    const matrix = activeResult?.visualization?.spectrogram_matrix;

    if (matrix && matrix.length > 0) {
      // 1. Render actual authentic 64x126 log-Mel spectrogram from PyTorch/Librosa
      const rows = matrix.length; // 64
      const cols = matrix[0].length; // 126
      const offCanvas = document.createElement('canvas');
      offCanvas.width = cols;
      offCanvas.height = rows;
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        const imgData = offCtx.createImageData(cols, rows);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const val = matrix[r][c];
            const [cr, cg, cb] = getColor(val);
            const idx = (r * cols + c) * 4;
            imgData.data[idx] = cr;
            imgData.data[idx + 1] = cg;
            imgData.data[idx + 2] = cb;
            imgData.data[idx + 3] = 255;
          }
        }
        offCtx.putImageData(imgData, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(offCanvas, padLeft, 10, plotW, plotH);
      }
    } else {
      // 2. Hardware Standby Screen: Clean calibration reticle, zero fake data
      ctx.strokeStyle = '#1a1c24';
      ctx.lineWidth = 1;
      
      // Horizontal frequency guide lines (2kHz, 4kHz, 6kHz)
      for (let f = 1; f <= 3; f++) {
        const gy = 10 + (f / 4) * plotH;
        ctx.beginPath();
        ctx.moveTo(padLeft, gy);
        ctx.lineTo(padLeft + plotW, gy);
        ctx.stroke();
      }

      // Vertical time guide lines
      for (let t = 1; t <= 3; t++) {
        const gx = padLeft + (t / 4) * plotW;
        ctx.beginPath();
        ctx.moveTo(gx, 10);
        ctx.lineTo(gx, 10 + plotH);
        ctx.stroke();
      }

      // Center crosshair
      const midX = padLeft + plotW / 2;
      const midY = 10 + plotH / 2;
      ctx.strokeStyle = '#2d313d';
      ctx.beginPath();
      ctx.moveTo(midX - 12, midY);
      ctx.lineTo(midX + 12, midY);
      ctx.moveTo(midX, midY - 12);
      ctx.lineTo(midX, midY + 12);
      ctx.stroke();

      // Standby hardware prompt
      ctx.fillStyle = '#4c5264';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ SPECTROGRAPHIC SENSOR STANDBY // INGEST AUDIO TO SAMPLE ]', midX, midY + 28);
    }

    // Axes
    ctx.strokeStyle = '#272932';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, 10);
    ctx.lineTo(padLeft, h - padBottom);
    ctx.lineTo(w - 10, h - padBottom);
    ctx.stroke();

    // Time labels dynamically scaled to audio duration
    const maxTime = activeResult?.visualization?.time_duration_sec || duration || 4.0;
    const midTime = maxTime / 2;

    // Labels
    ctx.fillStyle = '#8e92a2';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('8 kHz', padLeft - 6, 18);
    ctx.fillText('4 kHz', padLeft - 6, (h - padBottom) / 2 + 5);
    ctx.fillText('0 Hz', padLeft - 6, h - padBottom);

    ctx.textAlign = 'center';
    ctx.fillText('0.00s', padLeft, h - 6);
    ctx.fillText(`${midTime.toFixed(2)}s`, padLeft + plotW / 2, h - 6);
    ctx.fillText(`${maxTime.toFixed(2)}s`, padLeft + plotW, h - 6);
  }, [waveformPoints, activeResult, duration]);

  const hasInferenceResult = Boolean(activeResult && activeResult.probabilities);
  const probs = activeResult?.probabilities || {};
  const detectedEmotion = activeResult?.predicted_emotion || null;
  const confidencePercent = activeResult ? (activeResult.confidence * 100).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-3 font-mono text-xs select-none text-[#18181a]">
      {/* Audio element for streaming */}
      {currentAudioBlobUrl && <audio ref={audioRef} src={currentAudioBlobUrl} preload="auto" />}

      {/* Preset Ingestion Strip */}
      <div className="bg-[#f6f5f0] border border-[#d4cfc0] p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-[#706c62] font-bold uppercase tracking-wider">
            CANONICAL PRESETS (ACTOR 01):
          </span>
          {samples.map((s) => {
            const isSelected = selectedPreset === s.emotion;
            return (
              <button
                key={s.code}
                onClick={() => handleSelectPreset(s)}
                disabled={isLoading}
                className={`px-2 py-1 text-[10px] uppercase font-bold border transition-colors ${
                  isSelected
                    ? 'bg-[#18181a] text-[#f7f6f2] border-[#18181a]'
                    : 'bg-[#e2ded2] text-[#2c2a24] border-[#c6c1b0] hover:bg-[#d6d1c2] hover:text-black'
                }`}
              >
                [{s.code}: {s.emotion.substring(0, 3)}]
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".wav,.mp3,.flac,.ogg,audio/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-3 py-1 bg-[#dfdbce] text-[#18181a] border border-[#beb9a7] hover:bg-[#d2cdbf] uppercase font-bold text-[10px] transition-colors"
          >
            [ + INGEST LOCAL AUDIO FILE ]
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {errorMessage && (
        <div className="bg-[#fceeed] border border-[#dc2626] text-[#dc2626] px-3 py-1.5 text-[11px] font-bold">
          ERROR: {errorMessage}
        </div>
      )}

      {/* Main Dual-Column Engineering Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column (7 cols): Waveform + Spectrogram */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Signal Ingestion & Waveform Deck */}
          <div className="bg-[#f6f5f0] border border-[#d4cfc0] p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-[#e4dfd2] pb-1.5">
              <span className="font-bold text-[#18181a] uppercase text-[11px]">
                SIGNAL ACQUISITION & OSCILLOSCOPE // CHANNEL 0 (MONO)
              </span>
              <span className="text-[10px] text-[#706c62] font-semibold">
                STATUS: {statusMessage}
              </span>
            </div>

            {/* Signal Telemetry Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] bg-[#ede9df] border border-[#d8d3c5] p-2 text-[#4a473f]">
              <div>FILE: <span className="text-[#18181a] font-bold truncate block">{currentFilename}</span></div>
              <div>DURATION: <span className="text-[#18181a] font-bold">{duration ? `${duration.toFixed(2)}s` : '3.30s'}</span></div>
              <div>FS: <span className="text-[#18181a] font-bold">16,000 HZ</span></div>
              <div>WINDOW: <span className="text-[#18181a] font-bold">4.00s (64K)</span></div>
            </div>

            {/* Waveform Canvas - Recessed Dark Screen */}
            <div className="relative border border-[#22242c] bg-[#0f1013]">
              <canvas
                ref={waveCanvasRef}
                style={{ width: '100%', height: '80px' }}
                className="w-full block"
              />
            </div>

            {/* Transport Bar */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={togglePlay}
                  className="px-3 py-1 bg-[#18181a] text-[#f7f6f2] font-bold text-[10px] hover:bg-[#303036] uppercase border border-[#18181a]"
                >
                  {isPlaying ? '[ ⏸ PAUSE ]' : '[ ▶ PLAY ]'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-2 py-1 bg-[#dfdbce] text-[#18181a] font-bold text-[10px] hover:bg-[#d2cdbf] border border-[#c4beaf] uppercase"
                >
                  [ ↺ REW ]
                </button>
              </div>

              <div className="flex-1 flex items-center gap-2">
                <span className="text-[10px] text-[#706c62] w-10 text-right font-bold">
                  {currentTime.toFixed(2)}s
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 4.0}
                  step={0.01}
                  value={currentTime}
                  onChange={(e) => {
                    const t = parseFloat(e.target.value);
                    if (audioRef.current) audioRef.current.currentTime = t;
                    setCurrentTime(t);
                  }}
                  className="flex-1 h-1 bg-[#d0cbbd] appearance-none accent-[#18181a] cursor-pointer"
                />
                <span className="text-[10px] text-[#706c62] w-10 font-bold">
                  {(duration || 4.0).toFixed(2)}s
                </span>
              </div>
            </div>
          </div>

          {/* Log-Mel Spectrogram Matrix */}
          <div className="bg-[#f6f5f0] border border-[#d4cfc0] p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-[#e4dfd2] pb-1.5">
              <span className="font-bold text-[#18181a] uppercase text-[11px]">
                LOG-MEL SPECTRAL MATRIX // 128 BANDS x 251 FRAMES
              </span>
              <div className="flex items-center gap-1.5 text-[9px] text-[#706c62] font-semibold">
                <span>-80dB</span>
                <span className="w-2.5 h-1.5 bg-[#0f1013] border border-[#333]" />
                <span className="w-2.5 h-1.5 bg-[#1e3a8a]" />
                <span className="w-2.5 h-1.5 bg-[#2563eb]" />
                <span className="w-2.5 h-1.5 bg-[#f59e0b]" />
                <span className="w-2.5 h-1.5 bg-[#ef4444]" />
                <span>0dB</span>
              </div>
            </div>

            {/* Recessed Screen */}
            <div className="relative border border-[#22242c] bg-[#0f1013]">
              <canvas
                ref={specCanvasRef}
                style={{ width: '100%', height: '180px' }}
                className="w-full block"
              />
            </div>

            <div className="text-[10px] text-[#706c62] flex items-center justify-between pt-0.5">
              <span>PARAMETERS: N_FFT=1024 • HOP=256 • HANN • 128 MEL BINS</span>
              <span>DTYPE: FLOAT32</span>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Classifier Telemetry & VU Softmax Bars */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Primary Readout Box */}
          <div className="bg-[#f6f5f0] border border-[#d4cfc0] p-4 flex flex-col gap-3">
            <div className="border-b border-[#e4dfd2] pb-1 flex items-center justify-between">
              <span className="font-bold text-[#18181a] uppercase text-[11px]">
                PRIMARY CLASSIFIER OUTPUT
              </span>
              <span className={`text-[10px] font-bold ${hasInferenceResult ? 'text-emerald-700' : 'text-[#8b877a]'}`}>
                {hasInferenceResult ? '[PYTORCH_ACTIVE]' : '[STANDBY_OFFLINE]'}
              </span>
            </div>

            {/* Inset Readout Box */}
            <div className="bg-[#ede9df] border border-[#d8d3c5] p-4 flex flex-col gap-1">
              <span className="text-[10px] text-[#706c62] uppercase tracking-widest font-bold">
                CLASSIFICATION DECISION:
              </span>
              <div className="text-3xl font-black text-[#18181a] uppercase tracking-tight flex items-baseline justify-between">
                <span>{hasInferenceResult ? detectedEmotion : '-- STANDBY --'}</span>
                <span className={`text-2xl font-mono ${hasInferenceResult ? 'text-emerald-700' : 'text-[#8b877a]'}`}>
                  {hasInferenceResult ? `${confidencePercent}%` : '--.-%'}
                </span>
              </div>
              <div className="text-[10px] text-[#706c62] pt-1 flex items-center justify-between border-t border-[#ded9cb] mt-2 font-semibold">
                <span>LATENCY: {hasInferenceResult ? `${activeResult?.inference_duration_ms} MS` : '-- MS'}</span>
                <span>MODEL: 2D-CNN V1.0</span>
              </div>
            </div>
          </div>

          {/* 8-Channel Hardware Level Meters */}
          <div className="bg-[#f6f5f0] border border-[#d4cfc0] p-3.5 flex flex-col gap-2.5">
            <div className="border-b border-[#e4dfd2] pb-1.5 flex items-center justify-between">
              <span className="font-bold text-[#18181a] uppercase text-[11px]">
                POSTERIOR PROBABILITY VECTOR // 8 CLASSES
              </span>
              <span className="text-[10px] text-[#706c62] font-semibold">
                {hasInferenceResult ? 'SOFTMAX OUTPUT' : 'STANDBY (0.0%)'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {EMOTIONS.map((e) => {
                const prob = hasInferenceResult ? (probs[e.name] || 0) : 0;
                const pct = hasInferenceResult ? (prob * 100).toFixed(1) : '0.0';
                const isTop = Boolean(hasInferenceResult && e.name.toLowerCase() === detectedEmotion?.toLowerCase());

                return (
                  <div
                    key={e.code}
                    className={`p-1.5 border transition-colors ${
                      isTop
                        ? 'bg-[#18181a] border-[#18181a] text-[#f7f6f2]'
                        : 'bg-[#ede9df] border-[#ded9cb] text-[#18181a]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold uppercase ${isTop ? 'text-white' : 'text-[#2a2822]'}`}>
                          {isTop ? '▶ ' : '  '}
                          [{e.code}] {e.name.padEnd(9, ' ')}
                        </span>
                      </div>
                      <span className={`font-bold ${isTop ? 'text-white' : 'text-[#2a2822]'}`}>
                        {pct.padStart(5, ' ')}%
                      </span>
                    </div>

                    {/* Stepped solid meter track */}
                    <div className={`w-full h-2 border overflow-hidden ${
                      isTop ? 'bg-[#2a2822] border-[#444]' : 'bg-[#ded9cb] border-[#c8c3b4]'
                    }`}>
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${Math.max(1, prob * 100)}%`,
                          backgroundColor: isTop ? '#fafafa' : e.hex,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[10px] text-[#706c62] pt-1 border-t border-[#e4dfd2] flex items-center justify-between font-semibold">
              <span>DISCLAIMER: ACOUSTIC SIMILARITY INDEX</span>
              <button
                onClick={() => {
                  const dump = JSON.stringify(activeResult || probs, null, 2);
                  navigator.clipboard.writeText(dump);
                  alert('Telemetry JSON copied to clipboard.');
                }}
                className="text-[#18181a] hover:underline font-bold"
              >
                [COPY TELEMETRY JSON]
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Panoramic Chrono-Acoustic Emotion Trajectory Timeline */}
      <ChronoEmotionTimeline
        activeResult={activeResult}
        currentTime={currentTime}
        duration={duration}
        onSeekTime={(t) => {
          if (audioRef.current) {
            audioRef.current.currentTime = t;
            setCurrentTime(t);
          }
        }}
      />
    </div>
  );
};
