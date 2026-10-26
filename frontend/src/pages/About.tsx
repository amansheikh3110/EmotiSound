import React from 'react';
import {
  Code,
  Database,
  Cpu,
  Layers,
  BookOpen,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { Card } from '../components/common/Card';

export const About: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-sm bg-zinc-900 border border-border text-[11px] font-mono font-medium text-zinc-300 mb-2">
          <Terminal className="w-3 h-3 text-zinc-400" /> Architecture & Methodology
        </div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-text-primary">
          EmotiSound Architecture Specifications
        </h1>
        <p className="text-xs md:text-sm text-text-secondary mt-1 leading-relaxed">
          Deep learning speech emotion classifier utilizing PyTorch 2D Convolutional Neural Networks on log-Mel spectrogram acoustic features.
        </p>
      </div>

      {/* End-to-End Pipeline Diagram */}
      <Card className="p-5 flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-text-primary flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-300" /> End-to-End Deep Learning Pipeline
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-center">
          <div className="p-3 bg-zinc-900 border border-border rounded-md flex flex-col items-center gap-1.5">
            <span className="w-6 h-6 rounded-sm bg-zinc-800 text-zinc-200 font-bold text-xs flex items-center justify-center font-mono">
              1
            </span>
            <p className="text-xs font-bold text-text-primary">Audio Ingestion</p>
            <p className="text-[11px] font-mono text-text-muted leading-tight">
              Waveform validation, mono downmix, 16 kHz resample
            </p>
          </div>

          <div className="p-3 bg-zinc-900 border border-border rounded-md flex flex-col items-center gap-1.5">
            <span className="w-6 h-6 rounded-sm bg-zinc-800 text-zinc-200 font-bold text-xs flex items-center justify-center font-mono">
              2
            </span>
            <p className="text-xs font-bold text-text-primary">Conditioning</p>
            <p className="text-[11px] font-mono text-text-muted leading-tight">
              4.0s fixed duration (64,000 samples) zero-pad or crop
            </p>
          </div>

          <div className="p-3 bg-zinc-900 border border-border rounded-md flex flex-col items-center gap-1.5">
            <span className="w-6 h-6 rounded-sm bg-zinc-800 text-zinc-200 font-bold text-xs flex items-center justify-center font-mono">
              3
            </span>
            <p className="text-xs font-bold text-text-primary">Log-Mel Extraction</p>
            <p className="text-[11px] font-mono text-text-muted leading-tight">
              128 Mel bins, 1024 FFT, 256 hop &rarr; (1, 128, 251)
            </p>
          </div>

          <div className="p-3 bg-zinc-900 border border-border rounded-md flex flex-col items-center gap-1.5">
            <span className="w-6 h-6 rounded-sm bg-zinc-800 text-zinc-200 font-bold text-xs flex items-center justify-center font-mono">
              4
            </span>
            <p className="text-xs font-bold text-text-primary">CNN Classification</p>
            <p className="text-[11px] font-mono text-text-muted leading-tight">
              4 Conv Blocks, Adaptive Pooling, 8 Softmax logits
            </p>
          </div>
        </div>
      </Card>

      {/* 4 Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 flex flex-col gap-2.5">
          <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">1. PyTorch 2D CNN Architecture</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            4-stage 2D Convolutional Neural Network with 653,288 parameters. Employs 2D Batch Normalization, ReLU activations, Max-Pooling, Spatial Dropout (0.1–0.25), Adaptive Average Pooling to 2×2, and a Dense head with 35% dropout to prevent overfitting.
          </p>
        </Card>

        <Card className="p-6 flex flex-col gap-2.5">
          <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <Database className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">2. RAVDESS Speech Corpus & Splitting</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Utilizes 1,440 recordings from the official Ryerson Audio-Visual Database of Emotional Speech and Song. Evaluated with <strong>strict speaker independence</strong>: 16 training actors (960 samples), 4 validation actors (240 samples), and 4 testing actors (240 samples) with zero overlapping actors.
          </p>
        </Card>

        <Card className="p-5 flex flex-col gap-2.5">
          <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">3. Flask REST Backend & Persistence</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Modular REST API conforming to `/api/v1` conventions. Handles audio validation, singleton PyTorch model lifecycle, thread-safe inference under `torch.inference_mode()`, SQLite session persistence, and serving genuine evaluation artifacts.
          </p>
        </Card>

        <Card className="p-5 flex flex-col gap-2.5">
          <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <Code className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">4. Solid Minimalist Dashboard</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Engineered with React 18, Vite, TypeScript, and Tailwind CSS. Features HTML5 Canvas oscilloscope waveform scrubbing, log-Mel spectrogram heatmaps, discrete probability bars, and responsive sidebar navigation.
          </p>
        </Card>
      </div>

      {/* Tech Stack Specs Table */}
      <Card className="p-5 flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-text-primary flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-zinc-300" /> Technology Specifications
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="p-2.5 bg-zinc-900 border border-border rounded-md">
            <span className="text-text-muted block text-[10px] uppercase">Engine</span>
            <span className="text-text-primary font-bold">PyTorch 2.10</span>
          </div>
          <div className="p-2.5 bg-zinc-900 border border-border rounded-md">
            <span className="text-text-muted block text-[10px] uppercase">Acoustics</span>
            <span className="text-text-primary font-bold">Librosa 1.0</span>
          </div>
          <div className="p-2.5 bg-zinc-900 border border-border rounded-md">
            <span className="text-text-muted block text-[10px] uppercase">Audio I/O</span>
            <span className="text-text-primary font-bold">SoundFile 0.14</span>
          </div>
          <div className="p-2.5 bg-zinc-900 border border-border rounded-md">
            <span className="text-text-muted block text-[10px] uppercase">Backend</span>
            <span className="text-text-primary font-bold">Flask 3.1</span>
          </div>
          <div className="p-2.5 bg-zinc-900 border border-border rounded-md">
            <span className="text-text-muted block text-[10px] uppercase">Database</span>
            <span className="text-text-primary font-bold">SQLite 3</span>
          </div>
          <div className="p-2.5 bg-zinc-900 border border-border rounded-md">
            <span className="text-text-muted block text-[10px] uppercase">Frontend</span>
            <span className="text-text-primary font-bold">React 18 + Vite</span>
          </div>
          <div className="p-2.5 bg-zinc-900 border border-border rounded-md">
            <span className="text-text-muted block text-[10px] uppercase">Language</span>
            <span className="text-text-primary font-bold">TypeScript 5</span>
          </div>
          <div className="p-2.5 bg-zinc-900 border border-border rounded-md">
            <span className="text-text-muted block text-[10px] uppercase">Design System</span>
            <span className="text-text-primary font-bold">Solid Minimalist</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
