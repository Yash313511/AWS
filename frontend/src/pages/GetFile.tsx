import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowDownLeft,
  Download,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { PinInput } from '../components/PinInput';
import { LoadingState } from '../components/LoadingState';
import { apiService } from '../services/api';

export const GetFile: React.FC = () => {
  const { transferCode: routeCode } = useParams<{ transferCode?: string }>();

  const [transferCode, setTransferCode] = useState<string>(routeCode ? routeCode.toUpperCase() : '');
  const [pin, setPin] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Verified File State
  const [verifiedFile, setVerifiedFile] = useState<{
    name: string;
    size: number;
    contentType: string;
  } | null>(null);

  useEffect(() => {
    if (routeCode) {
      setTransferCode(routeCode.toUpperCase());
    }
  }, [routeCode]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = transferCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Please enter a transfer code.');
      return;
    }

    if (pin.length !== 6) {
      setErrorMessage('Please enter a 6-digit PIN.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiService.verifyTransfer(cleanCode, pin);
      if (result.success && result.file) {
        setVerifiedFile(result.file);
      } else {
        setErrorMessage(result.error || 'The transfer code or PIN is incorrect. Please check both and try again.');
      }
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        'The transfer code or PIN is incorrect. Please check both and try again.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!transferCode || !pin) return;

    setIsDownloading(true);
    setErrorMessage(null);

    try {
      const response = await apiService.requestDownloadUrl(transferCode.trim().toUpperCase(), pin);

      if (response.success && response.downloadUrl) {
        // Direct download trigger
        const anchor = document.createElement('a');
        anchor.href = response.downloadUrl;
        anchor.setAttribute('download', verifiedFile?.name || 'file');
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      } else {
        setErrorMessage(response.error || 'Failed to generate download link. Please try again.');
      }
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        'Unable to retrieve download URL. Please check your credentials and try again.';
      setErrorMessage(message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center max-w-md mx-auto px-4 py-8 sm:py-12 w-full">
      {/* Page Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-1">
          <ArrowDownLeft className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Get Your File
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter the 6-character transfer code and 6-digit PIN generated on the uploading device.
        </p>
      </div>

      {!verifiedFile ? (
        /* Credential Entry Form */
        <form onSubmit={handleVerify} className="space-y-5 bg-surface border border-border rounded-2xl p-6 shadow-xl">
          {/* Transfer Code Input */}
          <div className="space-y-1.5">
            <label htmlFor="transfer-code-input" className="text-xs uppercase tracking-wider font-semibold text-slate-300">
              Transfer Code
            </label>
            <input
              id="transfer-code-input"
              type="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck="false"
              maxLength={10}
              placeholder="e.g. A7K9P2"
              value={transferCode}
              onChange={(e) => setTransferCode(e.target.value.toUpperCase())}
              disabled={isLoading}
              className="w-full font-mono text-center uppercase tracking-widest text-lg sm:text-xl font-bold bg-surface-secondary/70 border border-border rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* 6-Digit PIN Input */}
          <PinInput
            value={pin}
            onChange={setPin}
            disabled={isLoading}
          />

          {/* Error Banner */}
          {errorMessage && (
            <div
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading || !transferCode || pin.length !== 6}
            id="verify-transfer-btn"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {isLoading ? (
              <LoadingState message="Verifying credentials..." />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Access File</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* Verified File Success State */
        <div className="space-y-5 bg-surface border border-emerald-500/30 rounded-2xl p-6 shadow-xl animate-fade-in">
          {/* Verified Header */}
          <div className="flex items-center gap-2.5 text-emerald-400 pb-3 border-b border-border">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">Credentials Verified Successfully</span>
          </div>

          {/* File Card */}
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-surface-secondary/50 border border-border">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-100 text-sm truncate" title={verifiedFile.name}>
                {verifiedFile.name}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <span className="font-mono text-slate-300">{formatFileSize(verifiedFile.size)}</span>
                <span>•</span>
                <span className="truncate max-w-[120px]">{verifiedFile.contentType}</span>
              </div>
            </div>
          </div>

          {/* Presigned Download Security Info */}
          <div className="flex items-start gap-2 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>
              Clicking below initiates an encrypted, authenticated download via a secure temporary link.
            </span>
          </div>

          {/* Error message if download failed */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/30 border border-rose-800/50 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Download CTA */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            id="download-file-btn"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {isDownloading ? (
              <LoadingState message="Preparing secure download..." />
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download File Now</span>
              </>
            )}
          </button>

          {/* Reset / Enter Another Code */}
          <button
            type="button"
            onClick={() => {
              setVerifiedFile(null);
              setPin('');
              setErrorMessage(null);
            }}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Access another file
          </button>
        </div>
      )}
    </div>
  );
};
