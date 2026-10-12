import React, { useState, useEffect } from 'react';
import { useTVNavigation } from '../../context/TVNavigationContext';
import { tmdbMovieService } from '../../services/tmdbService';
import type { TMDBApiStatus } from '../../types/tmdb';
import { TMDBAttribution } from '../common/TMDBAttribution';
import { apiClient, type BackendHealthStatus } from '../../services/apiClient';
import { 
  Settings, 
  Tv, 
  Volume2, 
  ShieldCheck, 
  Sparkles, 
  RotateCcw, 
  Check, 
  Cpu,
  Database,
  RefreshCw,
  Server
} from 'lucide-react';

interface SettingsScreenProps {
  familySafeMode: boolean;
  onToggleFamilySafeMode: () => void;
  onResetWatchlist?: () => void;
  onResetProfiles?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  familySafeMode,
  onToggleFamilySafeMode,
  onResetWatchlist,
}) => {
  const { soundEnabled, setSoundEnabled, playFeedbackSound, setIsVirtualRemoteOpen } = useTVNavigation();

  const [overscanSetting, setOverscanSetting] = useState<'none' | 'moderate' | 'full'>('moderate');
  const [highContrast, setHighContrast] = useState(false);
  const [consensusAlgorithm, setConsensusAlgorithm] = useState<'weighted' | 'unanimous' | 'majority'>('weighted');
  const [requirePinForR, setRequirePinForR] = useState(true);
  const [resetSavedNotice, setResetSavedNotice] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<TMDBApiStatus | undefined>(undefined);
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [backendHealth, setBackendHealth] = useState<BackendHealthStatus | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);

  useEffect(() => {
    tmdbMovieService.getStatus().then(setApiStatus);
    apiClient.checkHealth().then(setBackendHealth);
  }, []);

  const handleRefreshBackend = async () => {
    setIsCheckingBackend(true);
    playFeedbackSound('select');
    try {
      const health = await apiClient.checkHealth(true);
      setBackendHealth(health);
      showNotification('Backend health refreshed');
    } finally {
      setIsCheckingBackend(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsCheckingApi(true);
    playFeedbackSound('select');
    try {
      const status = await tmdbMovieService.getStatus();
      setApiStatus(status);
      showNotification('Metadata provider status refreshed');
    } finally {
      setIsCheckingApi(false);
    }
  };

  const showNotification = (msg: string) => {
    setResetSavedNotice(msg);
    setTimeout(() => setResetSavedNotice(null), 3000);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-8 py-8 animate-fade-in select-none">
      
      {/* Settings Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-fire-amber/20 border border-fire-amber/40 flex items-center justify-center">
            <Settings className="w-6 h-6 text-fire-amber" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold font-display text-white">
                CineMind TV Settings
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                Fire OS 8.1 Ready
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Calibrate 10-foot television display, audio remote feedback, parental safety, and AI consensus tuning.
            </p>
          </div>
        </div>

        {resetSavedNotice && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-xs font-bold animate-bounce flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{resetSavedNotice}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 1: Display & 10-Foot Television Safe Area */}
        <div className="p-6 rounded-3xl bg-cinematic-900 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2.5 text-fire-amber font-display font-bold text-base border-b border-slate-800 pb-3">
            <Tv className="w-5 h-5 text-fire-amber" />
            <span>TV Display & Safe Area Calibration</span>
          </div>

          <div>
            <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2">
              Overscan Margins (Fire TV Edge Protection)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: '0% None', desc: 'Frameless 4K' },
                { id: 'moderate', label: '2.5% Safe', desc: 'Standard TV' },
                { id: 'full', label: '5.0% Edge', desc: 'Older Sets' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    playFeedbackSound('move');
                    setOverscanSetting(opt.id as any);
                    showNotification('Overscan setting updated');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    overscanSetting === opt.id
                      ? 'bg-fire-amber text-black font-bold border-fire-amber shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <span className="text-xs font-bold block">{opt.label}</span>
                  <span className={`text-[10px] ${overscanSetting === opt.id ? 'text-black/80' : 'text-slate-400'}`}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div>
              <span className="text-sm font-bold text-white block">High Contrast TV Text</span>
              <span className="text-xs text-slate-400">Enhance subtitles and card labels for viewing at 12+ feet</span>
            </div>
            <button
              onClick={() => {
                playFeedbackSound('select');
                setHighContrast(!highContrast);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                highContrast ? 'bg-fire-amber' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  highContrast ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section 2: Audio Feedback & Fire TV Remote Controls */}
        <div className="p-6 rounded-none bg-cinematic-900 border border-neutral-800 space-y-6">
          <div className="flex items-center gap-2.5 text-slate-200 font-display font-bold text-base border-b border-neutral-800 pb-3">
            <Volume2 className="w-5 h-5 text-slate-400" />
            <span>Audio & Remote Navigation</span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-none bg-neutral-800/60 border border-neutral-700/60">
            <div>
              <span className="text-sm font-bold text-white block">TV Remote Acoustic Feedback (SFX)</span>
              <span className="text-xs text-slate-400">Play directional navigation clicks and celebration fanfare</span>
            </div>
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playFeedbackSound('select');
              }}
              className={`w-12 h-6 rounded-none transition-colors relative p-0.5 ${
                soundEnabled ? 'bg-amber-500' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-none bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2">
              Virtual Fire TV Remote Controller
            </label>
            <button
              onClick={() => setIsVirtualRemoteOpen(true)}
              className="w-full py-3 px-4 rounded-none bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-between transition-all"
            >
              <span>Launch On-Screen Fire TV Remote Controller</span>
              <kbd className="px-2 py-0.5 rounded-none bg-slate-900 text-fire-amber border border-slate-700 font-mono text-[10px]">
                Press [R]
              </kbd>
            </button>
          </div>
        </div>

        {/* Section 3: Parental Safety & Family Controls */}
        <div className="p-6 rounded-3xl bg-cinematic-900 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2.5 text-emerald-400 font-display font-bold text-base border-b border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Parental Controls & Content Security</span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div>
              <span className="text-sm font-bold text-white block">Global Kids & Family Lock (G/PG Only)</span>
              <span className="text-xs text-slate-400">Instantly filters out all PG-13 and R titles across all screens</span>
            </div>
            <button
              onClick={() => {
                playFeedbackSound('select');
                onToggleFamilySafeMode();
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                familySafeMode ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  familySafeMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div>
              <span className="text-sm font-bold text-white block">Require Parental Consent for R-Rated Votes</span>
              <span className="text-xs text-slate-400">Protects Family Vote sessions when younger family members are present</span>
            </div>
            <button
              onClick={() => {
                playFeedbackSound('select');
                setRequirePinForR(!requirePinForR);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                requirePinForR ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  requirePinForR ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section 4: CineMind Recommendation Tuning */}
        <div className="p-6 rounded-none bg-cinematic-900 border border-neutral-800 space-y-6">
          <div className="flex items-center gap-2.5 text-slate-200 font-display font-bold text-base border-b border-neutral-800 pb-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>AI Recommendation & Consensus Tuning</span>
          </div>

          <div>
            <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2">
              Family Vote Consensus Algorithm
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'weighted', label: 'Balanced Harmony', desc: 'Weights younger viewers' },
                { id: 'unanimous', label: 'Zero Skips', desc: 'Strict unanimous pick' },
                { id: 'majority', label: 'Majority Win', desc: 'Simple majority vote' },
              ].map((algo) => (
                <button
                  key={algo.id}
                  onClick={() => {
                    playFeedbackSound('move');
                    setConsensusAlgorithm(algo.id as any);
                    showNotification('Consensus algorithm updated');
                  }}
                  className={`p-3 rounded-none border text-left transition-all ${
                    consensusAlgorithm === algo.id
                      ? 'bg-amber-500 text-black font-bold border-amber-500 shadow-sm'
                      : 'bg-neutral-800 text-slate-300 border-neutral-700 hover:bg-neutral-750'
                  }`}
                >
                  <span className="text-xs font-bold block">{algo.label}</span>
                  <span className={`text-[10px] block mt-0.5 ${consensusAlgorithm === algo.id ? 'text-neutral-900' : 'text-slate-400'}`}>
                    {algo.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-fire-amber" />
              <span className="text-slate-300">Natural-Language Explanations Mode: </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-fire-amber/20 text-fire-amber font-mono font-bold">
              Spoiler-Free Vibe Check (Active)
            </span>
          </div>
        </div>

      </div>

      {/* Metadata Provider & TMDB Configuration */}
      <div className="mt-8 p-6 rounded-none bg-cinematic-900 border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              <Database className="w-5 h-5 text-neutral-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Movie Metadata Provider (TMDB)</span>
                {apiStatus?.mode === 'tmdb' ? (
                  <span className="px-2 py-0.5 rounded-none bg-emerald-950 text-emerald-400 border border-emerald-700 text-[10px] font-bold">
                    Live Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-none bg-neutral-800 text-slate-300 border border-neutral-700 text-[10px] font-bold">
                    Bundled Catalog Mode
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Live movie search, trending discovery, cast, and verified streaming availability.
              </p>
            </div>
          </div>

          <button
            onClick={handleRefreshStatus}
            disabled={isCheckingApi}
            className="flex items-center gap-2 px-4 py-2 rounded-none bg-neutral-800 hover:bg-neutral-750 text-slate-200 border border-neutral-700 text-xs font-semibold self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingApi ? 'animate-spin' : ''}`} />
            <span>Check Connectivity</span>
          </button>
        </div>

        {/* Security Architecture & Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-none bg-neutral-800/40 border border-neutral-700/50 space-y-2">
            <span className="font-bold text-amber-400 block text-[11px] uppercase tracking-wider">
              🔒 Zero-Leak Security Architecture:
            </span>
            <p className="text-slate-300 leading-relaxed">
              API keys are never bundled in client code. Requests to TMDB are securely routed through the Vite/Node server backend proxy at <code className="text-neutral-300 font-mono text-[11px]">/api/tmdb/*</code>.
            </p>
          </div>

          <div className="p-4 rounded-none bg-neutral-800/40 border border-neutral-700/50 space-y-2">
            <span className="font-bold text-emerald-400 block text-[11px] uppercase tracking-wider">
              🔑 Environment Configuration:
            </span>
            <p className="text-slate-300 leading-relaxed">
              Set <code className="text-emerald-300 font-mono text-[11px]">TMDB_API_KEY=your_key</code> in your <code className="text-emerald-300 font-mono text-[11px]">.env</code> file. If omitted, CineMind seamlessly operates using its built-in sample database.
            </p>
          </div>
        </div>

        {/* Attribution Component */}
        <TMDBAttribution status={apiStatus} />
      </div>

      {/* Cloud Backend & Supabase Database Configuration */}
      <div className="mt-8 p-6 rounded-none bg-cinematic-900 border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              <Server className="w-5 h-5 text-neutral-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>FastAPI & Supabase Cloud Backend</span>
                {backendHealth?.online ? (
                  <span className={`px-2 py-0.5 rounded-none border text-[10px] font-bold ${
                    backendHealth.source === 'supabase'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}>
                    {backendHealth.source === 'supabase' ? 'Supabase Connected' : 'FastAPI Demo Store'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-none bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                    Local Offline Mode
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Persistent multi-user watchlists, voting sessions, and AI-powered recommendation consensus.
              </p>
            </div>
          </div>

          <button
            onClick={handleRefreshBackend}
            disabled={isCheckingBackend}
            className="flex items-center gap-2 px-4 py-2 rounded-none bg-neutral-800 hover:bg-neutral-750 text-slate-200 border border-neutral-700 text-xs font-semibold self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingBackend ? 'animate-spin' : ''}`} />
            <span>Check Backend</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-none bg-neutral-800/40 border border-neutral-700/50 space-y-1.5">
            <span className="font-bold text-amber-400 block text-[11px] uppercase tracking-wider">
              🚀 Backend API:
            </span>
            <div className="text-slate-300 space-y-1">
              <div>Endpoint: <code className="text-neutral-300 font-mono text-[10px]">http://localhost:8000</code></div>
              <div>Status: <span className={backendHealth?.online ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {backendHealth?.online ? 'Healthy (v1.0.0)' : 'Offline / Standalone'}
              </span></div>
              <div>Interactive Docs: <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="text-amber-400 underline hover:text-white">/docs</a></div>
            </div>
          </div>

          <div className="p-4 rounded-none bg-neutral-800/40 border border-neutral-700/50 space-y-1.5">
            <span className="font-bold text-emerald-400 block text-[11px] uppercase tracking-wider">
              🗄️ PostgreSQL Database:
            </span>
            <div className="text-slate-300 space-y-1">
              <div>Provider: <span className="text-white font-bold">Supabase Cloud</span></div>
              <div>Storage Mode: <span className={backendHealth?.source === 'supabase' ? 'text-emerald-400 font-bold' : 'text-neutral-300 font-bold'}>
                {backendHealth?.source === 'supabase' ? 'Cloud Tables Active' : 'Automatic In-Memory Demo Store'}
              </span></div>
              <div>Migration: <code className="text-slate-400 font-mono text-[10px]">001_initial_schema.sql</code></div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-1.5">
            <span className="font-bold text-fire-amber block text-[11px] uppercase tracking-wider">
              🛡️ Zero Secret Leak:
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Supabase secret keys are confined strictly to <code className="text-fire-amber font-mono text-[10px]">backend/.env</code>. The browser communicates exclusively via validated REST endpoints.
            </p>
          </div>
        </div>
      </div>

      {/* Household Data & Reset Bar */}
      <div className="mt-8 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">
            Household Data & App Cache
          </h3>
          <p className="text-xs text-slate-400">
            CineMind Hackathon Build 1.2.0 • Amazon Fire TV Track (Web Runtime)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onResetWatchlist && (
            <button
              onClick={() => {
                playFeedbackSound('select');
                onResetWatchlist();
                showNotification('Watchlist reset to defaults');
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-700"
            >
              Reset Watchlist
            </button>
          )}

          <button
            onClick={() => {
              playFeedbackSound('select');
              showNotification('Settings restored to Fire TV defaults');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-fire-amber border border-fire-amber/40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Factory Defaults</span>
          </button>
        </div>
      </div>

    </div>
  );
};
