import React from 'react';
import { Shield, KeyRound, Globe, RefreshCw, HardDrive, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const HowItWorksNote: React.FC = () => {
  return (
    <div className="w-full max-w-2xl mx-auto mt-6 bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md text-left">
      <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
        <Shield className="w-4 h-4 text-emerald-400" />
        <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-zinc-200">
          How It Works — Deterministic Derivation
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 text-xs">
        <div className="flex items-start gap-2.5 text-zinc-300">
          <KeyRound className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-zinc-100 font-semibold">Master Secret:</strong> Your primary passphrase used to cryptographically derive all passwords via PBKDF2-HMAC-SHA-256.
          </p>
        </div>

        <div className="flex items-start gap-2.5 text-zinc-300">
          <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-zinc-100 font-semibold">Account Identifier (Optional):</strong> Specific to each service (e.g. <code className="text-emerald-300">github.com</code>). Leaving it blank uses a fixed default identifier (<code className="text-emerald-300">default</code>).
          </p>
        </div>

        <div className="flex items-start gap-2.5 text-zinc-300">
          <RefreshCw className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-zinc-100 font-semibold">Repeatable Outputs:</strong> Identical inputs, settings, and profile always yield the exact same password on demand.
          </p>
        </div>

        <div className="flex items-start gap-2.5 text-zinc-300">
          <HardDrive className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-zinc-100 font-semibold">Zero Database:</strong> Passwords are never stored in a database, cloud sync, or history. Closing the tab removes secrets from RAM.
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-start gap-2 text-[11px] text-amber-300/90 font-mono">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
        <span>
          <strong>Important:</strong> Losing your master secret means the application cannot recover it, as no data is stored anywhere.
        </span>
      </div>
    </div>
  );
};
