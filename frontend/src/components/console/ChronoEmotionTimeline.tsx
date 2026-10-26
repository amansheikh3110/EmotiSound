import React, { useRef, useEffect, useState } from 'react';
import { AnalysisResult, TemporalTelemetry } from '../../types/analysis';

interface ChronoEmotionTimelineProps {
  activeResult: AnalysisResult | null;
  currentTime: number;
  duration: number;
  onSeekTime?: (timeSec: number) => void;
}

type TimelineViewMode = 'all' | 'affect' | 'pitch' | 'segments';

const EMOTION_COLOR_MAP: Record<string, string> = {
  neutral: '#71717a',
  calm: '#0284c7',
  happy: '#16a34a',
  sad: '#4f46e5',
  angry: '#dc2626',
  fearful: '#9333ea',
  disgust: '#0d9488',
  surprised: '#ea580c',
};

export const ChronoEmotionTimeline: React.FC<ChronoEmotionTimelineProps> = ({
  activeResult,
  currentTime,
  duration,
  onSeekTime,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setViewMode] = useState<TimelineViewMode>('all');
  const [hoverData, setHoverData] = useState<{
    x: number;
    time: number;
    valence: number;
    arousal: number;
    pitch: number;
    energy: number;
    emotion: string;
  } | null>(null);

  const telemetry: TemporalTelemetry | undefined = activeResult?.visualization?.temporal_telemetry;
  const maxDuration = activeResult?.visualization?.time_duration_sec || duration || 4.0;

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 260;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Instrument screen background (dark recessed hardware glass)
    ctx.fillStyle = '#08090c';
    ctx.fillRect(0, 0, w, h);

    const padLeft = 55;
    const padRight = 20;
    const padTop = 15;
    const padBottom = 26;
    const plotW = Math.max(10, w - padLeft - padRight);
    const plotH = Math.max(10, h - padTop - padBottom);

    // If no active result / standby mode
    if (!telemetry || !activeResult) {
      // Draw Standby Reticle Grid
      ctx.strokeStyle = '#181a22';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const y = padTop + (i / 5) * plotH;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + plotW, y);
        ctx.stroke();
      }
      for (let i = 1; i <= 5; i++) {
        const x = padLeft + (i / 6) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, padTop + plotH);
        ctx.stroke();
      }

      ctx.fillStyle = '#484d5d';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        '// CHRONO-TELEMETRY STANDBY: SELECT PRESET OR INGEST AUDIO TO MAP TEMPORAL TRAJECTORY //',
        padLeft + plotW / 2,
        padTop + plotH / 2
      );
      return;
    }

    const {
      timestamps,
      valence_trajectory,
      arousal_trajectory,
      pitch_contour_hz,
      energy_contour,
      segments,
    } = telemetry;

    const nPts = timestamps.length;
    if (nPts < 2) return;

    // Helper: Map time to X coordinate
    const getX = (t: number) => padLeft + (t / maxDuration) * plotW;

    // 1. Grid lines and horizontal sub-track dividers
    ctx.strokeStyle = '#161820';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = padTop + (i / 5) * plotH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();
    }

    // Lane boundaries
    const ribbonH = 24;
    const ribbonY = padTop;
    const mainPlotY = ribbonY + ribbonH + 8;
    const mainPlotH = plotH - ribbonH - 8;

    // 2. Track 1: Discrete Emotion Temporal Ribbon Bar
    if (viewMode === 'all' || viewMode === 'segments') {
      segments.forEach((seg) => {
        const xStart = Math.max(padLeft, getX(seg.start_sec));
        const xEnd = Math.min(padLeft + plotW, getX(seg.end_sec));
        const segW = Math.max(2, xEnd - xStart);
        const col = EMOTION_COLOR_MAP[seg.emotion.toLowerCase()] || '#71717a';

        // Solid color block
        ctx.fillStyle = col;
        ctx.fillRect(xStart, ribbonY, segW, ribbonH);

        // Border
        ctx.strokeStyle = '#08090c';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(xStart, ribbonY, segW, ribbonH);

        // Segment label if wide enough
        if (segW > 60) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          const label = `[${seg.emotion.toUpperCase()}] ${seg.start_sec.toFixed(1)}s-${seg.end_sec.toFixed(1)}s`;
          ctx.fillText(label, xStart + 6, ribbonY + 15);
        }
      });
    }

    // Valence-Arousal baseline midline
    const midY = mainPlotY + mainPlotH * 0.45;
    ctx.strokeStyle = '#252936';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padLeft, midY);
    ctx.lineTo(padLeft + plotW, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Track 2: Acoustic Energy & Tension Area (Stepped VU profile at bottom)
    if (viewMode === 'all') {
      const energyBottomY = mainPlotY + mainPlotH;
      const energyMaxH = mainPlotH * 0.35;
      ctx.fillStyle = '#1c1e2b';

      for (let i = 0; i < nPts; i++) {
        const x = getX(timestamps[i]);
        const nextX = i < nPts - 1 ? getX(timestamps[i + 1]) : x + 2;
        const bw = Math.max(1, nextX - x);
        const val = energy_contour[i] || 0;
        const bh = val * energyMaxH;

        ctx.fillRect(x, energyBottomY - bh, bw, bh);
      }
    }

    // 4. Track 3: Pitch Contour Trace (Cyan Line)
    if (viewMode === 'all' || viewMode === 'pitch') {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const minPitch = 70;
      const maxPitch = 450;

      for (let i = 0; i < nPts; i++) {
        const x = getX(timestamps[i]);
        const p = Math.max(minPitch, Math.min(maxPitch, pitch_contour_hz[i] || 150));
        const pNorm = (p - minPitch) / (maxPitch - minPitch);
        const y = (mainPlotY + mainPlotH) - (pNorm * mainPlotH * 0.75);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 5. Track 4: Valence Dynamic Trace (Emerald to Crimson)
    if (viewMode === 'all' || viewMode === 'affect') {
      ctx.lineWidth = 2.5;

      for (let i = 0; i < nPts - 1; i++) {
        const x1 = getX(timestamps[i]);
        const v1 = valence_trajectory[i] || 0;
        const y1 = midY - (v1 * mainPlotH * 0.40);

        const x2 = getX(timestamps[i + 1]);
        const v2 = valence_trajectory[i + 1] || 0;
        const y2 = midY - (v2 * mainPlotH * 0.40);

        ctx.strokeStyle = v1 >= 0 ? '#10b981' : '#ef4444';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // 6. Track 5: Arousal Intensity Trace (Warm Amber)
    if (viewMode === 'all' || viewMode === 'affect') {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      for (let i = 0; i < nPts; i++) {
        const x = getX(timestamps[i]);
        const a = arousal_trajectory[i] || 0;
        const y = midY - (a * mainPlotH * 0.40);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 7. Tactical Playhead (Synchronized to Audio Player)
    if (currentTime > 0 && maxDuration > 0) {
      const playheadX = getX(Math.min(currentTime, maxDuration));
      
      // Playhead vertical laser line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, padTop);
      ctx.lineTo(playheadX, padTop + plotH);
      ctx.stroke();

      // Top triangle flag
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(playheadX - 5, padTop);
      ctx.lineTo(playheadX + 5, padTop);
      ctx.lineTo(playheadX, padTop + 8);
      ctx.closePath();
      ctx.fill();
    }

    // 8. Hover Crosshair & Dynamic Probe Indicator
    if (hoverData) {
      ctx.strokeStyle = '#ffffff';
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hoverData.x, padTop);
      ctx.lineTo(hoverData.x, padTop + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 9. Axes, Ticks, and Scale Labels
    ctx.strokeStyle = '#282b37';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.lineTo(padLeft + plotW, padTop + plotH);
    ctx.stroke();

    // Vertical Time Ticks
    ctx.fillStyle = '#83889b';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';

    const numTicks = 6;
    for (let i = 0; i <= numTicks; i++) {
      const frac = i / numTicks;
      const t = frac * maxDuration;
      const x = padLeft + frac * plotW;
      ctx.fillText(`${t.toFixed(2)}s`, x, padTop + plotH + 15);

      ctx.beginPath();
      ctx.moveTo(x, padTop + plotH);
      ctx.lineTo(x, padTop + plotH + 4);
      ctx.stroke();
    }

    // Left Y-Axis Scale Markers
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('+1.0 A', padLeft - 6, midY - mainPlotH * 0.36);
    ctx.fillStyle = '#83889b';
    ctx.fillText(' 0.0 N', padLeft - 6, midY + 3);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('-1.0 V', padLeft - 6, midY + mainPlotH * 0.38);

  }, [activeResult, telemetry, currentTime, duration, viewMode, hoverData, maxDuration]);

  // Handle Mouse Hover / Probe
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !telemetry) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padLeft = 55;
    const padRight = 20;
    const plotW = rect.width - padLeft - padRight;

    if (x < padLeft || x > padLeft + plotW) {
      setHoverData(null);
      return;
    }

    const ratio = Math.max(0, Math.min(1, (x - padLeft) / plotW));
    const time = ratio * maxDuration;

    const { timestamps, valence_trajectory, arousal_trajectory, pitch_contour_hz, energy_contour, dominant_emotion_per_frame } = telemetry;
    const idx = Math.min(
      timestamps.length - 1,
      Math.max(0, Math.floor(ratio * (timestamps.length - 1)))
    );

    setHoverData({
      x,
      time,
      valence: valence_trajectory[idx] || 0,
      arousal: arousal_trajectory[idx] || 0,
      pitch: pitch_contour_hz[idx] || 0,
      energy: energy_contour[idx] || 0,
      emotion: dominant_emotion_per_frame[idx] || activeResult?.predicted_emotion || 'neutral',
    });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  // Handle Click / Seek Audio
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onSeekTime) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padLeft = 55;
    const padRight = 20;
    const plotW = rect.width - padLeft - padRight;

    if (x >= padLeft && x <= padLeft + plotW) {
      const ratio = Math.max(0, Math.min(1, (x - padLeft) / plotW));
      const seekSec = ratio * maxDuration;
      onSeekTime(seekSec);
    }
  };

  const summary = telemetry?.summary;

  return (
    <div className="bg-[#f6f5f0] border border-[#d4cfc0] p-4 flex flex-col gap-3 font-mono text-xs select-none text-[#18181a] shadow-sm">
      {/* Top Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 border-b border-[#e4dfd2] gap-2">
        <div className="flex flex-col">
          <span className="font-black text-[#18181a] uppercase text-[12px] tracking-wide flex items-center gap-2">
            CHRONO-ACOUSTIC EMOTION TRAJECTORY // MULTI-LAYER TIME-SERIES TELEMETRY
          </span>
          <span className="text-[10px] text-[#706c62]">
            SYNCHRONIZED AUDITORY KINEMATICS • TIME DOMAIN [0.00s — {(maxDuration).toFixed(2)}s] • CLICK TO SCRUB
          </span>
        </div>

        {/* View Mode Filters */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-[#706c62] mr-1 font-bold uppercase">VIEW:</span>
          {(['all', 'affect', 'pitch', 'segments'] as TimelineViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2 py-0.5 text-[10px] font-bold uppercase border transition-colors ${
                viewMode === mode
                  ? 'bg-[#18181a] text-[#f6f5f0] border-[#18181a]'
                  : 'bg-[#ede9df] text-[#555] border-[#d4cfc0] hover:bg-[#e4dfd2]'
              }`}
            >
              [{mode}]
            </button>
          ))}
        </div>
      </div>

      {/* 5 Hardware Readout Chips */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="bg-[#ede9df] border border-[#d8d3c5] p-2 flex flex-col">
          <span className="text-[9px] text-[#706c62] font-bold uppercase">TRAJECTORY PROFILE:</span>
          <span className="text-[11px] font-black text-[#18181a] truncate">
            {summary ? summary.emotional_trajectory_type : '-- STANDBY --'}
          </span>
        </div>

        <div className="bg-[#ede9df] border border-[#d8d3c5] p-2 flex flex-col">
          <span className="text-[9px] text-[#706c62] font-bold uppercase">AFFECTIVE POLARITY:</span>
          <span className="text-[11px] font-black text-[#18181a]">
            {summary
              ? `V: ${summary.mean_valence >= 0 ? '+' : ''}${summary.mean_valence.toFixed(2)} / A: ${summary.mean_arousal >= 0 ? '+' : ''}${summary.mean_arousal.toFixed(2)}`
              : '-- / --'}
          </span>
        </div>

        <div className="bg-[#ede9df] border border-[#d8d3c5] p-2 flex flex-col">
          <span className="text-[9px] text-[#706c62] font-bold uppercase">MEAN VOCAL PITCH:</span>
          <span className="text-[11px] font-black text-[#0284c7]">
            {summary ? `${summary.mean_pitch_hz} HZ (±${summary.pitch_dynamics_hz})` : '-- HZ'}
          </span>
        </div>

        <div className="bg-[#ede9df] border border-[#d8d3c5] p-2 flex flex-col">
          <span className="text-[9px] text-[#706c62] font-bold uppercase">DYNAMIC RANGE:</span>
          <span className="text-[11px] font-black text-[#18181a]">
            {summary ? `${summary.dynamic_range_db} DB [${summary.peak_intensity_db} MAX]` : '-- DB'}
          </span>
        </div>

        <div className="bg-[#ede9df] border border-[#d8d3c5] p-2 flex flex-col">
          <span className="text-[9px] text-[#706c62] font-bold uppercase">TEMPORAL PHASES:</span>
          <span className="text-[11px] font-black text-emerald-700">
            {telemetry ? `${telemetry.segments.length} ACOUSTIC SEGMENTS` : '-- READY --'}
          </span>
        </div>
      </div>

      {/* Recessed Panoramic Screen */}
      <div
        ref={containerRef}
        className="relative border border-[#22242c] bg-[#08090c] cursor-crosshair overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '240px' }}
          className="w-full block"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />

        {/* Hover Inspector HUD Pill */}
        {hoverData && (
          <div
            className="absolute top-2 pointer-events-none bg-[#14161f] border border-[#3b4252] text-[#f0f2f7] p-2 shadow-xl z-20 flex items-center gap-3 text-[10px]"
            style={{
              left: Math.min(
                Math.max(10, hoverData.x - 120),
                (containerRef.current?.clientWidth || 600) - 280
              ),
            }}
          >
            <div className="flex flex-col">
              <span className="text-[#888e9f] text-[9px] uppercase font-bold">TIME:</span>
              <span className="font-mono text-emerald-400 font-bold">{hoverData.time.toFixed(2)}s</span>
            </div>
            <div className="flex flex-col border-l border-[#2e3440] pl-2">
              <span className="text-[#888e9f] text-[9px] uppercase font-bold">PHASE:</span>
              <span
                className="font-bold uppercase"
                style={{ color: EMOTION_COLOR_MAP[hoverData.emotion.toLowerCase()] || '#fff' }}
              >
                [{hoverData.emotion}]
              </span>
            </div>
            <div className="flex flex-col border-l border-[#2e3440] pl-2">
              <span className="text-[#888e9f] text-[9px] uppercase font-bold">VALENCE:</span>
              <span className={hoverData.valence >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {hoverData.valence >= 0 ? '+' : ''}{hoverData.valence.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col border-l border-[#2e3440] pl-2">
              <span className="text-[#888e9f] text-[9px] uppercase font-bold">AROUSAL:</span>
              <span className="text-amber-400 font-bold">
                {hoverData.arousal >= 0 ? '+' : ''}{hoverData.arousal.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col border-l border-[#2e3440] pl-2">
              <span className="text-[#888e9f] text-[9px] uppercase font-bold">PITCH F0:</span>
              <span className="text-cyan-400 font-bold">{hoverData.pitch.toFixed(0)} Hz</span>
            </div>
          </div>
        )}
      </div>

      {/* Hardware Legend & Circumplex Guide Strip */}
      <div className="flex flex-wrap items-center justify-between pt-1 gap-2 text-[10px]">
        {/* Track Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-1 bg-[#10b981]" />
            <span className="text-[#10b981]">VALENCE (PLEASURE)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-1 bg-[#f59e0b]" />
            <span className="text-[#f59e0b]">AROUSAL (ACTIVATION)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-1 bg-[#06b6d4]" />
            <span className="text-[#06b6d4]">PITCH F0 (HZ)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-1 bg-[#1c1e2b] border border-[#444]" />
            <span className="text-[#706c62]">RMS ENERGY</span>
          </div>
        </div>

        {/* 8-Class Color Indicators */}
        <div className="flex items-center gap-1 text-[9px] text-[#555] font-semibold">
          <span className="text-[#888] mr-1">EMOTIONS:</span>
          {Object.entries(EMOTION_COLOR_MAP).map(([emo, color]) => (
            <span
              key={emo}
              className="px-1.5 py-0.5 text-white font-bold uppercase rounded-none text-[8px]"
              style={{ backgroundColor: color }}
            >
              {emo.slice(0, 3)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
