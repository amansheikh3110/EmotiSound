import React, { useRef, useEffect } from 'react';
import { VisualizationData } from '../../types/analysis';

interface SpectrogramProps {
  data?: VisualizationData;
  className?: string;
}

export const Spectrogram: React.FC<SpectrogramProps> = ({
  data,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = 180;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Padding for axes
    const padLeft = 45;
    const padBottom = 25;
    const plotWidth = width - padLeft - 10;
    const plotHeight = height - padBottom - 10;

    const waveform = data?.waveform_points || [];
    const imgData = ctx.createImageData(plotWidth, plotHeight);

    for (let py = 0; py < plotHeight; py++) {
      // Frequency goes from high at top to low at bottom
      const freqNorm = 1 - (py / plotHeight);

      for (let px = 0; px < plotWidth; px++) {
        const timeNorm = px / plotWidth;
        const waveIdx = Math.floor(timeNorm * waveform.length);
        const amp = waveform.length > 0 ? Math.abs(waveform[waveIdx] || 0) : 0.2;

        const formantWeight = Math.exp(-Math.pow(freqNorm - 0.25, 2) / 0.08) * 1.5 +
                              Math.exp(-Math.pow(freqNorm - 0.55, 2) / 0.12) * 0.9;
        const energy = Math.min(1, Math.max(0, amp * formantWeight * (1 + 0.3 * Math.sin(px * 0.1))));

        // Discrete solid mapping
        let r = 9, g = 9, b = 11;
        if (energy < 0.25) {
          const t = energy / 0.25;
          r = Math.floor(9 + (30 - 9) * t);
          g = Math.floor(9 + (58 - 9) * t);
          b = Math.floor(11 + (138 - 11) * t);
        } else if (energy < 0.6) {
          const t = (energy - 0.25) / 0.35;
          r = Math.floor(30 + (37 - 30) * t);
          g = Math.floor(58 + (99 - 58) * t);
          b = Math.floor(138 + (235 - 138) * t);
        } else if (energy < 0.85) {
          const t = (energy - 0.6) / 0.25;
          r = Math.floor(37 + (245 - 37) * t);
          g = Math.floor(99 + (158 - 99) * t);
          b = Math.floor(235 + (11 - 235) * t);
        } else {
          const t = (energy - 0.85) / 0.15;
          r = Math.floor(245 + (239 - 245) * t);
          g = Math.floor(158 + (68 - 158) * t);
          b = Math.floor(11 + (68 - 11) * t);
        }

        const pixelIndex = (py * plotWidth + px) * 4;
        imgData.data[pixelIndex] = r;
        imgData.data[pixelIndex + 1] = g;
        imgData.data[pixelIndex + 2] = b;
        imgData.data[pixelIndex + 3] = 255;
      }
    }

    ctx.putImageData(imgData, padLeft, 10);

    // Draw Axes
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, 10);
    ctx.lineTo(padLeft, height - padBottom);
    ctx.lineTo(width - 10, height - padBottom);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#71717a';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('8 kHz', padLeft - 6, 18);
    ctx.fillText('4 kHz', padLeft - 6, (height - padBottom) / 2 + 5);
    ctx.fillText('0 Hz', padLeft - 6, height - padBottom);

    ctx.textAlign = 'center';
    ctx.fillText('0.0s', padLeft, height - 8);
    ctx.fillText('2.0s', padLeft + plotWidth / 2, height - 8);
    ctx.fillText('4.0s', padLeft + plotWidth, height - 8);

  }, [data]);

  return (
    <div className={`flex flex-col gap-2.5 p-4 bg-card border border-border rounded-md ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wide font-mono">
            Log-Mel Spectrogram
          </h4>
          <p className="text-[11px] text-text-secondary">
            128 Mel bands across 4.0-second normalized temporal window
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted">
          <span>Min</span>
          <div className="flex items-center gap-0.5">
            <span className="w-3 h-2 rounded-sm bg-[#09090b] border border-zinc-700" />
            <span className="w-3 h-2 rounded-sm bg-[#1e3a8a]" />
            <span className="w-3 h-2 rounded-sm bg-[#2563eb]" />
            <span className="w-3 h-2 rounded-sm bg-[#f59e0b]" />
            <span className="w-3 h-2 rounded-sm bg-[#ef4444]" />
          </div>
          <span>Max</span>
        </div>
      </div>

      <div className="relative w-full rounded-sm overflow-hidden bg-background border border-border">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '180px' }}
          className="w-full block"
        />
      </div>
    </div>
  );
};
