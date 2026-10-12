import React from 'react';
import type { Movie } from '../../types';
import { useTVFocus } from '../../context/TVNavigationContext';
import { 
  Play, 
  Vote, 
  Bookmark, 
  Check, 
  Info, 
  Star, 
  Clock, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';

interface HeroBannerProps {
  movie: Movie;
  onSelectMovie: (movie: Movie) => void;
  onStartFamilyVote: (movie: Movie) => void;
  inWatchlist: boolean;
  onToggleWatchlist: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  onSelectMovie,
  onStartFamilyVote,
  inWatchlist,
  onToggleWatchlist,
}) => {
  const playBtn = useTVFocus('hero-btn-play', 'hero-actions', {
    order: 0,
    onSelect: () => onSelectMovie(movie),
  });

  const voteBtn = useTVFocus('hero-btn-vote', 'hero-actions', {
    order: 1,
    onSelect: () => onStartFamilyVote(movie),
  });

  const watchlistBtn = useTVFocus('hero-btn-watchlist', 'hero-actions', {
    order: 2,
    onSelect: () => onToggleWatchlist(movie),
  });

  const detailsBtn = useTVFocus('hero-btn-details', 'hero-actions', {
    order: 3,
    onSelect: () => onSelectMovie(movie),
  });

  return (
    <div className="relative w-full h-[580px] lg:h-[640px] overflow-hidden select-none">
      
      {/* Background Backdrop Image */}
      <div className="absolute inset-0">
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-90 transform scale-100 transition-transform duration-1000"
        />
        {/* Layered Cinematic Gradients (Bottom, Left, and Top) */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinematic-950 via-cinematic-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinematic-950 via-cinematic-950/80 to-transparent w-full md:w-3/4" />
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-cinematic-950/80 to-transparent" />
      </div>

      {/* Hero Content Overlay */}
      <div className="relative z-10 h-full max-w-[1920px] mx-auto px-8 flex flex-col justify-end pb-12">
        <div className="max-w-3xl">
          
          {/* AI Recommendation Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cinematic-900/90 border border-fire-amber/60 text-fire-amber text-xs font-semibold backdrop-blur-md mb-3 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-fire-amber animate-pulse" />
            <span>AI Featured Match: {movie.aiInsights.matchScore}% Family Compatibility</span>
            <span className="w-1.5 h-1.5 rounded-full bg-fire-amber" />
            <span className="text-white font-normal">{movie.streamingProvider}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl lg:text-6xl font-black font-display text-white tracking-tight leading-none drop-shadow-md">
            {movie.title}
          </h1>

          {/* Tagline */}
          <p className="text-base lg:text-lg text-slate-300 italic font-medium mt-2">
            "{movie.tagline}"
          </p>

          {/* Metadata Specs Bar */}
          <div className="flex items-center gap-3.5 my-3 text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/30">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {movie.rating.toFixed(1)} IMDb
            </span>
            <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-800 text-slate-200 border border-slate-700">
              {movie.ageRating}
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {movie.runtimeMinutes} min
            </span>
            <span className="text-slate-400 font-mono">{movie.year}</span>
            <span className="hidden sm:inline-block text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 font-semibold">
              ⚡ {movie.moods[0]}
            </span>
          </div>

          {/* Synopsis */}
          <p className="text-sm lg:text-base text-slate-200/90 line-clamp-3 leading-relaxed mb-4 max-w-2xl drop-shadow">
            {movie.synopsis}
          </p>

          {/* AI "Why This Fits Your Evening" Micro-Box */}
          <div className="mb-6 p-3 rounded-xl bg-slate-900/80 border border-fire-amber/30 backdrop-blur-md max-w-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-fire-amber/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-fire-amber" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-white block">
                {movie.aiInsights.headline}
              </span>
              <span className="text-slate-400 line-clamp-1">
                {movie.aiInsights.fitReasons[0]}
              </span>
            </div>
          </div>

          {/* 10-Foot Action Buttons */}
          <div className="flex items-center gap-3.5 flex-wrap">
            
            {/* Play Button */}
            <button
              ref={playBtn.ref as any}
              onClick={() => onSelectMovie(movie)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all tv-focusable ${
                playBtn.isFocused
                  ? 'bg-fire-amber text-black ring-4 ring-fire-amber/60 scale-105 shadow-xl shadow-fire-amber/40'
                  : 'bg-white text-black hover:bg-slate-200'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Watch Details</span>
            </button>

            {/* Family Vote Button */}
            <button
              ref={voteBtn.ref as any}
              onClick={() => onStartFamilyVote(movie)}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all tv-focusable ${
                voteBtn.isFocused
                  ? 'bg-neon-purple text-white ring-4 ring-neon-purple/60 scale-105 shadow-xl shadow-neon-purple/40'
                  : 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white hover:brightness-110 border border-purple-500/40'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>Vote With Family</span>
            </button>

            {/* Shared Watchlist Button */}
            <button
              ref={watchlistBtn.ref as any}
              onClick={() => onToggleWatchlist(movie)}
              className={`flex items-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all tv-focusable ${
                watchlistBtn.isFocused
                  ? 'bg-slate-700 text-white ring-4 ring-fire-amber scale-105'
                  : inWatchlist
                  ? 'bg-fire-amber/20 text-fire-amber border border-fire-amber/50'
                  : 'bg-slate-900/80 text-slate-200 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{inWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
            </button>

            {/* Full Specs Button */}
            <button
              ref={detailsBtn.ref as any}
              onClick={() => onSelectMovie(movie)}
              className={`flex items-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-all tv-focusable ${
                detailsBtn.isFocused ? 'tv-focused ring-2 ring-fire-amber' : ''
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Parental Guide</span>
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};
