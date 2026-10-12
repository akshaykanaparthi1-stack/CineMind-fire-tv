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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-none bg-cinematic-900 border border-neutral-700 text-amber-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Featured Match: {movie.aiInsights.matchScore}% Family Compatibility</span>
            <span className="w-1.5 h-1.5 rounded-none bg-amber-400" />
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
            <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-none border border-amber-400/30">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {movie.rating.toFixed(1)} IMDb
            </span>
            <span className="px-2 py-0.5 rounded-none font-bold uppercase tracking-wider bg-neutral-800 text-slate-200 border border-neutral-700">
              {movie.ageRating}
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {movie.runtimeMinutes} min
            </span>
            <span className="text-slate-400 font-mono">{movie.year}</span>
            <span className="hidden sm:inline-block text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded-none border border-neutral-700 font-semibold">
              ⚡ {movie.moods[0]}
            </span>
          </div>

          {/* Synopsis */}
          <p className="text-sm lg:text-base text-slate-200/90 line-clamp-3 leading-relaxed mb-4 max-w-2xl drop-shadow">
            {movie.synopsis}
          </p>

          {/* AI "Why This Fits Your Evening" Micro-Box */}
          <div className="mb-6 p-3 rounded-none bg-cinematic-900 border border-neutral-800 max-w-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-neutral-800 flex items-center justify-center flex-shrink-0 text-amber-400">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
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
              className={`flex items-center gap-2 px-6 py-3.5 rounded-none font-bold text-sm tracking-wide transition-all tv-focusable ${
                playBtn.isFocused
                  ? 'bg-amber-500 text-black ring-2 ring-white scale-105'
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Watch Details</span>
            </button>

            {/* Family Vote Button */}
            <button
              ref={voteBtn.ref as any}
              onClick={() => onStartFamilyVote(movie)}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-none font-bold text-sm tracking-wide transition-all tv-focusable ${
                voteBtn.isFocused
                  ? 'bg-neutral-700 text-white ring-2 ring-white scale-105'
                  : 'bg-neutral-800 text-white hover:bg-neutral-750 border border-neutral-700'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>Vote With Family</span>
            </button>

            {/* Shared Watchlist Button */}
            <button
              ref={watchlistBtn.ref as any}
              onClick={() => onToggleWatchlist(movie)}
              className={`flex items-center gap-2 px-4 py-3.5 rounded-none font-semibold text-sm transition-all tv-focusable ${
                watchlistBtn.isFocused
                  ? 'bg-neutral-700 text-white ring-2 ring-white scale-105'
                  : inWatchlist
                  ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                  : 'bg-cinematic-900 text-slate-200 hover:bg-neutral-800 border border-neutral-700'
              }`}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{inWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
            </button>

            {/* Full Specs Button */}
            <button
              ref={detailsBtn.ref as any}
              onClick={() => onSelectMovie(movie)}
              className={`flex items-center gap-2 px-4 py-3.5 rounded-none font-semibold text-sm bg-cinematic-900 text-slate-300 hover:text-white hover:bg-neutral-800 border border-neutral-700 transition-all tv-focusable ${
                detailsBtn.isFocused ? 'tv-focused ring-2 ring-white' : ''
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
