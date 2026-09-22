import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  subMessage,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-200">{message}</p>
      {subMessage && <p className="text-xs text-slate-400 max-w-xs">{subMessage}</p>}
    </div>
  );
};
