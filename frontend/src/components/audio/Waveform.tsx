import React, { useRef, useEffect } from 'react';

interface WaveformProps {
  waveformPoints: number[];
  currentTime?: number;
  duration?: number;
  height?: number;
  className?: string;
  onSeek?: (ratio: number) => void;
}

export const Waveform: React.FC<WaveformProps> = ({
  waveformPoints,
  currentTime = 0,
  duration = 0,
  height = 80,
  className = '',
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = height;
    const midY = h / 2;

    ctx.clearRect(0, 0, w, h);

    if (!waveformPoints || waveformPoints.length === 0) {
      // Idle baseline
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1;
      ctx.stroke();
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

      const isPlayed = pointRatio <= playedRatio;

      // Solid color scheme: zinc-200 for played, zinc-800 for unplayed
      ctx.fillStyle = isPlayed ? '#e4e4e7' : '#27272a';

      ctx.fillRect(x, midY - barHeight / 2, barWidth, barHeight);
    }

    // Playhead indicator
    if (duration > 0 && currentTime > 0) {
      const playheadX = playedRatio * w;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [waveformPoints, currentTime, duration, height]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, clickX / rect.width));
    onSeek(ratio);
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-md bg-zinc-950 p-2 border border-zinc-800 ${className}`}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ width: '100%', height: `${height}px` }}
        className="w-full cursor-pointer block"
      />
    </div>
  );
};
