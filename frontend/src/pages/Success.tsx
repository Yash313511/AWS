import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  QrCode,
  Smartphone,
  UploadCloud,
  FileText,
} from 'lucide-react';
import { TransferCode } from '../components/TransferCode';
import { QrModal } from '../components/QrModal';

interface LocationState {
  transferCode: string;
  pin: string;
  fileName: string;
  fileSize: number;
}

export const Success: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [isQrOpen, setIsQrOpen] = useState(false);

  if (!state || !state.transferCode || !state.pin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
        <p className="text-slate-400 text-sm">No recent upload found.</p>
        <Link
          to="/upload"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
        >
          Go to Upload
        </Link>
      </div>
    );
  }

  const { transferCode, pin, fileName } = state;

  return (
    <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto px-4 py-8 sm:py-12 w-full animate-fade-in">
      {/* Success Badge & Headline */}
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          File Ready for Transfer
        </h1>
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-slate-200 truncate max-w-xs">{fileName}</span>
          <span>is stored securely in encrypted cloud storage.</span>
        </div>
      </div>

      {/* Credentials Card */}
      <div className="space-y-4">
        {/* Transfer Code Component */}
        <TransferCode
          label="Transfer Code"
          value={transferCode}
          helperText="Unique 6-Character ID"
        />

        {/* PIN Component */}
        <TransferCode
          label="Security PIN"
          value={pin}
          helperText="Single-session authorization"
          isSensitive={true}
        />

        {/* QR Code Action */}
        <button
          type="button"
          onClick={() => setIsQrOpen(true)}
          id="open-qr-modal-btn"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface border border-border hover:bg-surface-secondary text-slate-200 hover:text-white text-xs font-semibold transition-all"
        >
          <QrCode className="w-4 h-4 text-blue-400" />
          <span>Show QR Code for Phone Scanning</span>
        </button>

        {/* Cross-Device Instructions */}
        <div className="p-4 rounded-xl bg-surface/60 border border-border/80 text-xs text-slate-300 space-y-2.5">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>How to download on your other device:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 leading-relaxed">
            <li>Open this application on your phone or laptop.</li>
            <li>Click on <strong className="text-slate-200">Get File</strong> in the top menu.</li>
            <li>Enter the <strong className="text-slate-200 font-mono">{transferCode}</strong> and PIN <strong className="text-slate-200 font-mono">{pin}</strong>.</li>
            <li>Download begins securely via authenticated signed link.</li>
          </ol>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-surface border border-border text-xs font-semibold text-slate-300 hover:text-white hover:bg-surface-secondary transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Another File</span>
          </button>

          <Link
            to={`/get/${transferCode}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
          >
            <span>Test Download Now</span>
          </Link>
        </div>
      </div>

      {/* QR Modal */}
      <QrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        transferCode={transferCode}
      />
    </div>
  );
};
