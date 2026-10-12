import React, { useState, useEffect, useCallback } from 'react';
import type { Movie, GenreType } from '../../types';
import type { TMDBApiStatus } from '../../types/tmdb';
import { GENRES_LIST } from '../../data/moviesData';
import { tmdbMovieService } from '../../services/tmdbService';
import { MovieCard } from '../movies/MovieCard';
import { TMDBAttribution } from '../common/TMDBAttribution';
import { Search, Mic, X, Globe, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTVNavigation } from '../../context/TVNavigationContext';

interface SearchHubProps {
  onSelectMovie: (movie: Movie) => void;
  watchlistIds: string[];
  onToggleWatchlist: (movie: Movie) => void;
  initialQuery?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'all', label: 'All Languages' },
  { code: 'en', label: 'English (EN)' },
  { code: 'es', label: 'Spanish (ES)' },
  { code: 'ja', label: 'Japanese (JA)' },
  { code: 'ko', label: 'Korean (KO)' },
  { code: 'fr', label: 'French (FR)' },
  { code: 'de', label: 'German (DE)' },
  { code: 'hi', label: 'Hindi (HI)' },
];

export const SearchHub: React.FC<SearchHubProps> = ({
  onSelectMovie,
  watchlistIds,
  onToggleWatchlist,
  initialQuery = '',
}) => {
  const { playFeedbackSound } = useTVNavigation();
  const [query, setQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState<GenreType | 'All'>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedQuickChip, setSelectedQuickChip] = useState<string | null>(null);

  // Async search states
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<TMDBApiStatus | undefined>(undefined);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    tmdbMovieService.getStatus().then(setApiStatus);
  }, []);

  const quickChips = [
    { label: '🍕 Under 95m Quick Watches', filter: 'short' },
    { label: '🌟 90%+ High Match Score', filter: 'high-match' },
    { label: '👨‍👩‍👧‍👦 Family Friendly (G/PG)', filter: 'family' },
    { label: '🚀 Sci-Fi Adventures', filter: 'scifi' },
    { label: '😂 Laugh-Out-Loud Comedies', filter: 'comedy' },
  ];

  const handleChipClick = (chipFilter: string) => {
    playFeedbackSound('move');
    if (selectedQuickChip === chipFilter) {
      setSelectedQuickChip(null);
    } else {
      setSelectedQuickChip(chipFilter);
    }
  };

  // Perform debounced search via tmdbMovieService
  const performSearch = useCallback(async (searchQuery: string, genre: GenreType | 'All', lang: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await tmdbMovieService.searchMovies(searchQuery, {
        genre: genre !== 'All' ? genre : undefined,
        language: lang !== 'all' ? lang : undefined,
      });

      setIsRateLimited(Boolean(res.isRateLimited));
      if (res.error && res.error !== 'FALLBACK') {
        setErrorMessage(res.error);
      }

      let filtered = res.movies;

      // Apply quick chips in memory
      if (selectedQuickChip === 'short') filtered = filtered.filter((m) => m.runtimeMinutes <= 95);
      if (selectedQuickChip === 'high-match') filtered = filtered.filter((m) => m.aiInsights.matchScore >= 90);
      if (selectedQuickChip === 'family') filtered = filtered.filter((m) => ['G', 'PG'].includes(m.ageRating));
      if (selectedQuickChip === 'scifi') filtered = filtered.filter((m) => m.genres.includes('Science Fiction'));
      if (selectedQuickChip === 'comedy') filtered = filtered.filter((m) => m.genres.includes('Comedy'));

      setMovies(filtered);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing search';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedQuickChip]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, selectedGenre, selectedLanguage);
    }, 280);

    return () => clearTimeout(timer);
  }, [query, selectedGenre, selectedLanguage, performSearch]);

  const handleResetFilters = () => {
    playFeedbackSound('select');
    setQuery('');
    setSelectedGenre('All');
    setSelectedLanguage('all');
    setSelectedQuickChip(null);
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto px-8 py-8 animate-fade-in select-none">
      
      {/* Header & Big TV Search Input */}
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-3xl font-extrabold font-display text-white">
            Discover Anything with CineMind AI
          </h1>
          <TMDBAttribution status={apiStatus} compact />
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Real-time metadata powered by TMDB API. Search titles, actors, genres, or language.
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
            placeholder="Search movie titles ('Interstellar', 'Moana', 'Spider-Man')..."
            className="w-full pl-14 pr-28 py-4 rounded-2xl bg-cinematic-900 border-2 border-slate-700/80 text-white placeholder-slate-500 font-medium text-base focus:outline-none focus:border-fire-amber focus:ring-4 focus:ring-fire-amber/30 transition-all shadow-xl"
          />

          <div className="absolute right-4 flex items-center gap-2">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-full text-slate-400 hover:text-white"
                title="Clear search"
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

      {/* Language & Genre Filter Sub-Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        
        {/* Genre Selector */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
          <button
            onClick={() => { playFeedbackSound('move'); setSelectedGenre('All'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
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
              onClick={() => { playFeedbackSound('move'); setSelectedGenre(genre); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedGenre === genre
                  ? 'bg-fire-amber text-black'
                  : 'bg-cinematic-900 text-slate-400 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Language Filter & Results Count */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cinematic-900 border border-slate-700 text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-fire-amber" />
            <select
              value={selectedLanguage}
              onChange={(e) => {
                playFeedbackSound('select');
                setSelectedLanguage(e.target.value);
              }}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
            {isLoading ? 'Searching...' : `Showing ${movies.length} matches`}
          </span>
        </div>
      </div>

      {/* Rate-Limit Warning State */}
      {isRateLimited && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-600/60 flex items-center justify-between text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>TMDB Rate Limit Notice:</strong> API request frequency limit reached (HTTP 429). Temporarily serving local catalog until rate window resets.
            </span>
          </div>
          <button
            onClick={() => performSearch(query, selectedGenre, selectedLanguage)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-white font-bold text-[11px]"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-600/60 flex items-center justify-between text-rose-200 text-xs">
          <span>{errorMessage}</span>
          <button
            onClick={() => performSearch(query, selectedGenre, selectedLanguage)}
            className="px-3 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-white font-bold text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-full aspect-[2/3] rounded-2xl bg-slate-800/60 border border-slate-700/50 animate-pulse flex flex-col justify-end p-4"
            >
              <div className="h-4 bg-slate-700/80 rounded mb-2 w-3/4" />
              <div className="h-3 bg-slate-700/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        /* Empty State */
        <div className="p-16 text-center rounded-3xl bg-cinematic-900/50 border border-slate-800">
          <div className="text-4xl mb-3">🎬</div>
          <h3 className="text-lg font-bold text-white mb-1">
            No Movies Found for "{query || selectedGenre}"
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
            We couldn't find matches matching your current combination of keywords, genre, and language filters. Try another title or reset your filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2.5 rounded-xl bg-fire-amber text-black text-xs font-bold hover:brightness-110 shadow-lg"
          >
            Reset Search & Filters
          </button>
        </div>
      ) : (
        /* Results Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {movies.map((movie, index) => (
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

      {/* Attribution footer */}
      <div className="mt-12">
        <TMDBAttribution status={apiStatus} />
      </div>

    </div>
  );
};
