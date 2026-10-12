import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Movie, UserProfile } from '../../types';
import { MOVIES_DATABASE } from '../../data/moviesData';
import { tmdbMovieService } from '../../services/tmdbService';
import { speechToTextService } from '../../services/speechToTextService';
import { useTVFocus, useTVNavigation } from '../../context/TVNavigationContext';
import { 
  Search, 
  X, 
  Mic, 
  Sparkles, 
  Film, 
  Star, 
  Clock, 
  ShieldCheck, 
  Bookmark, 
  Tv, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface TopSearchBarProps {
  onSelectMovie: (movie: Movie) => void;
  onNavigateToSearch: (query: string) => void;
  activeProfile: UserProfile;
  familySafeMode: boolean;
  onToggleFamilySafeMode: () => void;
  onProfileClick: () => void;
  watchlistCount: number;
  onNavigateToWatchlist: () => void;
  onNavigateToHome: () => void;
}

export const TopSearchBar: React.FC<TopSearchBarProps> = ({
  onSelectMovie,
  onNavigateToSearch,
  activeProfile,
  familySafeMode,
  onToggleFamilySafeMode,
  onProfileClick,
  watchlistCount,
  onNavigateToWatchlist,
  onNavigateToHome,
}) => {
  const { playFeedbackSound } = useTVNavigation();
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [tmdbSearchResults, setTmdbSearchResults] = useState<Movie[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [time, setTime] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const stopVoiceRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (stopVoiceRef.current) stopVoiceRef.current();
    };
  }, []);

  // Live TV Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Global hotkey: Pressing "/" or "s" (when not already typing) focuses search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || e.key === 's') &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsDropdownOpen(true);
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fast Local Filtering from MOVIES_DATABASE
  const localMatches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    return MOVIES_DATABASE.filter((m) => {
      // Respect Family Safe Mode (G / PG only)
      if (familySafeMode && m.ageRating !== 'G' && m.ageRating !== 'PG') {
        return false;
      }

      // Title match
      if (m.title.toLowerCase().includes(q)) return true;
      // Genre match
      if (m.genres.some((g) => g.toLowerCase().includes(q))) return true;
      // Mood match
      if (m.moods.some((mood) => mood.toLowerCase().includes(q))) return true;
      // Cast / Director
      if (m.cast.some((actor) => actor.toLowerCase().includes(q))) return true;
      if (m.director.toLowerCase().includes(q)) return true;
      // Tagline / Synopsis keywords
      if (m.tagline.toLowerCase().includes(q) || m.synopsis.toLowerCase().includes(q)) return true;
      // AI insights
      if (m.aiInsights.bestFor.toLowerCase().includes(q)) return true;

      return false;
    }).slice(0, 5);
  }, [query, familySafeMode]);

  // Debounced TMDB API search for broader catalog coverage
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setTmdbSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await tmdbMovieService.searchMovies(query.trim());
        if (res.movies && res.movies.length > 0) {
          const filtered = res.movies.filter((m) => {
            if (familySafeMode && m.ageRating !== 'G' && m.ageRating !== 'PG') {
              return false;
            }
            return !localMatches.some((lm) => lm.id === m.id || lm.title.toLowerCase() === m.title.toLowerCase());
          });
          setTmdbSearchResults(filtered.slice(0, 4));
        }
      } catch {
        // Fallback silently to local matches
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, familySafeMode, localMatches]);

  // Combined movie suggestions
  const combinedMovies = useMemo(() => {
    const list = [...localMatches, ...tmdbSearchResults];
    return list.slice(0, 6);
  }, [localMatches, tmdbSearchResults]);

  // Audio-to-Text Speech Recognition Search
  const handleVoiceSearch = () => {
    playFeedbackSound('select');

    if (isVoiceListening) {
      if (stopVoiceRef.current) stopVoiceRef.current();
      speechToTextService.stopListening();
      setIsVoiceListening(false);
      return;
    }

    setIsVoiceListening(true);
    setIsDropdownOpen(true);
    setQuery('');

    if (speechToTextService.isSupported()) {
      const stopFn = speechToTextService.startListening({
        onStart: () => {
          setIsVoiceListening(true);
        },
        onInterimResult: (interim) => {
          setQuery(interim);
        },
        onFinalResult: (finalText) => {
          setQuery(finalText);
          setTimeout(() => {
            setIsVoiceListening(false);
            handleSubmitSearch(finalText);
          }, 800);
        },
        onError: () => {
          // Graceful fallback to sample prompt
          const sample = 'Find a funny family movie under 100 minutes';
          setQuery(sample);
          setTimeout(() => {
            setIsVoiceListening(false);
            handleSubmitSearch(sample);
          }, 1200);
        },
        onEnd: () => {
          setIsVoiceListening(false);
        },
      });
      stopVoiceRef.current = stopFn;
    } else {
      // Fallback simulation when Web Speech API is absent
      const samplePrompts = [
        'Find a funny family movie under 100 minutes',
        'Show me exciting sci-fi adventures',
        'Relaxed feel-good animated movies for kids',
        'Clever suspense thriller with high ratings',
      ];
      const picked = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
      setQuery(picked);
      setTimeout(() => {
        setIsVoiceListening(false);
        handleSubmitSearch(picked);
      }, 1400);
    }
  };

  // Submit search query to full SearchHub
  const handleSubmitSearch = (searchQueryToUse?: string) => {
    const q = searchQueryToUse !== undefined ? searchQueryToUse : query;
    if (!q.trim()) return;
    playFeedbackSound('select');
    setIsDropdownOpen(false);
    inputRef.current?.blur();
    onNavigateToSearch(q.trim());
  };

  // Keyboard navigation within dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < combinedMovies.length) {
        // Select highlighted movie
        const movie = combinedMovies[selectedIndex];
        playFeedbackSound('select');
        setIsDropdownOpen(false);
        onSelectMovie(movie);
      } else {
        // Submit search query
        handleSubmitSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setSelectedIndex((prev) => (prev < combinedMovies.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    }
  };

  // TV Navigation hooks for remote focus
  const searchInputFocus = useTVFocus('top-search-input', 'top-bar', {
    order: 0,
    onSelect: () => {
      inputRef.current?.focus();
      setIsDropdownOpen(true);
    },
  });

  const voiceBtnFocus = useTVFocus('top-btn-voice', 'top-bar', {
    order: 1,
    onSelect: handleVoiceSearch,
  });

  const familyLockFocus = useTVFocus('top-btn-familylock', 'top-bar', {
    order: 2,
    onSelect: onToggleFamilySafeMode,
  });

  const watchlistFocus = useTVFocus('top-btn-watchlist', 'top-bar', {
    order: 3,
    onSelect: onNavigateToWatchlist,
  });

  const profileFocus = useTVFocus('top-btn-profile', 'top-bar', {
    order: 4,
    onSelect: onProfileClick,
  });

  // Suggested quick prompts when search input is empty or focused
  const quickSuggestions = [
    { label: '🍿 Funny Family (<100m)', query: 'Find a funny family movie under 100 minutes' },
    { label: '⚡ Sci-Fi Adventure', query: 'Exciting sci-fi space adventure' },
    { label: '🐻 Paddington 2', query: 'Paddington 2' },
    { label: '🕷️ Spider-Man', query: 'Spider-Man Across the Spider-Verse' },
    { label: '🔪 Knives Out', query: 'Knives Out' },
    { label: '💖 Cozy Feel-Good', query: 'Cozy feel-good comedy' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-cinematic-950/95 backdrop-blur-2xl border-b border-slate-800/80 px-6 py-3 select-none transition-all">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Official CineMind Logo & Attribution */}
        <div 
          onClick={onNavigateToHome}
          className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
          title="Return to Home"
        >
          {/* Logo Mark Frame */}
          <div className="w-10 h-10 rounded-none bg-blue-600/30 p-0.5 border border-blue-500/50 shadow-lg shadow-blue-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <img 
              src="/cinemind-mark.png" 
              alt="CineMind Logo" 
              className="w-full h-full object-cover rounded-none"
              onError={(e) => {
                // Graceful fallback to full logo image if mark not found
                (e.currentTarget as HTMLImageElement).src = '/cinemind-logo.jpg';
              }}
            />
          </div>

          {/* Brand Name & Developer Credit */}
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base lg:text-lg font-black tracking-tight font-display text-white">
                Cine<span className="text-fire-amber">Mind</span>
              </span>
              <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-none">
                <Tv className="w-2.5 h-2.5 text-fire-amber" />
                Fire TV
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Developed by <strong className="text-slate-300 font-semibold">Kanaparthi Akshay</strong>
            </span>
          </div>
        </div>

        {/* Center: Top Omnibar Search Bar */}
        <div className="relative flex-1 max-w-2xl mx-auto">
          <div
            ref={searchInputFocus.ref as any}
            className={`relative flex items-center w-full bg-cinematic-900 border transition-all rounded-none ${
              searchInputFocus.isFocused
                ? 'border-amber-500 ring-2 ring-amber-500/50'
                : isDropdownOpen
                ? 'border-neutral-500 ring-1 ring-neutral-500/30'
                : 'border-neutral-700 hover:border-neutral-600'
            }`}
          >
            {/* Search Icon */}
            <div className="pl-4 pr-2 text-slate-400 flex items-center pointer-events-none">
              <Search className={`w-4 h-4 ${query ? 'text-amber-400' : 'text-slate-400'}`} />
            </div>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
                if (!isDropdownOpen) setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search movies, genres, moods, actors, or ask CineMind..."
              className="w-full py-2.5 pr-2 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none rounded-none"
            />

            {/* Clear Query Button */}
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedIndex(-1);
                  inputRef.current?.focus();
                }}
                className="p-1.5 mr-1 text-slate-400 hover:text-white rounded-none transition-colors"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Alexa Voice / Mic Button */}
            <button
              ref={voiceBtnFocus.ref as any}
              type="button"
              onClick={handleVoiceSearch}
              className={`flex items-center gap-1 px-2.5 py-1.5 mr-2 text-xs font-semibold rounded-none transition-all ${
                isVoiceListening
                  ? 'bg-sky-500 text-white animate-pulse'
                  : voiceBtnFocus.isFocused
                  ? 'bg-sky-600 text-white ring-2 ring-white'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
              }`}
              title="Fire TV Alexa Voice Search"
            >
              <Mic className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline text-[10px] uppercase font-bold tracking-wider">
                {isVoiceListening ? 'Listening...' : 'Alexa'}
              </span>
            </button>

            {/* Keyboard shortcut hint */}
            <div className="pr-3 hidden xl:flex items-center">
              <span className="text-[10px] text-slate-500 font-mono px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 rounded-none">
                [/]
              </span>
            </div>
          </div>

          {/* Live Search Dropdown */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 top-full mt-2 bg-cinematic-900/98 backdrop-blur-2xl border border-slate-700/90 shadow-[0_20px_50px_rgba(0,0,0,0.9)] rounded-none z-50 overflow-hidden animate-fade-in"
            >
              {/* Header Status Strip */}
              <div className="flex items-center justify-between px-4 py-2 bg-cinematic-950/80 border-b border-slate-800 text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-fire-amber" />
                  {query.trim()
                    ? `Results for "${query.trim()}" (${combinedMovies.length} found)`
                    : 'Instant Entertainment Search'}
                </span>
                {familySafeMode && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Family Lock: G & PG Only
                  </span>
                )}
              </div>

              {/* Direct Movie Results List */}
              {combinedMovies.length > 0 ? (
                <div className="max-h-80 overflow-y-auto no-scrollbar divide-y divide-slate-800/60">
                  {combinedMovies.map((movie, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <div
                        key={movie.id}
                        onClick={() => {
                          playFeedbackSound('select');
                          setIsDropdownOpen(false);
                          onSelectMovie(movie);
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex items-center gap-3.5 px-4 py-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-fire-amber/15 border-l-4 border-fire-amber text-white'
                            : 'hover:bg-slate-800/60 text-slate-200'
                        }`}
                      >
                        {/* Poster Thumbnail */}
                        <div className="w-10 h-14 bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700 rounded-none">
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/cinemind-mark.png';
                            }}
                          />
                        </div>

                        {/* Title & Metadata */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate font-display">
                              {movie.title}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 border border-slate-700 font-bold rounded-none">
                              {movie.ageRating}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {movie.rating.toFixed(1)}
                            </span>
                            <span>{movie.year}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {movie.runtimeMinutes}m
                            </span>
                            <span className="text-neutral-400 hidden sm:inline">
                              {movie.genres[0]}
                            </span>
                          </div>
                        </div>

                        {/* AI Match Badge */}
                        <div className="flex flex-col items-end flex-shrink-0">
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-neutral-950 border border-neutral-700 text-amber-400 text-[11px] font-bold rounded-none">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>{movie.aiInsights.matchScore}%</span>
                          </div>
                          <span className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">
                            {movie.streamingProvider || 'Prime Video'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : query.trim() ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No direct title matches for "{query}". Try asking CineMind below!
                </div>
              ) : null}

              {/* Action Card: Search with CineMind Assistant */}
              <div
                onClick={() => handleSubmitSearch(query || 'Find a funny family movie under 100 minutes')}
                className="p-3 bg-neutral-900 border-t border-neutral-800 hover:bg-neutral-850 cursor-pointer flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 rounded-none flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Ask CineMind Assistant</span>
                      {query.trim() && (
                        <span className="text-amber-400 font-normal truncate max-w-xs">
                          "{query.trim()}"
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Natural-language reasoning, mood matching, and spoiler-free recommendations.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold px-2.5 py-1 bg-neutral-950 border border-neutral-700 rounded-none group-hover:bg-amber-500 group-hover:text-black transition-colors">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Quick Discovery Pills (when query is short or empty) */}
              {!query.trim() && (
                <div className="p-3 bg-cinematic-950 border-t border-neutral-800">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
                    <TrendingUp className="w-3 h-3 text-amber-400" />
                    <span>Quick Discovery Ideas:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickSuggestions.map((sugg, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setQuery(sugg.query);
                          handleSubmitSearch(sugg.query);
                        }}
                        className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 rounded-none hover:border-fire-amber/60 transition-colors"
                      >
                        {sugg.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Right: Quick Action Controls (Family Lock, Watchlist, Profile, Clock) */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          
          {/* Family Safe Lock Button */}
          <button
            ref={familyLockFocus.ref as any}
            onClick={onToggleFamilySafeMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-all rounded-none tv-focusable ${
              familySafeMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            } ${familyLockFocus.isFocused ? 'tv-focused ring-2 ring-emerald-400' : ''}`}
            title="Toggle Kids & Family Safe Mode (G/PG Content Only)"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${familySafeMode ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="hidden md:inline">
              {familySafeMode ? 'Family Lock: ON' : 'Family Lock'}
            </span>
          </button>

          {/* Watchlist Quick Pill */}
          <button
            ref={watchlistFocus.ref as any}
            onClick={onNavigateToWatchlist}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all rounded-none tv-focusable ${
              watchlistFocus.isFocused ? 'tv-focused ring-2 ring-fire-amber' : ''
            }`}
            title="Open Shared Watchlist"
          >
            <Bookmark className="w-3.5 h-3.5 text-fire-amber" />
            <span className="hidden sm:inline">Watchlist</span>
            {watchlistCount > 0 && (
              <span className="px-1.5 py-0.2 bg-fire-amber/20 text-fire-amber text-[10px] font-bold border border-fire-amber/30 rounded-none">
                {watchlistCount}
              </span>
            )}
          </button>

          {/* Active Profile Pill */}
          <button
            ref={profileFocus.ref as any}
            onClick={onProfileClick}
            className={`flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-700/80 hover:border-fire-amber/50 text-slate-200 transition-all rounded-none tv-focusable ${
              profileFocus.isFocused ? 'tv-focused ring-2 ring-fire-amber' : ''
            }`}
            title="Switch User Profile"
          >
            <span className="text-base leading-none">{activeProfile.avatar}</span>
            <div className="text-left hidden lg:block">
              <span className="text-xs font-bold text-white block leading-tight">
                {activeProfile.name.split(' ')[0]}
              </span>
              <span className="text-[9px] text-slate-400 block leading-tight">
                {activeProfile.role}
              </span>
            </div>
          </button>

          {/* Live TV Clock */}
          <div className="text-right pl-1 hidden xl:block">
            <span className="text-xs font-mono font-semibold text-slate-400 tracking-wider">
              {time}
            </span>
          </div>

        </div>

      </div>
    </header>
  );
};
