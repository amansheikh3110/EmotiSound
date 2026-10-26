import React from 'react';

export const SpecsDeck: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 font-mono text-xs select-none text-[#18181a]">
      {/* Header */}
      <div className="bg-[#f6f5f0] border border-[#d4cfc0] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-bold text-[#18181a] uppercase text-[11px] block">
            SYSTEM ARCHITECTURE & HARDWARE DATASHEET // EMOTISOUND 2D-CNN
          </span>
          <span className="text-[10px] text-[#706c62] font-semibold">
            SPECIFICATION SHEET FOR ACADEMIC VIVA & TECHNICAL AUDIT
          </span>
        </div>

        <div className="text-[10px] px-2 py-0.5 bg-[#ede9df] border border-[#d2ccc0] text-[#18181a] font-bold">
          DOC ID: EMOTISOUND-SPEC-2026-V1
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Model Spec Table */}
        <div className="bg-[#f6f5f0] border border-[#d4cfc0] p-3 flex flex-col gap-2">
          <span className="font-bold text-[#18181a] uppercase text-[10px] border-b border-[#e4dfd2] pb-1">
            1.0 PYTORCH 2D-CNN LAYER SPECIFICATIONS
          </span>

          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-[#d8d3c5] text-[#5c584f] bg-[#ede9df]">
                <th className="py-1 px-2">STAGE</th>
                <th className="py-1 px-2">LAYER OPERATION</th>
                <th className="py-1 px-2">OUTPUT SHAPE</th>
                <th className="py-1 px-2 text-right">PARAMS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4dfd2] text-[#2c2a24]">
              <tr>
                <td className="py-1 px-2 text-[#706c62]">00</td>
                <td className="py-1 px-2 font-medium">Input Tensor</td>
                <td className="py-1 px-2 font-bold text-[#18181a]">(B, 1, 128, 251)</td>
                <td className="py-1 px-2 text-right">0</td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-[#706c62]">01</td>
                <td className="py-1 px-2">Conv2d(1&rarr;32, 3x3) + BN + ReLU + MaxPool + Drop(0.10)</td>
                <td className="py-1 px-2">(B, 32, 64, 125)</td>
                <td className="py-1 px-2 text-right font-mono">352</td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-[#706c62]">02</td>
                <td className="py-1 px-2">Conv2d(32&rarr;64, 3x3) + BN + ReLU + MaxPool + Drop(0.15)</td>
                <td className="py-1 px-2">(B, 64, 32, 62)</td>
                <td className="py-1 px-2 text-right font-mono">18,560</td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-[#706c62]">03</td>
                <td className="py-1 px-2">Conv2d(64&rarr;128, 3x3) + BN + ReLU + MaxPool + Drop(0.20)</td>
                <td className="py-1 px-2">(B, 128, 16, 31)</td>
                <td className="py-1 px-2 text-right font-mono">74,112</td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-[#706c62]">04</td>
                <td className="py-1 px-2">Conv2d(128&rarr;256, 3x3) + BN + ReLU + MaxPool + Drop(0.25)</td>
                <td className="py-1 px-2">(B, 256, 8, 15)</td>
                <td className="py-1 px-2 text-right font-mono">295,424</td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-[#706c62]">05</td>
                <td className="py-1 px-2">AdaptiveAvgPool2d((2, 2)) + Flatten</td>
                <td className="py-1 px-2">(B, 1024)</td>
                <td className="py-1 px-2 text-right font-mono">0</td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-[#706c62]">06</td>
                <td className="py-1 px-2">Linear(1024&rarr;256) + ReLU + Dropout(0.35)</td>
                <td className="py-1 px-2">(B, 256)</td>
                <td className="py-1 px-2 text-right font-mono">262,400</td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-[#706c62]">07</td>
                <td className="py-1 px-2">Linear(256&rarr;8) [Logits / Softmax]</td>
                <td className="py-1 px-2 font-bold text-emerald-800">(B, 8)</td>
                <td className="py-1 px-2 text-right font-mono">2,056</td>
              </tr>
              <tr className="bg-[#ede9df] font-bold text-[#18181a] border-t border-[#d8d3c5]">
                <td colSpan={3} className="py-1 px-2 uppercase">TOTAL TRAINABLE PARAMETERS</td>
                <td className="py-1 px-2 text-right font-mono text-emerald-800">653,288</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Acoustic DSP & Dataset Specs */}
        <div className="bg-[#f6f5f0] border border-[#d4cfc0] p-3 flex flex-col gap-2">
          <span className="font-bold text-[#18181a] uppercase text-[10px] border-b border-[#e4dfd2] pb-1">
            2.0 ACOUSTIC SIGNAL CONDITIONING & DSP PARAMETERS
          </span>

          <div className="flex flex-col gap-1.5 text-[10px] text-[#4a473f]">
            <div className="p-1.5 bg-[#ede9df] border border-[#ded9cb] flex justify-between">
              <span>TARGET SAMPLING RATE</span>
              <span className="text-[#18181a] font-bold">16,000 HZ (MONO)</span>
            </div>
            <div className="p-1.5 bg-[#ede9df] border border-[#ded9cb] flex justify-between">
              <span>ANALYSIS WINDOW DURATION</span>
              <span className="text-[#18181a] font-bold">4.00 SECONDS (64,000 SAMPLES)</span>
            </div>
            <div className="p-1.5 bg-[#ede9df] border border-[#ded9cb] flex justify-between">
              <span>STFT FFT SIZE (N_FFT)</span>
              <span className="text-[#18181a] font-bold">1024 SAMPLES (64 MS)</span>
            </div>
            <div className="p-1.5 bg-[#ede9df] border border-[#ded9cb] flex justify-between">
              <span>HOP LENGTH</span>
              <span className="text-[#18181a] font-bold">256 SAMPLES (16 MS / 75% OVERLAP)</span>
            </div>
            <div className="p-1.5 bg-[#ede9df] border border-[#ded9cb] flex justify-between">
              <span>MEL FILTER BANK BINS</span>
              <span className="text-[#18181a] font-bold">128 FREQUENCY BANDS</span>
            </div>
            <div className="p-1.5 bg-[#ede9df] border border-[#ded9cb] flex justify-between">
              <span>SPECTROGRAM OUTPUT SHAPE</span>
              <span className="text-[#18181a] font-bold">(1, 128, 251) TENSOR</span>
            </div>
            <div className="p-1.5 bg-[#ede9df] border border-[#ded9cb] flex justify-between">
              <span>FEATURE NORMALIZATION</span>
              <span className="text-[#18181a] font-bold">PER-EXAMPLE Z-SCORE (MEAN=0, STD=1)</span>
            </div>
            <div className="p-1.5 bg-[#ede9df] border border-[#ded9cb] flex justify-between">
              <span>SPEECH DATASET PROTOCOL</span>
              <span className="text-[#18181a] font-bold">RAVDESS (1,440 WAV FILES, 24 ACTORS)</span>
            </div>
            <div className="p-1.5 bg-[#ede9df] border border-[#ded9cb] flex justify-between">
              <span>SPEAKER INDEPENDENCE</span>
              <span className="text-emerald-800 font-bold">16 TRAIN / 4 VAL / 4 TEST (ZERO LEAKAGE)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
