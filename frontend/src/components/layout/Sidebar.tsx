import React from 'react';
import {
  LayoutDashboard,
  Mic2,
  BarChart3,
  History,
  Info,
  Radio,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ModelInfo } from '../../types/analysis';

export type TabId = 'overview' | 'analyze' | 'results' | 'insights' | 'history' | 'about';

interface SidebarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  modelInfo: ModelInfo | null;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  modelInfo,
  isOpen,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'overview' as TabId, label: 'Overview', icon: LayoutDashboard },
    { id: 'analyze' as TabId, label: 'Analyze Audio', icon: Mic2 },
    { id: 'insights' as TabId, label: 'Model Insights', icon: BarChart3 },
    { id: 'history' as TabId, label: 'History Log', icon: History },
    { id: 'about' as TabId, label: 'Architecture', icon: Info },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-sidebar border-r border-border flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo brand */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
            <div className="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold flex-shrink-0">
              <Radio className="w-4 h-4 text-zinc-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-text-primary leading-tight">
                EmotiSound
              </h1>
              <span className="text-[10px] font-mono tracking-wider uppercase text-text-muted font-medium block">
                Acoustic Platform
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors duration-150 border ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Model Status Bottom Pill */}
        <div className="p-3 border-t border-border">
          <div className="p-2.5 bg-zinc-900 border border-border rounded-md flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 overflow-hidden">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  modelInfo?.is_ready ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <div className="overflow-hidden">
                <p className="text-[11px] font-semibold text-text-primary truncate">
                  {modelInfo?.is_ready ? 'CNN Ready' : 'Standby'}
                </p>
                <p className="text-[10px] font-mono text-text-muted truncate">
                  {modelInfo?.is_ready ? '8 Classes' : 'Offline'}
                </p>
              </div>
            </div>

            {modelInfo?.is_ready ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
