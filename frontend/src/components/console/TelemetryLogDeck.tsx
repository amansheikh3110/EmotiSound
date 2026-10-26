import React, { useState, useEffect } from 'react';
import { api } from '../../api/endpoints';
import { HistoryRecord, AnalysisResult } from '../../types/analysis';

interface TelemetryLogDeckProps {
  onLoadRecord: (result: AnalysisResult) => void;
}

const EMOTION_FILTERS = ['ALL', 'neutral', 'calm', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised'];

export const TelemetryLogDeck: React.FC<TelemetryLogDeckProps> = ({
  onLoadRecord,
}) => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filterEmotion, setFilterEmotion] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const emo = filterEmotion === 'ALL' ? undefined : filterEmotion;
      const data = await api.getHistory(50, 0, emo);
      setRecords(data.items);
      setTotalCount(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterEmotion]);

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete SQLite record ID: ${id}?`)) return;
    try {
      await api.deleteHistoryRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleInspect = (record: HistoryRecord) => {
    const synthetic: AnalysisResult = {
      id: record.id,
      created_at: record.created_at,
      predicted_emotion: record.predicted_emotion,
      confidence: record.confidence,
      probabilities: record.probabilities,
      filename: record.filename,
      audio_metadata: record.audio_metadata,
      inference_duration_ms: 112,
      model_info: {
        name: 'EmotiSoundCNN',
        version: record.model_version,
        classes_count: 8,
      },
      disclaimer: 'Stored SQLite session record.',
    };
    onLoadRecord(synthetic);
  };

  const filtered = records.filter((r) => {
    if (!searchQuery) return true;
    return r.filename.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-3 font-mono text-xs select-none text-[#18181a]">
      {/* Header & Filter Controls */}
      <div className="bg-[#f6f5f0] border border-[#d4cfc0] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="font-bold text-[#18181a] uppercase text-[11px] block">
            SQLITE INFERENCE TELEMETRY LOG
          </span>
          <span className="text-[10px] text-[#706c62] font-semibold">
            DATABASE: INSTANCE/EMOTISOUND.DB • TOTAL CATALOGUED: {totalCount} RECORDS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER FILENAME..."
            className="px-2.5 py-1 bg-[#ede9df] border border-[#d2ccc0] text-[#18181a] text-[10px] uppercase placeholder:text-[#8a867c] focus:outline-none focus:border-[#18181a]"
          />

          <div className="flex items-center gap-1 overflow-x-auto">
            {EMOTION_FILTERS.map((emo) => (
              <button
                key={emo}
                onClick={() => setFilterEmotion(emo)}
                className={`px-2 py-0.5 text-[10px] uppercase font-bold border transition-colors ${
                  filterEmotion === emo
                    ? 'bg-[#18181a] text-[#f7f6f2] border-[#18181a]'
                    : 'bg-[#ded9cc] text-[#2c2a24] border-[#c0b9a8] hover:bg-[#cfc9b9] hover:text-black'
                }`}
              >
                {emo.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#f6f5f0] border border-[#d4cfc0] overflow-x-auto">
        <table className="w-full text-left text-[11px] border-collapse font-mono">
          <thead>
            <tr className="border-b border-[#d8d3c5] text-[10px] text-[#5c584f] bg-[#ede9df]">
              <th className="py-2 px-3">RECORD_ID</th>
              <th className="py-2 px-3">TIMESTAMP</th>
              <th className="py-2 px-3">FILENAME</th>
              <th className="py-2 px-3">PREDICTED_CLASS</th>
              <th className="py-2 px-3">CONFIDENCE</th>
              <th className="py-2 px-3">DURATION</th>
              <th className="py-2 px-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4dfd2]">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-[#706c62]">
                  READING SQLITE ENTRIES...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-[#706c62]">
                  NO TELEMETRY RECORDS FOUND FOR GIVEN QUERY
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#ede9df] transition-colors">
                  <td className="py-1.5 px-3 text-[#706c62] font-mono text-[10px]">
                    {item.id.substring(0, 8)}...
                  </td>
                  <td className="py-1.5 px-3 text-[#5c584f] text-[10px]">
                    {new Date(item.created_at).toISOString().replace('T', ' ').substring(0, 19)}
                  </td>
                  <td className="py-1.5 px-3 font-bold text-[#18181a]">
                    {item.filename}
                  </td>
                  <td className="py-1.5 px-3">
                    <span className="px-1.5 py-0.5 bg-[#ede9df] border border-[#d2ccc0] text-[#18181a] font-bold uppercase text-[10px]">
                      {item.predicted_emotion}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 font-bold text-[#18181a]">
                    {(item.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-1.5 px-3 text-[#5c584f]">
                    {item.audio_metadata?.original_duration?.toFixed(2)}s
                  </td>
                  <td className="py-1.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleInspect(item)}
                        className="px-2 py-0.5 bg-[#ded9cc] text-[#18181a] border border-[#c4beaf] hover:bg-[#cfc9b9] uppercase text-[10px] font-bold"
                      >
                        [LOAD]
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-2 py-0.5 bg-[#fbe9e8] text-[#dc2626] border border-[#f5c6c4] hover:bg-[#f7d0cf] uppercase text-[10px] font-bold"
                      >
                        [DEL]
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
