import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, Lock, Database, EyeOff, Radio, Cpu, HardDrive } from 'lucide-react';

export const PrivacyNotice: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="w-full mt-4 bg-zinc-950/70 border border-zinc-800/90 rounded-xl p-4 shadow-sm text-left">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
            <strong className="text-emerald-400 font-semibold">Your privacy matters.</strong> Your master secret and generated passwords are processed locally by this application. The app does not store or transmit these values. No database or password history is maintained. Keep your master secret safe: it cannot be recovered by this app if lost.
          </p>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 mt-2 text-xs font-mono font-medium text-cyan-400 hover:text-cyan-300 hover:underline transition-colors cursor-pointer"
          >
            <span>How Your Privacy Is Protected</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Privacy & Security Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-300">
          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 flex items-start gap-2.5">
            <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-zinc-100 font-mono text-[11px] mb-1">Zero Database Architecture</h4>
              <p className="text-zinc-400 leading-normal">
                There is no database, no backend store, no Firebase, and no local cache (no localStorage or IndexedDB). The moment you close the tab or press "Clear", secrets are gone from RAM.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 flex items-start gap-2.5">
            <Radio className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-zinc-100 font-mono text-[11px] mb-1">Zero Network Transmission</h4>
              <p className="text-zinc-400 leading-normal">
                All cryptographic PBKDF2 calculations occur strictly inside your browser via native Web Cryptography (`window.crypto.subtle`). No secrets ever touch network wires or external APIs.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 flex items-start gap-2.5">
            <Cpu className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-zinc-100 font-mono text-[11px] mb-1">Deterministic Pure Function</h4>
              <p className="text-zinc-400 leading-normal">
                f(Secret, Website) = Password. Mathematical determinism removes the need for password syncing, encrypted vaults, or cloud master passwords that can be targeted by credential stuffing.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 flex items-start gap-2.5">
            <HardDrive className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-zinc-100 font-mono text-[11px] mb-1">Client Environment Boundary</h4>
              <p className="text-zinc-400 leading-normal">
                While this application transmits nothing, your local device security (malware, keyloggers, screen recording, or OS clipboard history tools) remains in your device's control. Always run on trusted machines.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
