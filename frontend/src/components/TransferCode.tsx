import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface TransferCodeProps {
  label: string;
  value: string;
  helperText?: string;
  isSensitive?: boolean;
}

export const TransferCode: React.FC<TransferCodeProps> = ({
  label,
  value,
  helperText,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 sm:p-5 rounded-xl bg-surface border border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
          {label}
        </span>
        {helperText && <span className="text-[11px] text-slate-500">{helperText}</span>}
      </div>

      <div className="flex items-center justify-between gap-3 bg-surface-secondary/70 border border-border/70 rounded-lg p-3 sm:p-3.5">
        <span className="font-mono text-2xl sm:text-3xl font-bold tracking-widest text-white select-all">
          {value}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          id={`copy-${label.toLowerCase().replace(/\s+/g, '-')}-btn`}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            copied
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-surface hover:bg-slate-700 text-slate-200 border border-border/80'
          }`}
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Copied ✓</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
