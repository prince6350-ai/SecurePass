import React from 'react';
import { Shield, Linkedin, ExternalLink, CheckCircle2 } from 'lucide-react';
import { BrandConfig } from '../config/brand';

interface BrandingHeaderProps {
  config: BrandConfig;
}

export const BrandingHeader: React.FC<BrandingHeaderProps> = ({ config }) => {
  return (
    <header className="relative w-full max-w-4xl mx-auto pt-8 pb-6 px-4 flex flex-col items-center text-center">
      {/* Top Status Badge (Zero buttons - clean public interface) */}
      <div className="flex items-center justify-center mb-6 text-xs font-mono">
        <div className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/20 px-3.5 py-1.5 rounded-full shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 tracking-wide font-medium">100% Client-Side Engine</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">Zero-Storage</span>
        </div>
      </div>

      {/* Profile Photo with Dual Subtle Glow Frame */}
      <div className="relative group mb-4">
        {/* Ambient Ring Glow */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 opacity-70 blur-md group-hover:opacity-100 transition duration-500 animate-pulse"></div>

        {/* Circular Frame */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-emerald-400/40 bg-zinc-900 p-1 shadow-2xl flex items-center justify-center">
          <img
            src={config.avatarImageUrl}
            alt={config.developerName}
            className="w-full h-full object-cover object-center rounded-full"
            onError={(e) => {
              // Graceful fallback to default cyber avatar if prince-kumar.jpg is not yet copied
              if (e.currentTarget.src !== window.location.origin + '/avatar-placeholder.svg') {
                e.currentTarget.src = '/avatar-placeholder.svg';
              }
            }}
          />
        </div>

        {/* Verified Badge */}
        <div
          className="absolute bottom-0 right-1 bg-emerald-500 text-zinc-950 p-1 rounded-full shadow-lg border-2 border-zinc-950"
          title="Verified Cybersecurity Developer"
        >
          <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-zinc-950" />
        </div>
      </div>

      {/* Tool Name */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-1 flex items-center justify-center gap-3">
        <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          {config.toolName}
        </span>
      </h1>

      {/* Tagline */}
      <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto font-mono mb-2">
        {config.tagline}
      </p>

      {/* Developer Credit */}
      <div className="inline-flex items-center gap-2 mb-4 bg-zinc-900/90 border border-zinc-800/80 px-3.5 py-1 rounded-full shadow-sm">
        <span className="text-xs font-semibold text-zinc-200">
          {config.developerCredit}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
          Security Specialist
        </span>
      </div>

      {/* Clickable Social Media Links: Permanent LinkedIn */}
      <div className="flex items-center justify-center w-full max-w-sm">
        <a
          href={config.socials.linkedin.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/90 hover:bg-blue-950/40 border border-zinc-800 hover:border-blue-500/40 text-zinc-300 hover:text-blue-400 transition-all text-xs font-mono shadow-sm"
          title={`Connect with ${config.developerName} on LinkedIn`}
        >
          <Linkedin className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          <span>LinkedIn</span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400" />
        </a>
      </div>
    </header>
  );
};
