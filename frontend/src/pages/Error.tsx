import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, Home, RefreshCw } from 'lucide-react';

export const Error: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
        <AlertOctagon className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Page or Transfer Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          The requested transfer code may have expired, or the link is invalid. Please verify your credentials and try again.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <Link
          to="/get"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface border border-border hover:bg-surface-secondary text-xs font-semibold text-slate-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Another Code</span>
        </Link>
      </div>
    </div>
  );
};
