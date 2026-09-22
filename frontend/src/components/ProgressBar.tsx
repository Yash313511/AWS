import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  fileName: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, fileName }) => {
  return (
    <div className="w-full bg-surface border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2 truncate max-w-[70%]">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
          <span className="font-medium text-slate-300 truncate">Uploading {fileName}</span>
        </div>
        <span className="font-mono font-semibold text-blue-400">{progress}%</span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-surface-secondary rounded-full overflow-hidden border border-border/60">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-200 ease-out"
          style={{ width: `${Math.max(5, progress)}%` }}
        />
      </div>

      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
        <span>Encrypting and transmitting to S3...</span>
        <span>{progress < 100 ? 'Processing stream' : 'Finalizing metadata'}</span>
      </div>
    </div>
  );
};
