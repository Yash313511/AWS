import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
}

export const PinInput: React.FC<PinInputProps> = ({
  value,
  onChange,
  disabled = false,
  error,
}) => {
  const [showPin, setShowPin] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only accept numeric input up to 6 digits
    const clean = e.target.value.replace(/\D/g, '').substring(0, 6);
    onChange(clean);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const clean = pasteData.replace(/\D/g, '').substring(0, 6);
    onChange(clean);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="pin-input" className="text-xs uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-blue-400" />
          <span>6-Digit Security PIN</span>
        </label>
        <button
          type="button"
          onClick={() => setShowPin(!showPin)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          tabIndex={0}
          aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
        >
          {showPin ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Show</span>
            </>
          )}
        </button>
      </div>

      <div className="relative">
        <input
          id="pin-input"
          type={showPin ? 'text' : 'password'}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder="••••••"
          autoComplete="off"
          className={`w-full tracking-[0.6em] font-mono text-center text-xl sm:text-2xl font-bold bg-surface border rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
            error ? 'border-rose-500/80 bg-rose-950/10' : 'border-border hover:border-slate-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>

      {error && (
        <p className="text-xs text-rose-400 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
