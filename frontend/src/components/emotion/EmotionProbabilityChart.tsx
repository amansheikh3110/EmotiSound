import React, { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Badge } from '../common/Badge';

interface EmotionProbabilityChartProps {
  probabilities: Record<string, number>;
  predictedEmotion: string;
}

const EMOTION_SOLID_HEX: Record<string, string> = {
  neutral: '#a1a1aa',
  calm: '#38bdf8',
  happy: '#fbbf24',
  sad: '#60a5fa',
  angry: '#f87171',
  fearful: '#c084fc',
  disgust: '#34d399',
  surprised: '#fb923c',
};

export const EmotionProbabilityChart: React.FC<EmotionProbabilityChartProps> = ({
  probabilities,
  predictedEmotion,
}) => {
  const [sortByProbability, setSortByProbability] = useState(true);

  const rawEntries = Object.entries(probabilities || {});

  const sortedEntries = [...rawEntries].sort((a, b) => {
    if (sortByProbability) {
      return b[1] - a[1];
    }
    return 0; // Canonical order
  });

  return (
    <div className="flex flex-col gap-4 p-5 bg-card border border-border rounded-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-text-primary">
            Posterior Probability Distribution
          </h3>
          <p className="text-[11px] text-text-secondary">
            Softmax output vector across 8 acoustic classes
          </p>
        </div>

        <button
          onClick={() => setSortByProbability(!sortByProbability)}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono rounded-sm bg-zinc-900 border border-border text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowUpDown className="w-3 h-3" />
          <span>{sortByProbability ? 'Sorted' : 'Default'}</span>
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {sortedEntries.map(([emotion, prob]) => {
          const isTop = emotion.toLowerCase() === predictedEmotion.toLowerCase();
          const percent = (prob * 100).toFixed(1);
          const barColor = EMOTION_SOLID_HEX[emotion.toLowerCase()] || '#a1a1aa';

          return (
            <div key={emotion} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge emotion={emotion} size="sm" />
                  {isTop && (
                    <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-zinc-950 bg-zinc-100 px-1 py-0.2 rounded-sm">
                      Top
                    </span>
                  )}
                </div>
                <span className={`font-mono text-xs ${isTop ? 'font-bold text-zinc-100' : 'text-text-secondary'}`}>
                  {percent}%
                </span>
              </div>

              {/* Bar track */}
              <div className="w-full h-2 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800">
                <div
                  className="h-full rounded-sm transition-all duration-300"
                  style={{
                    width: `${Math.max(1, prob * 100)}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-mono text-text-muted mt-1 border-t border-border pt-2.5">
        Acoustic logits evaluated deterministically via PyTorch inference pipeline.
      </p>
    </div>
  );
};
