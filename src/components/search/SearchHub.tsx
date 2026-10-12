import React, { useState, useMemo, useEffect } from 'react';
import type { Movie, GenreType } from '../../types';
import { MOVIES_DATABASE, GENRES_LIST } from '../../data/moviesData';
import { MovieCard } from '../movies/MovieCard';
import { Search, Mic, X } from 'lucide-react';
import { useTVNavigation } from '../../context/TVNavigationContext';

interface SearchHubProps {
  onSelectMovie: (movie: Movie) => void;
  watchlistIds: string[];
  onToggleWatchlist: (movie: Movie) => void;
  initialQuery?: string;
}

export const SearchHub: React.FC<SearchHubProps> = ({
  onSelectMovie,
  watchlistIds,
  onToggleWatchlist,
  initialQuery = '',
}) => {
  const { playFeedbackSound } = useTVNavigation();
  const [query, setQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState<GenreType | 'All'>('All');
  const [selectedQuickChip, setSelectedQuickChip] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const quickChips = [
    { label: '🍕 Under 95m Quick Watches', filter: 'short' },
    { label: '🌟 95%+ High AI Compatibility', filter: 'high-match' },
    { label: '👨‍👩‍👧‍👦 100% Family Friendly (G/PG)', filter: 'family' },
    { label: '🚀 Mind-Expanding Sci-Fi', filter: 'scifi' },
    { label: '😂 Belly-Laugh Comedies', filter: 'comedy' },
  ];

  const handleChipClick = (chipFilter: string) => {
    playFeedbackSound('move');
    if (selectedQuickChip === chipFilter) {
      setSelectedQuickChip(null);
    } else {
      setSelectedQuickChip(chipFilter);
    }
  };

  const results = useMemo(() => {
    return MOVIES_DATABASE.filter((movie) => {
      // Text query match
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesTitle = movie.title.toLowerCase().includes(q);
        const matchesSynopsis = movie.synopsis.toLowerCase().includes(q);
        const matchesCast = movie.cast.some((c) => c.toLowerCase().includes(q));
        const matchesDirector = movie.director.toLowerCase().includes(q);
        const matchesMood = movie.moods.some((m) => m.toLowerCase().includes(q));
        const matchesGenre = movie.genres.some((g) => g.toLowerCase().includes(q));

        if (!matchesTitle && !matchesSynopsis && !matchesCast && !matchesDirector && !matchesMood && !matchesGenre) {
          return false;
        }
      }

      // Genre filter
      if (selectedGenre !== 'All' && !movie.genres.includes(selectedGenre)) {
        return false;
      }

      // Quick chip filter
      if (selectedQuickChip === 'short' && movie.runtimeMinutes > 95) return false;
      if (selectedQuickChip === 'high-match' && movie.aiInsights.matchScore < 95) return false;
      if (selectedQuickChip === 'family' && !['G', 'PG'].includes(movie.ageRating)) return false;
      if (selectedQuickChip === 'scifi' && !movie.genres.includes('Science Fiction')) return false;
      if (selectedQuickChip === 'comedy' && !movie.genres.includes('Comedy')) return false;

      return true;
    });
  }, [query, selectedGenre, selectedQuickChip]);

  return (
    <div className="w-full max-w-[1800px] mx-auto px-8 py-8 animate-fade-in select-none">
      
      {/* Header & Big TV Search Input */}
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-extrabold font-display text-white mb-2">
          Discover Anything with CineMind AI
        </h1>
        <p className="text-xs text-slate-400 mb-6">
          Search by actors, titles, themes, or ask for specific vibes.
        </p>

        {/* 10-Foot Search Bar */}
        <div className="relative flex items-center">
          <div className="absolute left-5 text-slate-400">
            <Search className="w-6 h-6 text-fire-amber" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, actors ('Tom Cruise'), genres, or moods ('Excited')..."
            className="w-full pl-14 pr-28 py-4 rounded-2xl bg-cinematic-900 border-2 border-slate-700/80 text-white placeholder-slate-500 font-medium text-base focus:outline-none focus:border-fire-amber focus:ring-4 focus:ring-fire-amber/30 transition-all shadow-xl"
          />

          <div className="absolute right-4 flex items-center gap-2">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold">
              <Mic className="w-3 h-3 text-cyan-400" />
              <span>Voice Ready</span>
            </div>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          {quickChips.map((chip) => {
            const isSelected = selectedQuickChip === chip.filter;
            return (
              <button
                key={chip.filter}
                onClick={() => handleChipClick(chip.filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-fire-amber text-black border-fire-amber shadow-md scale-105'
                    : 'bg-cinematic-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Genre Filter Sub-Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedGenre('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
              selectedGenre === 'All'
                ? 'bg-white text-black'
                : 'bg-cinematic-900 text-slate-400 hover:text-white'
            }`}
          >
            All Genres
          </button>
          {GENRES_LIST.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                selectedGenre === genre
                  ? 'bg-fire-amber text-black'
                  : 'bg-cinematic-900 text-slate-400 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {results.length} matches
        </span>
      </div>

      {/* Results View */}
      {results.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-cinematic-900/50 border border-slate-800">
          <div className="text-4xl mb-3">🎬</div>
          <h3 className="text-lg font-bold text-white mb-1">
            No Movies Found for "{query}"
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Try a broader keyword, clear the filter chips, or browse by mood from the top menu.
          </p>
          <button
            onClick={() => {
              setQuery('');
              setSelectedGenre('All');
              setSelectedQuickChip(null);
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700"
          >
            Reset Search & Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {results.map((movie, index) => (
            <div key={movie.id} className="flex justify-center">
              <MovieCard
                movie={movie}
                groupName="search-results"
                order={index}
                size="standard"
                onSelect={onSelectMovie}
                inWatchlist={watchlistIds.includes(movie.id)}
                onToggleWatchlist={onToggleWatchlist}
              />
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
