import React, { useState } from 'react';
import {
  KeyRound,
  Globe,
  Sliders,
  Sparkles,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  CharacterProfile,
  DerivationResult,
  derivePassword,
  normalizeIdentifier,
} from '../crypto/generator';
import { evaluateMasterSecretEntropy } from '../crypto/entropy';
import { PrivacyNotice } from './PrivacyNotice';

interface GeneratorCardProps {
  onGenerated: (result: DerivationResult) => void;
  onClear: () => void;
  currentResult: DerivationResult | null;
}

const PRESET_DOMAINS = [
  'github.com',
  'google.com',
  'aws.amazon.com',
  'proton.me',
  'apple.com',
  'reddit.com',
];

const PRESET_LENGTHS = [12, 16, 20, 24, 32];

export const GeneratorCard: React.FC<GeneratorCardProps> = ({
  onGenerated,
  onClear,
  currentResult,
}) => {
  const [masterSecret, setMasterSecret] = useState<string>('');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [accountIdentifier, setAccountIdentifier] = useState<string>('');
  const [length, setLength] = useState<number>(16);
  const [profile, setProfile] = useState<CharacterProfile>('full');
  const [generation, setGeneration] = useState<number>(1);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Entropy calculation
  const entropy = evaluateMasterSecretEntropy(masterSecret);
  const normalizedPreview = normalizeIdentifier(accountIdentifier);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!masterSecret.trim()) {
      setError('Please provide a master secret.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await derivePassword({
        masterSecret,
        accountIdentifier,
        length,
        profile,
        generation,
      });
      onGenerated(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cryptographic derivation failed.';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearAll = () => {
    setMasterSecret('');
    setAccountIdentifier('');
    setLength(16);
    setProfile('full');
    setGeneration(1);
    setError(null);
    onClear();
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative">
      {/* Decorative gradient corner glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <form onSubmit={handleGenerate} className="space-y-6 relative">
        {/* Input 1: Master Secret */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="master-secret"
              className="flex items-center gap-2 text-xs uppercase tracking-wider font-mono font-semibold text-zinc-300"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>1. Master Secret</span>
            </label>

            {masterSecret && (
              <span className={`text-[11px] font-mono ${entropy.color} font-medium`}>
                Entropy: {entropy.bits} bits ({entropy.label})
              </span>
            )}
          </div>

          <div className="relative flex items-center">
            <input
              id="master-secret"
              type={showSecret ? 'text' : 'password'}
              value={masterSecret}
              onChange={(e) => {
                setMasterSecret(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter your private master passphrase..."
              className="w-full bg-zinc-950/90 border border-zinc-800 focus:border-emerald-500/60 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono transition-all pr-12"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
              title={showSecret ? 'Hide secret' : 'Show secret'}
              aria-label={showSecret ? 'Hide secret' : 'Show secret'}
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Master Secret Entropy & Warning Bar */}
          {masterSecret && (
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden flex gap-1">
                <div
                  className={`h-full transition-all duration-300 ${
                    entropy.score >= 1 ? (entropy.score === 1 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-zinc-800'
                  }`}
                  style={{ width: '25%' }}
                ></div>
                <div
                  className={`h-full transition-all duration-300 ${
                    entropy.score >= 2 ? (entropy.score === 2 ? 'bg-yellow-400' : 'bg-emerald-500') : 'bg-zinc-800'
                  }`}
                  style={{ width: '25%' }}
                ></div>
                <div
                  className={`h-full transition-all duration-300 ${
                    entropy.score >= 3 ? 'bg-emerald-400' : 'bg-zinc-800'
                  }`}
                  style={{ width: '25%' }}
                ></div>
                <div
                  className={`h-full transition-all duration-300 ${
                    entropy.score >= 4 ? 'bg-cyan-400' : 'bg-zinc-800'
                  }`}
                  style={{ width: '25%' }}
                ></div>
              </div>

              {!entropy.isSafeForMasterSecret && (
                <div className="flex items-start gap-1.5 text-[11px] text-amber-400 font-mono">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{entropy.feedback}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input 2: Website / Account Identifier */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="account-identifier"
              className="flex items-center gap-2 text-xs uppercase tracking-wider font-mono font-semibold text-zinc-300"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>2. Website or Account Identifier (Optional)</span>
            </label>

            <span className="text-[11px] font-mono text-zinc-400">
              {accountIdentifier.trim() ? (
                <>
                  Salt key: <span className="text-cyan-400">{normalizedPreview}</span>
                </>
              ) : (
                <>
                  Salt key: <span className="text-emerald-400 font-semibold">default</span>{' '}
                  <span className="text-zinc-500">(general password)</span>
                </>
              )}
            </span>
          </div>

          <input
            id="account-identifier"
            type="text"
            value={accountIdentifier}
            onChange={(e) => {
              setAccountIdentifier(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g., github.com (leave blank for general master key)"
            className="w-full bg-zinc-950/90 border border-zinc-800 focus:border-cyan-500/60 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-mono transition-all"
            autoComplete="off"
            spellCheck="false"
          />

          {/* Quick Preset Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-zinc-500 font-mono">Quick Presets:</span>
            <button
              type="button"
              onClick={() => setAccountIdentifier('')}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-colors cursor-pointer border ${
                !accountIdentifier.trim()
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 font-medium'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
              title="Use default identifier for a general password"
            >
              (Default / Blank)
            </button>
            {PRESET_DOMAINS.map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => setAccountIdentifier(domain)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-colors cursor-pointer border ${
                  accountIdentifier.toLowerCase() === domain
                    ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300 font-medium'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        {/* Settings: Length & Character Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {/* Password Length */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password-length"
                className="flex items-center gap-2 text-xs uppercase tracking-wider font-mono font-semibold text-zinc-300"
              >
                <Sliders className="w-4 h-4 text-violet-400" />
                <span>3. Password Length</span>
              </label>
              <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-emerald-400">
                {length} chars
              </span>
            </div>

            <input
              id="password-length"
              type="range"
              min="8"
              max="64"
              step="1"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-zinc-950 rounded-lg"
            />

            <div className="flex justify-between items-center gap-1">
              {PRESET_LENGTHS.map((pLen) => (
                <button
                  key={pLen}
                  type="button"
                  onClick={() => setLength(pLen)}
                  className={`flex-1 py-1 text-[10px] font-mono rounded transition-colors cursor-pointer border ${
                    length === pLen
                      ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300 font-bold'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {pLen}
                </button>
              ))}
            </div>
          </div>

          {/* Character Profile */}
          <div className="space-y-2">
            <label
              htmlFor="character-profile"
              className="flex items-center gap-2 text-xs uppercase tracking-wider font-mono font-semibold text-zinc-300"
            >
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Character Profile</span>
            </label>

            <select
              id="character-profile"
              value={profile}
              onChange={(e) => setProfile(e.target.value as CharacterProfile)}
              className="w-full bg-zinc-950/90 border border-zinc-800 focus:border-cyan-500/60 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-mono transition-all cursor-pointer"
            >
              <option value="full">Full (A-Z, a-z, 0-9, All Symbols) [Recommended]</option>
              <option value="symbols_safe">Safe Symbols (A-Z, a-z, 0-9, !@#$%^&*-_=+)</option>
              <option value="alphanumeric">Alphanumeric (A-Z, a-z, 0-9, No Symbols)</option>
              <option value="pin">Numeric PIN (Digits 0-9 only)</option>
            </select>

            <p className="text-[11px] text-zinc-500 font-mono">
              {profile === 'full' && 'Guarantees uppercase, lowercase, numbers, and symbols.'}
              {profile === 'symbols_safe' && 'Avoids brackets/braces for systems with strict symbol rules.'}
              {profile === 'alphanumeric' && 'Letters and numbers only. Guaranteed 1 upper, 1 lower, 1 digit.'}
              {profile === 'pin' && 'Deterministic numeric passcode (e.g. for phone or ATM PIN).'}
            </p>
          </div>
        </div>

        {/* Collapsible Advanced Settings (Generation Counter & Custom Salt) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <span>Advanced Cryptographic Options</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-4 text-xs font-mono">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="generation-counter" className="text-zinc-300 font-semibold">
                    Generation Counter (Password Rotation)
                  </label>
                  <span className="text-cyan-400 font-bold">Gen {generation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="generation-counter"
                    type="number"
                    min="1"
                    max="999"
                    value={generation}
                    onChange={(e) => setGeneration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-center font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-zinc-500 text-[11px] flex-1">
                    If an account requires a password change, increment this counter to generate a completely new password without altering your master secret!
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                <div>
                  <span className="text-zinc-500">Algorithm:</span> PBKDF2-HMAC-SHA-256 (100,000 iterations)
                </div>
                <div>
                  <span className="text-zinc-500">Derived Salt:</span>{' '}
                  <code className="text-emerald-400">
                    SecurePass:v1:{normalizedPreview || 'identifier'}
                    {generation > 1 ? `:c${generation}` : ''}
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/40 rounded-xl p-3 text-xs text-red-300 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          {/* Generate Button */}
          <button
            type="submit"
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-mono text-sm font-bold tracking-wide text-zinc-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 active:scale-[0.99] shadow-lg shadow-emerald-500/10 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-zinc-950" />
            <span>{isGenerating ? 'Deriving Key...' : 'Generate Password'}</span>
          </button>

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-mono text-sm font-semibold text-zinc-400 hover:text-zinc-100 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
            title="Wipe inputs and output from memory"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>

        {/* Prominent Privacy Notice */}
        <PrivacyNotice />
      </form>
    </div>
  );
};
