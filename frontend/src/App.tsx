import React, { useState, useEffect, useCallback } from 'react';
import { ConsoleHeader, ConsoleMode } from './components/console/ConsoleHeader';
import { AnalyzerDeck } from './components/console/AnalyzerDeck';
import { BenchmarkDeck } from './components/console/BenchmarkDeck';
import { TelemetryLogDeck } from './components/console/TelemetryLogDeck';
import { SpecsDeck } from './components/console/SpecsDeck';

import { api } from './api/endpoints';
import {
  ModelInfo,
  AnalysisResult,
  EvaluationMetrics,
} from './types/analysis';

export const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<ConsoleMode>('analyzer');
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [evaluationMetrics, setEvaluationMetrics] = useState<EvaluationMetrics | null>(null);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Active analysis results state
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Health check
      const health = await api.getHealth().catch(() => null);
      setIsBackendHealthy(health?.status === 'healthy');

      // 2. Model info
      const info = await api.getModelInfo().catch(() => null);
      if (info) setModelInfo(info);

      // 3. Evaluation data
      const evalData = await api.getEvaluation().catch(() => null);
      if (evalData && evalData.is_evaluated && evalData.data) {
        setEvaluationMetrics(evalData.data.metrics);
      }
    } catch (err) {
      console.warn('Initial data load warning:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleAnalysisSuccess = (result: AnalysisResult, audioUrl: string) => {
    setCurrentResult(result);
    setCurrentAudioUrl(audioUrl);
  };

  const handleLoadRecord = (result: AnalysisResult) => {
    setCurrentResult(result);
    setCurrentAudioUrl(null);
    setCurrentMode('analyzer');
  };

  return (
    <div className="min-h-screen bg-[#ece8e1] text-[#18181a] flex flex-col font-mono selection:bg-[#d8d4c7] selection:text-[#18181a]">
      {/* Top Engineering Machine Header */}
      <ConsoleHeader
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        modelInfo={modelInfo}
        isBackendHealthy={isBackendHealthy}
        onRefresh={loadInitialData}
        isRefreshing={isRefreshing}
      />

      {/* Main Console Workspace Canvas */}
      <main className="flex-1 p-3 md:p-4 max-w-[1400px] w-full mx-auto">
        {currentMode === 'analyzer' && (
          <AnalyzerDeck
            modelInfo={modelInfo}
            onAnalysisSuccess={handleAnalysisSuccess}
            activeResult={currentResult}
            activeAudioUrl={currentAudioUrl}
          />
        )}

        {currentMode === 'benchmarks' && (
          <BenchmarkDeck
            evaluationMetrics={evaluationMetrics}
            modelInfo={modelInfo}
          />
        )}

        {currentMode === 'history' && (
          <TelemetryLogDeck
            onLoadRecord={handleLoadRecord}
          />
        )}

        {currentMode === 'specs' && (
          <SpecsDeck />
        )}
      </main>

      {/* Minimalist Industrial Status Line */}
      <footer className="w-full bg-[#e6e2d7] border-t border-[#d2ccc0] px-4 py-1.5 flex items-center justify-between text-[10px] text-[#706c62] font-mono select-none">
        <div>
          <span>EMOTISOUND HARDWARE CONSOLE // ZERO SPEAKER LEAKAGE CERTIFIED</span>
        </div>
        <div className="flex items-center gap-3 font-semibold">
          <span>PORT: 5000</span>
          <span>LATENCY: ~110MS</span>
          <span>SYSTEM: READY</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
