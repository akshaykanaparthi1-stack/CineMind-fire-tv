import React, { useState, useEffect, useCallback } from 'react';
import type { Movie, GenreType, UserProfile } from '../../types';
import type { TMDBApiStatus } from '../../types/tmdb';
import { GENRES_LIST } from '../../data/moviesData';
import { tmdbMovieService } from '../../services/tmdbService';
import { apiClient } from '../../services/apiClient';
import { MovieCard } from '../movies/MovieCard';
import { TMDBAttribution } from '../common/TMDBAttribution';
import { 
  Search, 
  Mic, 
  X, 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  Clock, 
  RefreshCw, 
  Film, 
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { useTVNavigation } from '../../context/TVNavigationContext';

interface SearchHubProps {
  onSelectMovie: (movie: Movie) => void;
  watchlistIds: string[];
  onToggleWatchlist: (movie: Movie) => void;
  initialQuery?: string;
  activeProfile?: UserProfile;
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
  activeProfile,
}) => {
  const { playFeedbackSound } = useTVNavigation();
  const [searchMode, setSearchMode] = useState<'ai_assistant' | 'tmdb_search'>('ai_assistant');
  const [query, setQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState<GenreType | 'All'>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  // Async TMDB Search states
  const [tmdbMovies, setTmdbMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<TMDBApiStatus | undefined>(undefined);

  // AI Assistant specific states
  const [aiResponse, setAiResponse] = useState<{
    parsedFilters: any;
    matchedMovies: Movie[];
    recommendationExplanation: string;
    providerUsed: string;
    hasSufficientContext: boolean;
    verifiedDatasetCount: number;
    restrictedCount: number;
  } | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    tmdbMovieService.getStatus().then(setApiStatus);
  }, []);

  const aiPromptPills = [
    { label: '🍿 Funny family movie under 100 mins', prompt: 'Find a funny family movie under 100 minutes' },
    { label: '🚀 Relaxed sci-fi for movie night', prompt: 'Relaxed space sci-fi with mind-bending ideas' },
    { label: '🦖 Animated adventure without violence', prompt: 'Animated adventure movie with no violence for kids' },
    { label: '🔍 Clever whodunnit mystery', prompt: 'Clever suspense mystery with fast pacing' },
    { label: '💖 Feel-good romantic comedy', prompt: 'Romantic comedy with uplifting happy ending' },
  ];

  // Perform AI Assistant search
  const performAiSearch = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim()) {
      setAiResponse(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.assistantQuery(userPrompt, activeProfile?.id);
      if (res) {
        setAiResponse(res);
      } else {
        setErrorMessage('AI Assistant currently unavailable. Falling back to title search.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reaching assistant';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile?.id]);

  // Perform TMDB Search
  const performTmdbSearch = useCallback(async (searchQuery: string, genre: GenreType | 'All', lang: string) => {
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

      setTmdbMovies(res.movies);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing search';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search trigger based on active mode
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchMode === 'ai_assistant') {
        if (query.trim()) {
          performAiSearch(query);
        } else {
          // Pre-populate with default query for instant discovery
          performAiSearch('Find a funny family movie under 100 minutes');
        }
      } else {
        performTmdbSearch(query, selectedGenre, selectedLanguage);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, searchMode, selectedGenre, selectedLanguage, performAiSearch, performTmdbSearch]);

  const handleSelectPill = (prompt: string) => {
    playFeedbackSound('select');
    setQuery(prompt);
  };

  const handleClear = () => {
    playFeedbackSound('select');
    setQuery('');
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto px-8 py-8 animate-fade-in select-none">
      
      {/* Header & Mode Switcher */}
      <div className="max-w-3xl mx-auto mb-8 text-center space-y-4">
        
        {/* Mode Switcher Tabs */}
        <div className="inline-flex p-1.5 rounded-2xl bg-cinematic-900 border border-slate-800 shadow-xl">
          <button
            onClick={() => {
              playFeedbackSound('select');
              setSearchMode('ai_assistant');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              searchMode === 'ai_assistant'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span>AI Recommendation Assistant</span>
          </button>

          <button
            onClick={() => {
              playFeedbackSound('select');
              setSearchMode('tmdb_search');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              searchMode === 'tmdb_search'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4 text-cyan-200" />
            <span>TMDB Metadata Catalog</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-3">
          <h1 className="text-3xl font-extrabold font-display text-white">
            {searchMode === 'ai_assistant'
              ? 'CineMind Conversational Discovery'
              : 'Discover Titles with TMDB API'}
          </h1>
          {searchMode === 'tmdb_search' && <TMDBAttribution status={apiStatus} compact />}
        </div>

        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          {searchMode === 'ai_assistant'
            ? 'Natural-language queries translated into structured filters, ranked with zero invented titles and spoiler-free explanations.'
            : 'Direct keyword, actor, and title search across live streaming metadata.'}
        </p>

        {/* 10-Foot Television Search Bar */}
        <div className="relative flex items-center">
          <div className="absolute left-5 text-slate-400">
            {searchMode === 'ai_assistant' ? (
              <Sparkles className="w-6 h-6 text-purple-400" />
            ) : (
              <Search className="w-6 h-6 text-cyan-400" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              searchMode === 'ai_assistant'
                ? "Try: 'Find a funny family movie under 100 minutes'..."
                : "Search movie titles ('Interstellar', 'Spider-Man', 'Coco')..."
            }
            className={`w-full pl-14 pr-32 py-4 rounded-2xl bg-cinematic-900 border-2 font-medium text-base text-white placeholder-slate-500 focus:outline-none transition-all shadow-xl ${
              searchMode === 'ai_assistant'
                ? 'border-purple-800/80 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/30'
                : 'border-slate-700/80 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/30'
            }`}
          />

          <div className="absolute right-4 flex items-center gap-2">
            {query && (
              <button
                onClick={handleClear}
                className="p-1 rounded-full text-slate-400 hover:text-white"
                title="Clear input"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold">
              <Mic className="w-3 h-3 text-fire-amber" />
              <span>Voice / Remote</span>
            </div>
          </div>
        </div>

        {/* AI Prompt Quick Chips (in AI mode) */}
        {searchMode === 'ai_assistant' && (
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {aiPromptPills.map((item) => (
              <button
                key={item.label}
                onClick={() => handleSelectPill(item.prompt)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-950/40 text-purple-200 border border-purple-800/60 hover:border-purple-400 hover:bg-purple-900/60 transition-all shadow-sm"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* ================= AI ASSISTANT RESULTS VIEW ================= */}
      {searchMode === 'ai_assistant' && (
        <div className="space-y-6">
          
          {/* AI Interpreted Filters & Safety Lock Banner */}
          {aiResponse && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-cinematic-900 to-indigo-950/40 border border-purple-500/40 space-y-4 shadow-2xl">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-purple-900/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Interpreted Assistant Intent</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        aiResponse.providerUsed === 'bedrock'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                          : 'bg-purple-950 text-purple-300 border-purple-600'
                      }`}>
                        {aiResponse.providerUsed === 'bedrock'
                          ? '● Amazon Bedrock Active'
                          : '● CineMind Rule Engine'}
                      </span>
                    </h3>
                  </div>
                </div>

                {/* Verified Dataset & Safety Badge */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-xl bg-black/60 border border-slate-700 text-slate-300 text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verified Dataset (0 Invented Titles)</span>
                  </span>
                  {aiResponse.restrictedCount > 0 && (
                    <span className="px-3 py-1 rounded-xl bg-amber-950/60 border border-amber-700 text-amber-300 text-[11px] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>{aiResponse.restrictedCount} Titles Filtered by Safety Lock</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Structured Extracted Criteria Pills */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {aiResponse.parsedFilters.moods?.length > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-900/50 border border-purple-700 text-purple-200">
                    Mood: {aiResponse.parsedFilters.moods.join(', ')}
                  </span>
                )}
                {aiResponse.parsedFilters.genres?.length > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-900/50 border border-indigo-700 text-indigo-200">
                    Genres: {aiResponse.parsedFilters.genres.join(', ')}
                  </span>
                )}
                {aiResponse.parsedFilters.max_runtime_minutes && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Max: {aiResponse.parsedFilters.max_runtime_minutes} mins
                  </span>
                )}
                {aiResponse.parsedFilters.max_age_rating && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-fire-amber font-bold">
                    Age Cap: {aiResponse.parsedFilters.max_age_rating}
                  </span>
                )}
                {aiResponse.parsedFilters.avoid_violence && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300">
                    ✓ Violence Excluded
                  </span>
                )}
              </div>

              {/* Natural-Language Spoiler-Free Recommendation Synthesis */}
              <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <span className="font-bold text-fire-amber block mb-1 uppercase tracking-wider text-[11px]">
                  🍿 AI Recommendation Rationale:
                </span>
                {aiResponse.recommendationExplanation}
              </div>

            </div>
          )}

          {/* Ambiguity / Insufficient Context Callout */}
          {aiResponse && !aiResponse.hasSufficientContext && (
            <div className="p-8 rounded-3xl bg-amber-950/30 border border-amber-600/40 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                More Information Needed
              </h3>
              <p className="text-xs text-amber-200 max-w-md mx-auto">
                {aiResponse.recommendationExplanation}
              </p>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="py-16 text-center space-y-3 animate-pulse">
              <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-purple-300 font-semibold tracking-wider uppercase">
                Interpreting Natural Language & Ranking Verified Catalog...
              </p>
            </div>
          )}

          {/* Matched Movie Grid */}
          {!isLoading && aiResponse && aiResponse.matchedMovies.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white font-display">
                  Top Verified Matches ({aiResponse.matchedMovies.length})
                </h3>
                <span className="text-xs text-slate-400">
                  Ranked by algorithmic harmony score
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {aiResponse.matchedMovies.map((movie, index) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    groupName="ai-results"
                    order={index}
                    onSelect={onSelectMovie}
                    inWatchlist={watchlistIds.includes(movie.id)}
                    onToggleWatchlist={onToggleWatchlist}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= TMDB SEARCH RESULTS VIEW ================= */}
      {searchMode === 'tmdb_search' && (
        <div className="space-y-6">
          {/* Genre & Language Filter Chips */}
          <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedGenre('All')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedGenre === 'All'
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                All Genres
              </button>
              {GENRES_LIST.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedGenre === g
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs border border-slate-700 focus:outline-none focus:border-cyan-500"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-300 text-xs">
              {errorMessage}
            </div>
          )}

          {isRateLimited && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-600/40 text-rose-300 text-xs">
              TMDB rate limit reached. Displaying verified local catalog fallback.
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Searching TMDB metadata...</p>
            </div>
          )}

          {/* Results Grid */}
          {!isLoading && tmdbMovies.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {tmdbMovies.map((movie, index) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  groupName="tmdb-results"
                  order={index}
                  onSelect={onSelectMovie}
                  inWatchlist={watchlistIds.includes(movie.id)}
                  onToggleWatchlist={onToggleWatchlist}
                />
              ))}
            </div>
          )}

          {!isLoading && tmdbMovies.length === 0 && (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-bold text-white">No titles found</p>
              <p className="text-xs text-slate-400">Try broadening your search criteria.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
