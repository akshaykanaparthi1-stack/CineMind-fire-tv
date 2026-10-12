import React from 'react';
import type { Movie } from '../../types';
import { useTVFocus } from '../../context/TVNavigationContext';
import { Star, Clock, Bookmark, Sparkles, Check } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  groupName: string;
  order: number;
  onSelect: (movie: Movie) => void;
  inWatchlist?: boolean;
  onToggleWatchlist?: (movie: Movie) => void;
  size?: 'standard' | 'large' | 'compact';
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  groupName,
  order,
  onSelect,
  inWatchlist = false,
  onToggleWatchlist,
  size = 'standard',
}) => {
  const cardId = `card-${groupName}-${movie.id}`;

  const { ref, isFocused } = useTVFocus(cardId, groupName, {
    order,
    onSelect: () => onSelect(movie),
  });

  const getAgeRatingBadge = (rating: string) => {
    switch (rating) {
      case 'G':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'PG':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'PG-13':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'R':
      case 'TV-MA':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const widthClass = {
    standard: 'w-60 min-w-[240px]',
    large: 'w-72 min-w-[288px]',
    compact: 'w-52 min-w-[208px]',
  }[size];

  const heightClass = {
    standard: 'h-[360px]',
    large: 'h-[420px]',
    compact: 'h-[310px]',
  }[size];

  return (
    <div
      ref={ref as any}
      tabIndex={0}
      onClick={() => onSelect(movie)}
      className={`relative group flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 select-none tv-focusable ${widthClass} ${heightClass} ${
        isFocused
          ? 'scale-105 z-30 shadow-[0_0_0_3px_#ff9900,0_16px_36px_rgba(255,153,0,0.45)]'
          : 'hover:scale-102 hover:shadow-2xl border border-white/5'
      }`}
    >
      {/* Movie Poster Image with Gradient Overlay */}
      <img
        src={movie.posterUrl}
        alt={movie.title}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Dark vignette falloff gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06080e] via-[#06080e]/50 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

      {/* Top Floating Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        
        {/* CineMind AI Match Score */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cinematic-950/85 backdrop-blur-md border border-fire-amber/50 text-fire-amber font-display font-bold text-xs shadow-lg">
          <Sparkles className="w-3 h-3 text-fire-amber animate-pulse" />
          <span>{movie.aiInsights.matchScore}% Match</span>
        </div>

        {/* Age Rating Badge */}
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border backdrop-blur-md ${getAgeRatingBadge(
            movie.ageRating
          )}`}
        >
          {movie.ageRating}
        </span>
      </div>

      {/* Watchlist Quick Action Button */}
      {onToggleWatchlist && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatchlist(movie);
          }}
          className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md transition-all ${
            inWatchlist
              ? 'bg-fire-amber text-black opacity-100'
              : 'bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80'
          }`}
          title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          {inWatchlist ? <Check className="w-4 h-4 stroke-[3]" /> : <Bookmark className="w-4 h-4" />}
        </button>
      )}

      {/* Bottom Content Metadata */}
      <div className="absolute bottom-0 inset-x-0 p-4 z-10 flex flex-col justify-end">
        
        {/* Streaming Provider & Mood Badge */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700">
            {movie.streamingProvider}
          </span>
          <span className="text-[10px] text-cyan-300 font-medium">
            {movie.moods[0]}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white line-clamp-1 font-display group-hover:text-fire-amber transition-colors">
          {movie.title}
        </h3>

        {/* Info stats (IMDb, Runtime, Year) */}
        <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
          <span className="flex items-center gap-1 text-amber-400 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {movie.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3" />
            {movie.runtimeMinutes}m
          </span>
          <span className="text-slate-400">{movie.year}</span>
        </div>

        {/* AI Insight Snippet (visible on focus/hover for 10-foot television clarity) */}
        <p className="text-[11px] text-slate-300/90 line-clamp-2 mt-2 leading-snug border-t border-slate-700/50 pt-2 transition-all">
          <span className="text-fire-amber font-semibold">AI Vibe: </span>
          {movie.aiInsights.bestFor}
        </p>
      </div>

      {/* Focus Ring Light Bar */}
      {isFocused && (
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-fire-amber via-fire-orange to-fire-gold animate-pulse z-20" />
      )}
    </div>
  );
};
