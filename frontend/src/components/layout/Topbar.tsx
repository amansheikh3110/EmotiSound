import React from 'react';
import { Menu, Activity, RefreshCw } from 'lucide-react';
import { TabId } from './Sidebar';

interface TopbarProps {
  currentTab: TabId;
  onOpenMobileSidebar: () => void;
  isBackendHealthy: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const TAB_TITLES: Record<TabId, { title: string; subtitle: string }> = {
  overview: {
    title: 'Overview',
    subtitle: 'System status, architecture telemetry, and emotion classes',
  },
  analyze: {
    title: 'Analyze Voice Audio',
    subtitle: 'Extract 128-bin log-Mel spectrogram and classify emotion',
  },
  results: {
    title: 'Analysis Results',
    subtitle: 'Posterior class probabilities and acoustic spectrogram representation',
  },
  insights: {
    title: 'Model Evaluation',
    subtitle: 'Speaker-independent test metrics and confusion matrix',
  },
  history: {
    title: 'History Log',
    subtitle: 'Persistent SQLite records of previous inferences',
  },
  about: {
    title: 'Architecture & Pipeline',
    subtitle: 'PyTorch 2D CNN specifications and RAVDESS protocol',
  },
};

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  onOpenMobileSidebar,
  isBackendHealthy,
  onRefresh,
  isRefreshing = false,
}) => {
  const current = TAB_TITLES[currentTab] || {
    title: 'EmotiSound',
    subtitle: 'Speech Emotion Recognition Platform',
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-sidebar border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-1.5 -ml-2 text-text-secondary hover:text-text-primary lg:hidden rounded-md hover:bg-surface transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xs md:text-sm font-semibold text-text-primary tracking-tight leading-tight">
            {current.title}
          </h2>
          <p className="hidden sm:block text-[11px] text-text-muted leading-tight">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Backend health indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-border text-[11px]">
          <Activity className={`w-3 h-3 ${isBackendHealthy ? 'text-emerald-400' : 'text-red-400'}`} />
          <span className="font-mono text-text-secondary">
            {isBackendHealthy ? 'API Online' : 'Connecting'}
          </span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-text-secondary hover:text-text-primary rounded-md hover:bg-surface transition-colors duration-150 border border-transparent hover:border-border"
            title="Refresh application state"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-zinc-100' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
};
