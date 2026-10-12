import React, { useRef } from 'react';
import type { Movie } from '../../types';
import { MovieCard } from './MovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MovieRailProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  movies: Movie[];
  groupName: string;
  onSelectMovie: (movie: Movie) => void;
  watchlistIds?: string[];
  onToggleWatchlist?: (movie: Movie) => void;
  cardSize?: 'standard' | 'large' | 'compact';
}

export const MovieRail: React.FC<MovieRailProps> = ({
  title,
  subtitle,
  icon,
  movies,
  groupName,
  onSelectMovie,
  watchlistIds = [],
  onToggleWatchlist,
  cardSize = 'standard',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -650 : 650;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (movies.length === 0) {
    return null;
  }

  return (
    <section className="my-7 px-8 relative group/rail">
      {/* Rail Title Header */}
      <div className="flex items-baseline justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-fire-amber">{icon}</span>}
          <div>
            <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
              {title}
              <span className="text-xs font-mono font-normal text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                {movies.length}
              </span>
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Rail Left & Right Navigation Scroll Buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-cinematic-950/90 border border-slate-700/80 text-white flex items-center justify-center opacity-0 group-hover/rail:opacity-100 hover:bg-fire-amber hover:text-black hover:border-fire-amber shadow-2xl transition-all duration-200"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-cinematic-950/90 border border-slate-700/80 text-white flex items-center justify-center opacity-0 group-hover/rail:opacity-100 hover:bg-fire-amber hover:text-black hover:border-fire-amber shadow-2xl transition-all duration-200"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-5 overflow-x-auto no-scrollbar scroll-smooth py-3 px-1"
      >
        {movies.map((movie, index) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            groupName={groupName}
            order={index}
            size={cardSize}
            onSelect={onSelectMovie}
            inWatchlist={watchlistIds.includes(movie.id)}
            onToggleWatchlist={onToggleWatchlist}
          />
        ))}
      </div>
    </section>
  );
};
