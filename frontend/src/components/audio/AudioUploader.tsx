import React, { useRef, useState } from 'react';
import { UploadCloud, FileAudio, X, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';

interface AudioUploaderProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  isLoading?: boolean;
}

const ALLOWED_EXTENSIONS = ['.wav', '.mp3', '.flac', '.ogg', '.m4a'];
const MAX_SIZE_MB = 20;

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onFileSelected,
  selectedFile,
  onClear,
  isLoading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateAndHandleFile = (file: File) => {
    setErrorMessage(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage(`Unsupported format '${ext}'. Please upload WAV, MP3, FLAC, or OGG audio.`);
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed ${MAX_SIZE_MB} MB limit.`);
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/50 border border-rose-800/80 rounded-md text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-8 md:p-10 border border-dashed rounded-md cursor-pointer transition-colors duration-150 text-center ${
            isDragging
              ? 'border-zinc-400 bg-zinc-900/80'
              : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950 hover:bg-zinc-900/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".wav,.mp3,.flac,.ogg,.m4a,audio/*"
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="w-10 h-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 mb-3">
            <UploadCloud className="w-5 h-5" />
          </div>

          <h3 className="text-sm font-semibold text-text-primary mb-1">
            Drop audio recording or <span className="text-zinc-100 underline decoration-zinc-600 underline-offset-4">browse files</span>
          </h3>

          <p className="text-xs text-text-secondary max-w-sm mb-3">
            WAV, MP3, FLAC, OGG up to 20 MB. Fixed-duration pipeline normalizes input to 4.0 seconds.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {ALLOWED_EXTENSIONS.map((ext) => (
              <span
                key={ext}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-400"
              >
                {ext.toUpperCase().replace('.', '')}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 bg-zinc-900 border border-border rounded-md">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 flex-shrink-0">
              <FileAudio className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-text-primary truncate" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <p className="text-[11px] font-mono text-text-muted">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'audio/wav'}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={isLoading}
            icon={<X className="w-3.5 h-3.5" />}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
};
