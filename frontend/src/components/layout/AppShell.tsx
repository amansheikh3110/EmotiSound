import React, { useState } from 'react';
import { Sidebar, TabId } from './Sidebar';
import { Topbar } from './Topbar';
import { ModelInfo } from '../../types/analysis';

interface AppShellProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  modelInfo: ModelInfo | null;
  isBackendHealthy: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  modelInfo,
  isBackendHealthy,
  onRefresh,
  isRefreshing,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex text-text-primary">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        modelInfo={modelInfo}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Topbar
          currentTab={currentTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isBackendHealthy={isBackendHealthy}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
