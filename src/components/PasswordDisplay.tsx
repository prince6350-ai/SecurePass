import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff, ShieldCheck, RefreshCw, KeyRound, AlertTriangle } from 'lucide-react';
import { DerivationResult } from '../crypto/generator';

interface PasswordDisplayProps {
  result: DerivationResult | null;
  onClear: () => void;
  isGenerating: boolean;
}

export const PasswordDisplay: React.FC<PasswordDisplayProps> = ({
  result,
  onClear,
  isGenerating,
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  if (!result) return null;

  const handleCopy = async () => {
    if (!result?.password) return;
    try {
      await navigator.clipboard.writeText(result.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = result.password;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Helper to color-code characters for readability
  const renderColoredCharacters = (pwd: string) => {
    if (!showPassword) {
      return (
        <span className="tracking-widest text-zinc-500 font-mono select-none">
          {'•'.repeat(pwd.length)}
        </span>
      );
    }

    return (
      <span className="font-mono tracking-wider break-all select-all font-semibold">
        {Array.from(pwd).map((ch, idx) => {
          let colorClass = 'text-zinc-200';
          if (/[0-9]/.test(ch)) colorClass = 'text-emerald-400 font-bold';
          else if (/[A-Z]/.test(ch)) colorClass = 'text-cyan-300 font-bold';
          else if (/[a-z]/.test(ch)) colorClass = 'text-zinc-100';
          else colorClass = 'text-violet-400 font-bold'; // Symbols

          return (
            <span key={idx} className={colorClass}>
              {ch}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="w-full mt-6 bg-zinc-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl transition-all">
      {/* Top subtle highlight bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500"></div>

      {/* Header with status badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-400" />
          <span className="text-xs uppercase tracking-wider font-mono font-semibold text-zinc-300">
            Deterministic Output ({result.length} chars)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
            {result.profile}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="text-zinc-500">Service:</span>
          <span className="text-cyan-400 font-medium">
            {result.isDefaultIdentifier || result.normalizedIdentifier === 'default'
              ? 'default (General)'
              : result.normalizedIdentifier}
          </span>
          {result.generation > 1 && (
            <span className="px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30 text-[10px]">
              Gen {result.generation}
            </span>
          )}
        </div>
      </div>

      {/* Main Password Output Box */}
      <div className="relative flex items-center justify-between gap-3 bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 min-h-[64px]">
        <div className="flex-1 overflow-x-auto text-lg sm:text-xl py-1">
          {renderColoredCharacters(result.password)}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Show / Hide Toggle */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Explicit Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-lg ${
              copied
                ? 'bg-emerald-500 text-zinc-950 font-bold border border-emerald-400'
                : 'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/40 hover:shadow-emerald-500/20'
            }`}
            title="Copy password to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Password</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Character Type Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-800/60">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Uppercase
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-300"></span> Lowercase
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Digits
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-400"></span> Symbols
          </span>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="text-zinc-400 hover:text-red-400 transition-colors text-xs font-mono underline underline-offset-4 cursor-pointer mt-1 sm:mt-0"
        >
          Clear Memory & Output
        </button>
      </div>

      {/* Warning note on recovery */}
      <div className="mt-4 flex items-start gap-2.5 bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200/90">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-amber-300">Cryptographic Reminder:</strong> If you lose your master secret or forget your settings, this tool has no database and cannot recover or reset your passwords. Anyone with access to your master secret and website identifier can reproduce this exact output.
        </p>
      </div>
    </div>
  );
};
