import React from 'react';
import type { TMDBApiStatus } from '../../types/tmdb';
import { Database, Wifi, AlertTriangle } from 'lucide-react';

interface TMDBAttributionProps {
  status?: TMDBApiStatus;
  compact?: boolean;
  className?: string;
}

export const TMDBLogoSvg: React.FC<{ className?: string }> = ({ className = 'h-3.5' }) => (
  <svg
    viewBox="0 0 185 16"
    className={className}
    fill="currentColor"
    aria-label="TMDB Logo"
  >
    <rect x="0" y="0" width="185" height="16" rx="4" fill="#0d253f" />
    {/* Stylized TMDB logo graphic */}
    <text
      x="8"
      y="12"
      fill="#01b4e4"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="900"
      fontSize="11"
      letterSpacing="0.05em"
    >
      THE MOVIE DATABASE
    </text>
  </svg>
);

export const TMDBAttribution: React.FC<TMDBAttributionProps> = ({
  status,
  compact = false,
  className = '',
}) => {
  const isTMDB = status?.mode === 'tmdb';
  const isRateLimited = status?.isRateLimited;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-[10px] text-slate-400 select-none ${className}`}>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
          {isRateLimited ? (
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>TMDB Rate Limited</span>
            </span>
          ) : isTMDB ? (
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Wifi className="w-2.5 h-2.5" />
              <span>TMDB Live</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400 font-semibold">
              <Database className="w-2.5 h-2.5" />
              <span>Sample Catalog</span>
            </span>
          )}
        </div>
        <span className="text-slate-500 hidden sm:inline">
          Powered by TMDB API
        </span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl bg-cinematic-900/80 border border-slate-800 text-slate-400 select-none ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TMDBLogoSvg className="h-4 w-auto" />
          <div className="h-3 w-px bg-slate-700 hidden sm:block" />
          <span className="text-xs text-slate-300">
            Metadata Provider Attribution
          </span>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          {isRateLimited ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/60 text-amber-300 border border-amber-600/50">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              HTTP 429 Rate Limited • Sample Fallback Active
            </span>
          ) : isTMDB ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-600/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              TMDB Live API Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <Database className="w-3 h-3 text-slate-400" />
              Offline / Bundled Sample Catalog Active
            </span>
          )}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
        This product uses the TMDB API but is not endorsed or certified by TMDB. Movie posters, backdrops, cast records, and titles are provided under TMDB terms of service.
      </p>
    </div>
  );
};
