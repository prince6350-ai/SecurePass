import React, { useState } from 'react';
import { BRAND_CONFIG } from './config/brand';
import { DerivationResult } from './crypto/generator';
import { BrandingHeader } from './components/BrandingHeader';
import { GeneratorCard } from './components/GeneratorCard';
import { PasswordDisplay } from './components/PasswordDisplay';
import { HowItWorksNote } from './components/HowItWorksNote';
import { CyberParticles } from './components/CyberParticles';
import { Shield } from 'lucide-react';

export default function App() {
  const [derivationResult, setDerivationResult] = useState<DerivationResult | null>(null);

  const handleGenerated = (result: DerivationResult) => {
    setDerivationResult(result);
  };

  const handleClear = () => {
    setDerivationResult(null);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col relative selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Ambient background cyber grid, particles & radial lighting */}
      <CyberParticles />
      <div className="fixed inset-0 bg-grid-cyber pointer-events-none opacity-60"></div>
      <div className="fixed inset-0 glow-mesh pointer-events-none opacity-70"></div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start pb-16 px-4">
        {/* Permanent Developer Branding Header */}
        <BrandingHeader config={BRAND_CONFIG} />

        {/* Core Generator Container */}
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
          <GeneratorCard
            onGenerated={handleGenerated}
            onClear={handleClear}
            currentResult={derivationResult}
          />

          {/* Generated Password Output Card */}
          <PasswordDisplay
            result={derivationResult}
            onClear={handleClear}
            isGenerating={false}
          />

          {/* Visible How It Works Note below generator */}
          <HowItWorksNote />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 bg-zinc-950/80 py-8 px-4 text-center text-xs font-mono text-zinc-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-zinc-300">{BRAND_CONFIG.toolName}</span>
            <span>—</span>
            <span>{BRAND_CONFIG.developerCredit}</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <span className="text-[11px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-emerald-400">
              PBKDF2-HMAC-SHA256
            </span>
            <span className="text-[11px] text-zinc-500">
              Zero Database • Local Only
            </span>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-zinc-600 max-w-lg mx-auto">
          Private cryptographic derivation tool. No cookies, no trackers, no database, no master secret transmission.
        </p>
      </footer>
    </div>
  );
}
