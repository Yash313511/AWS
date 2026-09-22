import React from 'react';
import { ShieldCheck, Database, Server, HardDrive, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border mt-auto bg-[#080b11] text-slate-400 text-xs py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Architecture Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b border-border/50 mb-6 text-slate-300">
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface/50 border border-border/40">
            <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-slate-200">Secure Storage</span>
              <span className="text-[11px] text-slate-400">Encrypted at rest & Signed URLs</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface/50 border border-border/40">
            <Database className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-slate-200">MongoDB Atlas</span>
              <span className="text-[11px] text-slate-400">Cloud Document Database</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface/50 border border-border/40">
            <Server className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-slate-200">Node.js Engine</span>
              <span className="text-[11px] text-slate-400">TypeScript & Express REST API</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface/50 border border-border/40">
            <Lock className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-slate-200">Security Shield</span>
              <span className="text-[11px] text-slate-400">Bcrypt PIN & Rate Limiting</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero-account ephemeral transfers. Files are private, encrypted, and accessible only with valid PIN.</span>
          </div>
          <div className="font-mono text-slate-500 text-[11px]">
            SecureDrop Cloud • MongoDB Atlas
          </div>
        </div>
      </div>
    </footer>
  );
};
