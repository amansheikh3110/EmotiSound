import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  Trash2,
  ExternalLink,
  Filter,
  Search,
  Clock,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { api } from '../api/endpoints';
import { HistoryRecord, AnalysisResult } from '../types/analysis';
import { TabId } from '../components/layout/Sidebar';

interface HistoryProps {
  onNavigateToResult: (result: AnalysisResult) => void;
  onNavigate: (tab: TabId) => void;
}

const EMOTION_OPTIONS = [
  'All',
  'neutral',
  'calm',
  'happy',
  'sad',
  'angry',
  'fearful',
  'disgust',
  'surprised',
];

export const History: React.FC<HistoryProps> = ({
  onNavigateToResult,
  onNavigate,
}) => {
  const [historyItems, setHistoryItems] = useState<HistoryRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedEmotion, setSelectedEmotion] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const emo = selectedEmotion === 'All' ? undefined : selectedEmotion;
      const data = await api.getHistory(50, 0, emo);
      setHistoryItems(data.items);
      setTotalCount(data.total);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedEmotion]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this analysis record from SQLite storage?')) return;

    setDeletingId(id);
    try {
      await api.deleteHistoryRecord(id);
      setHistoryItems((prev) => prev.filter((item) => item.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to delete history record:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenRecord = (record: HistoryRecord) => {
    const syntheticResult: AnalysisResult = {
      id: record.id,
      created_at: record.created_at,
      predicted_emotion: record.predicted_emotion,
      confidence: record.confidence,
      probabilities: record.probabilities,
      filename: record.filename,
      audio_metadata: record.audio_metadata,
      inference_duration_ms: 120,
      model_info: {
        name: 'EmotiSoundCNN',
        version: record.model_version,
        classes_count: 8,
      },
      disclaimer: 'This historical record stores acoustic prediction metadata from past session inference.',
    };

    onNavigateToResult(syntheticResult);
  };

  const filteredItems = historyItems.filter((item) => {
    if (!searchQuery) return true;
    return item.filename.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
            Analysis History Log
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Persisted SQLite records of acoustic inference sessions.
          </p>
        </div>

        <div className="text-xs font-mono text-text-muted">
          Total Logged: {totalCount} Records
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by filename..."
            className="w-full bg-card border border-border rounded-md pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        {/* Emotion filter buttons */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mr-1" />
          {EMOTION_OPTIONS.map((emo) => (
            <button
              key={emo}
              onClick={() => setSelectedEmotion(emo)}
              className={`text-[11px] font-mono px-2 py-1 rounded-sm capitalize whitespace-nowrap transition-colors duration-150 border ${
                selectedEmotion === emo
                  ? 'bg-zinc-100 text-zinc-950 font-bold border-zinc-100'
                  : 'bg-card border-border text-text-secondary hover:text-text-primary hover:bg-zinc-900'
              }`}
            >
              {emo}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-text-muted">
          Loading SQLite records...
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <HistoryIcon className="w-8 h-8 text-text-muted mb-2.5" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">No Inferences Logged</h3>
          <p className="text-xs text-text-secondary max-w-sm mb-4">
            {searchQuery || selectedEmotion !== 'All'
              ? 'No records match the current filter query.'
              : 'Uploaded recordings will be automatically catalogued in local SQLite database.'}
          </p>
          <Button size="sm" onClick={() => onNavigate('analyze')}>
            Analyze Audio
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenRecord(item)}
              className="p-3 bg-card border border-border hover:border-zinc-700 rounded-md flex items-center justify-between gap-4 cursor-pointer transition-colors duration-150"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Badge emotion={item.predicted_emotion} size="sm" />

                <div className="overflow-hidden">
                  <h4 className="text-xs font-medium text-text-primary truncate" title={item.filename}>
                    {item.filename}
                  </h4>
                  <div className="flex items-center gap-2.5 text-[10px] font-mono text-text-muted mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" /> {item.audio_metadata?.original_duration?.toFixed(2)}s
                    </span>
                    <span>•</span>
                    <span>{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-zinc-100">
                    {(item.confidence * 100).toFixed(1)}%
                  </span>
                  <p className="text-[10px] font-mono text-text-muted">Confidence</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenRecord(item)}
                    className="p-1.5 text-text-secondary hover:text-text-primary rounded-md hover:bg-zinc-800 transition-colors"
                    title="View Details"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    disabled={deletingId === item.id}
                    className="p-1.5 text-text-secondary hover:text-rose-400 rounded-md hover:bg-zinc-800 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
