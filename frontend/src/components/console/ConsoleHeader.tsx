import React from 'react';
import { ModelInfo } from '../../types/analysis';

export type ConsoleMode = 'analyzer' | 'benchmarks' | 'history' | 'specs';

interface ConsoleHeaderProps {
  currentMode: ConsoleMode;
  onSelectMode: (mode: ConsoleMode) => void;
  modelInfo: ModelInfo | null;
  isBackendHealthy: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const ConsoleHeader: React.FC<ConsoleHeaderProps> = ({
  currentMode,
  onSelectMode,
  modelInfo,
  isBackendHealthy,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="w-full bg-[#e6e2d7] border-b border-[#d2ccc0] px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono select-none text-[#18181a]">
      {/* Brand & Instrument ID */}
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-[#18181a] text-[#f7f6f2] font-black flex items-center justify-center text-[11px] rounded-none">
          EM
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-[#18181a] uppercase text-xs">
              EMOTISOUND // ACOUSTIC ANALYZER
            </span>
            <span className="text-[10px] text-[#706c62] font-mono">
              [REV-2.4.0]
            </span>
          </div>
          <p className="text-[10px] text-[#706c62] uppercase tracking-widest hidden sm:block">
            PYTORCH 2D-CNN • RAVDESS AUDIO CLASSIFIER
          </p>
        </div>
      </div>

      {/* Telemetry Hardware Badges */}
      <div className="hidden lg:flex items-center gap-2 text-[11px] text-[#4d4a42]">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#f0ece3] border border-[#d2ccc0]">
          <span className={`w-1.5 h-1.5 ${isBackendHealthy ? 'bg-emerald-600' : 'bg-rose-600'}`} />
          <span>API: {isBackendHealthy ? 'ONLINE' : 'CONNECTING'}</span>
        </div>

        <div className="px-2 py-0.5 bg-[#f0ece3] border border-[#d2ccc0]">
          <span>ENGINE: {modelInfo?.is_ready ? '2D-CNN READY' : 'STANDBY'}</span>
        </div>

        <div className="px-2 py-0.5 bg-[#f0ece3] border border-[#d2ccc0]">
          <span>FS: 16,000 HZ</span>
        </div>

        <div className="px-2 py-0.5 bg-[#f0ece3] border border-[#d2ccc0]">
          <span>WINDOW: 4.00S</span>
        </div>

        <div className="px-2 py-0.5 bg-[#f0ece3] border border-[#d2ccc0]">
          <span>WEIGHTS: 653K PARAMS</span>
        </div>
      </div>

      {/* Mode Switches */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onSelectMode('analyzer')}
          className={`px-3 py-1 text-[11px] uppercase tracking-wider font-semibold border transition-colors ${
            currentMode === 'analyzer'
              ? 'bg-[#18181a] text-[#f7f6f2] border-[#18181a]'
              : 'bg-[#dad5c7] text-[#2c2a24] border-[#c0b9a8] hover:bg-[#cfc9b9] hover:text-black'
          }`}
        >
          [ 01: ANALYZER ]
        </button>

        <button
          onClick={() => onSelectMode('benchmarks')}
          className={`px-3 py-1 text-[11px] uppercase tracking-wider font-semibold border transition-colors ${
            currentMode === 'benchmarks'
              ? 'bg-[#18181a] text-[#f7f6f2] border-[#18181a]'
              : 'bg-[#dad5c7] text-[#2c2a24] border-[#c0b9a8] hover:bg-[#cfc9b9] hover:text-black'
          }`}
        >
          [ 02: BENCHMARKS ]
        </button>

        <button
          onClick={() => onSelectMode('history')}
          className={`px-3 py-1 text-[11px] uppercase tracking-wider font-semibold border transition-colors ${
            currentMode === 'history'
              ? 'bg-[#18181a] text-[#f7f6f2] border-[#18181a]'
              : 'bg-[#dad5c7] text-[#2c2a24] border-[#c0b9a8] hover:bg-[#cfc9b9] hover:text-black'
          }`}
        >
          [ 03: TELEMETRY LOG ]
        </button>

        <button
          onClick={() => onSelectMode('specs')}
          className={`px-3 py-1 text-[11px] uppercase tracking-wider font-semibold border transition-colors ${
            currentMode === 'specs'
              ? 'bg-[#18181a] text-[#f7f6f2] border-[#18181a]'
              : 'bg-[#dad5c7] text-[#2c2a24] border-[#c0b9a8] hover:bg-[#cfc9b9] hover:text-black'
          }`}
        >
          [ 04: SPECS ]
        </button>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-2 py-1 bg-[#dad5c7] text-[#2c2a24] border border-[#c0b9a8] hover:bg-[#cfc9b9] hover:text-black transition-colors ml-1 font-semibold"
          title="Reload Hardware State"
        >
          {isRefreshing ? 'SYNC...' : 'SYNC'}
        </button>
      </div>
    </header>
  );
};
