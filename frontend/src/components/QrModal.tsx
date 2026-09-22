import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, ShieldAlert } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferCode: string;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  transferCode,
}) => {
  if (!isOpen) return null;

  // PRD Section 49: The QR code contains the transfer access URL/code only. Never the PIN!
  const transferUrl = `${window.location.origin}/get/${transferCode}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>Scan to Open on Phone</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-surface-secondary transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-inner">
          <QRCodeSVG
            value={transferUrl}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-950/30 border border-blue-900/40 text-[11px] text-blue-200">
          <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span>
            For maximum security, this QR code opens transfer <strong className="font-mono text-white">{transferCode}</strong> directly on your mobile browser. You must enter your PIN separately on your phone.
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-xs font-semibold text-slate-300 bg-surface-secondary hover:bg-slate-800 rounded-lg border border-border transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
