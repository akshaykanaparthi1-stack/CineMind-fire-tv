import React, { useState, useEffect } from 'react';
import type { Movie } from '../../types';
import { useTVFocus } from '../../context/TVNavigationContext';
import { 
  X, 
  Play, 
  Vote, 
  Bookmark, 
  Check, 
  Star, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Info
} from 'lucide-react';

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  onStartFamilyVote: (movie: Movie) => void;
  inWatchlist: boolean;
  onToggleWatchlist: (movie: Movie) => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  onClose,
  onStartFamilyVote,
  inWatchlist,
  onToggleWatchlist,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'safety' | 'cast'>('ai');
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);

  useEffect(() => {
    const handleTVBack = () => {
      onClose();
    };
    window.addEventListener('tv:back', handleTVBack);
    return () => window.removeEventListener('tv:back', handleTVBack);
  }, [onClose]);

  const closeBtn = useTVFocus('modal-btn-close', 'modal-header', {
    order: 0,
    onSelect: onClose,
  });

  const playBtn = useTVFocus('modal-btn-play', 'modal-actions', {
    order: 1,
    onSelect: () => setIsPlayingTrailer(true),
  });

  const voteBtn = useTVFocus('modal-btn-vote', 'modal-actions', {
    order: 2,
    onSelect: () => movie && onStartFamilyVote(movie),
  });

  const watchlistBtn = useTVFocus('modal-btn-watchlist', 'modal-actions', {
    order: 3,
    onSelect: () => movie && onToggleWatchlist(movie),
  });

  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto no-scrollbar rounded-3xl bg-cinematic-900 border border-slate-700/80 shadow-[0_25px_70px_rgba(0,0,0,0.95)] text-slate-100 flex flex-col">
        
        {/* Backdrop Banner / Video Player */}
        <div className="relative w-full h-80 sm:h-96 overflow-hidden flex-shrink-0">
          {isPlayingTrailer ? (
            <div className="relative w-full h-full bg-black flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-fire-amber/20 border border-fire-amber flex items-center justify-center mb-3 animate-pulse">
                <Play className="w-8 h-8 text-fire-amber fill-fire-amber ml-1" />
              </div>
              <h4 className="text-lg font-bold text-white font-display mb-1">
                Now Streaming Fire TV Preview
              </h4>
              <p className="text-xs text-slate-400 max-w-md">
                Simulating high-definition 4K HDR playback for "{movie.title}" on {movie.streamingProvider}.
              </p>
              <button
                onClick={() => setIsPlayingTrailer(false)}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Back to Poster Preview
              </button>
            </div>
          ) : (
            <>
              <img
                src={movie.backdropUrl}
                alt={movie.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cinematic-900 via-cinematic-900/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-cinematic-900/90 via-transparent to-transparent" />
            </>
          )}

          {/* Close Modal Button */}
          <button
            ref={closeBtn.ref as any}
            onClick={onClose}
            className={`absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/70 hover:bg-slate-800 text-white transition-all tv-focusable ${
              closeBtn.isFocused ? 'tv-focused ring-2 ring-fire-amber' : ''
            }`}
            title="Close (ESC / Back)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Floating Badges over Backdrop */}
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-1 rounded bg-fire-amber text-black font-extrabold text-xs tracking-wider uppercase shadow-md">
                  {movie.streamingProvider}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold tracking-wider bg-slate-800 border border-slate-600 text-white">
                  {movie.ageRating}
                </span>
                <span className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-black/60 px-2.5 py-0.5 rounded backdrop-blur-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {movie.rating.toFixed(1)} IMDb
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-md">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {movie.runtimeMinutes} min
                </span>
                <span className="text-xs text-slate-400 font-mono bg-black/60 px-2 py-0.5 rounded">
                  {movie.year}
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight drop-shadow-md">
                {movie.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 italic mt-0.5">
                "{movie.tagline}"
              </p>
            </div>

            {/* CineMind AI Score Stamp */}
            <div className="p-3 rounded-2xl bg-cinematic-950/90 border border-fire-amber/50 backdrop-blur-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-fire-amber/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-fire-amber animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  CineMind AI Match
                </span>
                <span className="text-lg font-black text-fire-amber font-display">
                  {movie.aiInsights.matchScore}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col">
          
          {/* Action Buttons Row */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-800/80 flex-wrap">
            <button
              ref={playBtn.ref as any}
              onClick={() => setIsPlayingTrailer(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all tv-focusable ${
                playBtn.isFocused
                  ? 'bg-fire-amber text-black ring-4 ring-fire-amber/60 scale-105 shadow-lg shadow-fire-amber/40'
                  : 'bg-white text-black hover:bg-slate-200'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Watch Trailer</span>
            </button>

            <button
              ref={voteBtn.ref as any}
              onClick={() => onStartFamilyVote(movie)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm tracking-wide transition-all tv-focusable ${
                voteBtn.isFocused
                  ? 'bg-neon-purple text-white ring-4 ring-neon-purple/60 scale-105 shadow-lg'
                  : 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white hover:brightness-110 border border-purple-500/40'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>Start Family Vote</span>
            </button>

            <button
              ref={watchlistBtn.ref as any}
              onClick={() => onToggleWatchlist(movie)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all tv-focusable ${
                watchlistBtn.isFocused
                  ? 'bg-slate-700 text-white ring-4 ring-fire-amber scale-105'
                  : inWatchlist
                  ? 'bg-fire-amber/20 text-fire-amber border border-fire-amber/50'
                  : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{inWatchlist ? 'Added to Watchlist' : 'Add to Watchlist'}</span>
            </button>
          </div>

          {/* Synopsis */}
          <div className="my-5">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
              Synopsis
            </h4>
            <p className="text-sm leading-relaxed text-slate-200">
              {movie.synopsis}
            </p>
          </div>

          {/* Tab Switcher: AI Insights / Parental Safety / Cast & Info */}
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('ai')}
              className={`pb-2.5 px-3 text-xs font-bold tracking-wider uppercase transition-colors border-b-2 ${
                activeTab === 'ai'
                  ? 'border-fire-amber text-fire-amber'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ✨ AI Match Breakdown
            </button>
            <button
              onClick={() => setActiveTab('safety')}
              className={`pb-2.5 px-3 text-xs font-bold tracking-wider uppercase transition-colors border-b-2 ${
                activeTab === 'safety'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              🛡️ Family Safety & Ratings
            </button>
            <button
              onClick={() => setActiveTab('cast')}
              className={`pb-2.5 px-3 text-xs font-bold tracking-wider uppercase transition-colors border-b-2 ${
                activeTab === 'cast'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              👥 Cast & Metadata
            </button>
          </div>

          {/* Tab 1: AI Insights */}
          {activeTab === 'ai' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-cinematic-950/70 border border-fire-amber/30">
                <div className="flex items-center gap-2 text-fire-amber text-xs font-bold uppercase mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Why CineMind AI Recommends This</span>
                </div>
                <p className="text-sm font-semibold text-white mb-2">
                  "{movie.aiInsights.headline}"
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {movie.aiInsights.fitReasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-fire-amber font-bold">✓</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tone Meters (Humor, Thrill, Emotion, Pacing) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Humor Index
                  </span>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-1">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${movie.aiInsights.toneScores.humor}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-200">
                    {movie.aiInsights.toneScores.humor}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Thrill / Peril
                  </span>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-1">
                    <div
                      className="bg-orange-500 h-full rounded-full"
                      style={{ width: `${movie.aiInsights.toneScores.thrill}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-200">
                    {movie.aiInsights.toneScores.thrill}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Emotional Heart
                  </span>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-1">
                    <div
                      className="bg-pink-500 h-full rounded-full"
                      style={{ width: `${movie.aiInsights.toneScores.emotional}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-200">
                    {movie.aiInsights.toneScores.emotional}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Pacing Energy
                  </span>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-1">
                    <div
                      className="bg-cyan-400 h-full rounded-full"
                      style={{ width: `${movie.aiInsights.toneScores.pacing}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-200">
                    {movie.aiInsights.toneScores.pacing}%
                  </span>
                </div>
              </div>

              {/* Spoiler-Free Vibe Check */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-3">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Spoiler-Free Vibe Check: </strong>
                  {movie.aiInsights.spoilerFreeVibeCheck}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Family Safety Guide */}
          {activeTab === 'safety' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Age Verdict: {movie.ageRating} Rated</span>
                </div>
                <p className="text-sm font-semibold text-emerald-200">
                  {movie.familySafety.ageAppropriateVerdict}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                    Violence & Peril
                  </span>
                  <p className="text-xs text-slate-300">
                    {movie.familySafety.violence}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">
                    Language & Slang
                  </span>
                  <p className="text-xs text-slate-300">
                    {movie.familySafety.language}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-pink-400 block mb-1">
                    Sensitive Themes
                  </span>
                  <p className="text-xs text-slate-300">
                    {movie.familySafety.themes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Cast & Metadata */}
          {activeTab === 'cast' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-2">
                    Director
                  </span>
                  <span className="text-sm font-bold text-white">
                    {movie.director}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-2">
                    Genres
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.genres.map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-200"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs uppercase font-bold text-slate-400 block mb-2">
                  Starring Cast
                </span>
                <div className="flex flex-wrap gap-2">
                  {movie.cast.map((actor) => (
                    <span
                      key={actor}
                      className="px-3 py-1 rounded-lg text-xs bg-slate-900 border border-slate-700 text-slate-200 font-medium"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
