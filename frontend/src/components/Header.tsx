import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, ArrowUpRight, ArrowDownLeft, Cloud } from 'lucide-react';
import { apiService } from '../services/api';

export const Header: React.FC = () => {
  const location = useLocation();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    apiService
      .checkHealth()
      .then((data) => setIsBackendHealthy(data.status === 'ok'))
      .catch(() => setIsBackendHealthy(false));
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-[#0a0d14]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-semibold text-slate-100 hover:text-white transition-colors group"
          id="nav-logo"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/25 group-hover:border-blue-400/50 transition-all">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base tracking-tight leading-none font-bold">
              SecureDrop <span className="text-blue-500 font-medium">Cloud</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">
              Secure Cross-Device File Exchange
            </span>
          </div>
        </Link>

        {/* Navigation & Cloud Badge */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Cloud Health Indicator */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-secondary border border-border text-xs text-slate-300 font-mono">
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Cloud Network</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendHealthy === null
                  ? 'bg-amber-400'
                  : isBackendHealthy
                  ? 'bg-emerald-400 status-pulse'
                  : 'bg-rose-400'
              }`}
              title={isBackendHealthy ? 'API & Database Connected' : 'Checking Connection'}
            />
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/upload"
              id="nav-upload-btn"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isActive('/upload')
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-surface-secondary'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Send File</span>
            </Link>

            <Link
              to="/get"
              id="nav-get-btn"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isActive('/get') || location.pathname.startsWith('/get/')
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-surface-secondary'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Get File</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
