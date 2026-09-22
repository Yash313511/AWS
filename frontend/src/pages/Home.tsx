import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Zap,
  Key,
  Lock,
  Smartphone,
  Laptop,
} from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-400 status-pulse" />
          <span>MongoDB Atlas • Zero Account Transfer • 60s Ephemeral Auth</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Send a file from one device <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
            to another.
          </span>
        </h1>

        {/* Supporting description */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Upload it here, receive an ephemeral transfer code and PIN, and securely download it on another device in seconds. No account, email, or app required.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <Link
            to="/upload"
            id="home-upload-cta"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>Upload a File</span>
          </Link>

          <Link
            to="/get"
            id="home-get-cta"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold bg-surface border border-border hover:bg-surface-secondary text-slate-200 hover:text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowDownLeft className="w-5 h-5 text-blue-400" />
            <span>Get a File</span>
          </Link>
        </div>
      </div>

      {/* How It Works Diagram */}
      <div className="mt-16 sm:mt-24 p-6 sm:p-8 rounded-2xl bg-surface/80 border border-border/80 shadow-xl">
        <h2 className="text-xs uppercase tracking-widest text-slate-400 font-semibold text-center mb-8">
          The 3-Step Device Transfer Workflow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-surface-secondary/40 border border-border/50">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
              <Laptop className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-blue-400 mb-1">01 • UPLOAD</span>
            <h3 className="text-sm font-semibold text-slate-100">Select file on Device A</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Files are securely encrypted and streamed directly into cloud storage.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-surface-secondary/40 border border-border/50">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
              <Key className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-indigo-400 mb-1">02 • CREDENTIALS</span>
            <h3 className="text-sm font-semibold text-slate-100">Receive Code & PIN</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Cryptographic 6-character code and salted bcrypt-hashed PIN are generated.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-surface-secondary/40 border border-border/50">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-emerald-400 mb-1">03 • DOWNLOAD</span>
            <h3 className="text-sm font-semibold text-slate-100">Retrieve on Device B</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Enter credentials to unlock a short-lived, authenticated download URL.
            </p>
          </div>
        </div>
      </div>

      {/* Security Architecture Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        <div className="p-4 rounded-xl bg-surface/50 border border-border/60 flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-slate-200">No Account Required</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              No registration, login, phone numbers, or passwords to store or leak.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface/50 border border-border/60 flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-slate-200">Fast Authenticated URLs</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Direct and high-speed downloads via cryptographically signed temporary tokens.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface/50 border border-border/60 flex items-start gap-3 sm:col-span-2 md:col-span-1">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-slate-200">Brute-Force Shield</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Rate limiting and PIN guessing prevention with automatic transfer lockouts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
