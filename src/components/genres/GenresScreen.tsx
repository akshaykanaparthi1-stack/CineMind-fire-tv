import React, { useState, useMemo, useEffect } from 'react';
import type { GenreType, Movie } from '../../types';
import type { TMDBApiStatus } from '../../types/tmdb';
import { GENRES_LIST, MOVIES_DATABASE } from '../../data/moviesData';
import { tmdbMovieService } from '../../services/tmdbService';
import { MovieCard } from '../movies/MovieCard';
import { TMDBAttribution } from '../common/TMDBAttribution';
import { useTVNavigation } from '../../context/TVNavigationContext';
import { 
  Film, 
  Flame, 
  Laugh, 
  Drama, 
  Zap, 
  Gamepad2, 
  Rocket, 
  HeartHandshake,
  SlidersHorizontal,
  Clock,
  Globe,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface GenresScreenProps {
  onSelectMovie: (movie: Movie) => void;
  watchlistIds: string[];
  onToggleWatchlist: (movie: Movie) => void;
  familySafeMode: boolean;
  initialGenre?: GenreType;
}

const GENRE_METADATA: Record<GenreType, {
  label: string;
  icon: React.ReactNode;
  tagline: string;
}> = {
  'Action': {
    label: 'Action & Adventure',
    icon: <Zap className="w-6 h-6" />,
    tagline: 'High octane stunts, adrenaline rushes, and heroic showdowns'
  },
  'Comedy': {
    label: 'Comedy & Laughs',
    icon: <Laugh className="w-6 h-6" />,
    tagline: 'Witty satire, hilarious misadventures, and joyful living room giggles'
  },
  'Drama': {
    label: 'Drama & Heart',
    icon: <Drama className="w-6 h-6" />,
    tagline: 'Deep human emotions, thought-provoking journeys, and unforgettable performances'
  },
  'Thriller': {
    label: 'Thriller & Mystery',
    icon: <Flame className="w-6 h-6" />,
    tagline: 'Suspenseful whodunits, nail-biting cat-and-mouse games, and shocking twists'
  },
  'Animation': {
    label: 'Animation & Art',
    icon: <Gamepad2 className="w-6 h-6" />,
    tagline: 'Visual masterpieces, imaginative worlds, and heartwarming timeless art'
  },
  'Science Fiction': {
    label: 'Sci-Fi & Wonder',
    icon: <Rocket className="w-6 h-6" />,
    tagline: 'Interstellar physics, futuristic marvels, and mind-expanding cosmic epics'
  },
  'Family': {
    label: 'Family & All Ages',
    icon: <HeartHandshake className="w-6 h-6" />,
    tagline: 'Crowd-tested gems guaranteed safe and delightful for all generations'
  }
};

export const GenresScreen: React.FC<GenresScreenProps> = ({
  onSelectMovie,
  watchlistIds,
  onToggleWatchlist,
  familySafeMode,
  initialGenre = 'Action',
}) => {
  const { playFeedbackSound } = useTVNavigation();
  const [selectedGenre, setSelectedGenre] = useState<GenreType>(initialGenre);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [timeConstraint, setTimeConstraint] = useState<number>(240);
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'year' | 'runtime'>('match');
  const [liveMovies, setLiveMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<TMDBApiStatus | undefined>(undefined);

  useEffect(() => {
    tmdbMovieService.getStatus().then(setApiStatus);
  }, []);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    tmdbMovieService.getMoviesByGenre(selectedGenre, selectedLanguage)
      .then((movies) => {
        if (mounted) {
          setLiveMovies(movies);
          setIsRateLimited(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLiveMovies(MOVIES_DATABASE.filter((m) => m.genres.includes(selectedGenre)));
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => { mounted = false; };
  }, [selectedGenre, selectedLanguage]);

  const activeMeta = GENRE_METADATA[selectedGenre];

  const pool = liveMovies.length > 0 ? liveMovies : MOVIES_DATABASE;

  const filteredMovies = useMemo(() => {
    return pool.filter((movie) => {
      // Must match selected genre
      if (!movie.genres.includes(selectedGenre)) return false;

      // Family safety mode
      if (familySafeMode && !['G', 'PG'].includes(movie.ageRating)) return false;

      // Runtime filter
      if (movie.runtimeMinutes > timeConstraint) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'year') return b.year - a.year;
      if (sortBy === 'runtime') return a.runtimeMinutes - b.runtimeMinutes;
      return b.aiInsights.matchScore - a.aiInsights.matchScore;
    });
  }, [pool, selectedGenre, familySafeMode, timeConstraint, sortBy]);

  return (
    <div className="w-full max-w-[1800px] mx-auto px-8 py-8 animate-fade-in select-none">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-fire-amber/20 border border-fire-amber/40 flex items-center justify-center">
            <Film className="w-5 h-5 text-fire-amber" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold font-display text-white">
              Browse by Genre
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Explore cinema categories calibrated for 10-foot TV viewing.
            </p>
          </div>
        </div>
      </div>

      {/* 7 Big TV Genre Cards */}
      <div className="mb-8">
        <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
          Select Genre Category
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {GENRES_LIST.map((genre) => {
            const meta = GENRE_METADATA[genre];
            const isSelected = selectedGenre === genre;
            const count = MOVIES_DATABASE.filter(m => m.genres.includes(genre)).length;

            return (
              <button
                key={genre}
                onClick={() => {
                  playFeedbackSound('move');
                  setSelectedGenre(genre);
                }}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 tv-focusable relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-800 border-fire-amber ring-2 ring-fire-amber shadow-xl shadow-fire-amber/20 scale-102'
                    : 'bg-cinematic-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className={`mb-3 ${isSelected ? 'text-fire-amber' : 'text-slate-400'}`}>
                  {meta.icon}
                </div>
                <h4 className="text-sm font-bold text-white block mb-0.5 font-display">
                  {genre}
                </h4>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {count} Titles
                </span>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-fire-amber animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Genre Showcase Banner */}
      <div className="p-6 rounded-none bg-cinematic-900 border border-slate-800 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-none bg-fire-amber/20 text-fire-amber border border-fire-amber/30 text-xs font-bold uppercase">
              Current Genre
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {filteredMovies.length} movies matching
            </span>
          </div>
          <h2 className="text-2xl font-black font-display text-white">
            {activeMeta.label}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {activeMeta.tagline}
          </p>
        </div>

        {/* Runtime & Sort Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-none border border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => {
                playFeedbackSound('move');
                setTimeConstraint(95);
              }}
              className={`px-2.5 py-1 rounded-none font-semibold ${
                timeConstraint === 95 ? 'bg-white text-black font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              &lt; 95m
            </button>
            <button
              onClick={() => {
                playFeedbackSound('move');
                setTimeConstraint(120);
              }}
              className={`px-2.5 py-1 rounded-none font-semibold ${
                timeConstraint === 120 ? 'bg-white text-black font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              &lt; 120m
            </button>
            <button
              onClick={() => {
                playFeedbackSound('move');
                setTimeConstraint(240);
              }}
              className={`px-2.5 py-1 rounded-none font-semibold ${
                timeConstraint === 240 ? 'bg-white text-black font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              All Lengths
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-fire-amber ml-1.5" />
            <button
              onClick={() => {
                playFeedbackSound('move');
                setSortBy('match');
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                sortBy === 'match' ? 'bg-fire-amber text-black font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              AI Match
            </button>
            <button
              onClick={() => {
                playFeedbackSound('move');
                setSortBy('rating');
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                sortBy === 'rating' ? 'bg-fire-amber text-black font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Rating
            </button>
            <button
              onClick={() => {
                playFeedbackSound('move');
                setSortBy('year');
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                sortBy === 'year' ? 'bg-fire-amber text-black font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Year
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-fire-amber" />
            <select
              value={selectedLanguage}
              onChange={(e) => {
                playFeedbackSound('select');
                setSelectedLanguage(e.target.value);
              }}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Languages</option>
              <option value="en" className="bg-slate-900 text-white">English (EN)</option>
              <option value="es" className="bg-slate-900 text-white">Spanish (ES)</option>
              <option value="ja" className="bg-slate-900 text-white">Japanese (JA)</option>
              <option value="ko" className="bg-slate-900 text-white">Korean (KO)</option>
              <option value="fr" className="bg-slate-900 text-white">French (FR)</option>
              <option value="de" className="bg-slate-900 text-white">German (DE)</option>
              <option value="hi" className="bg-slate-900 text-white">Hindi (HI)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rate-Limit Warning State */}
      {isRateLimited && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-600/60 flex items-center justify-between text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>TMDB Rate Limit Active (HTTP 429). Serving local fallback catalog for {selectedGenre}.</span>
          </div>
          <button
            onClick={() => {
              setIsLoading(true);
              tmdbMovieService.getMoviesByGenre(selectedGenre, selectedLanguage).then(setLiveMovies).finally(() => setIsLoading(false));
            }}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-600/30 text-white font-bold text-[11px]"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Movies Grid / Loading State */}
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
      ) : filteredMovies.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-cinematic-900/50 border border-slate-800">
          <div className="text-4xl mb-3">🎬</div>
          <h3 className="text-lg font-bold text-white mb-1">
            No Movies Found in This Filter Combination
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Try adjusting your maximum runtime limit or turning off Family Lock if enabled.
          </p>
          <button
            onClick={() => { setTimeConstraint(240); setSelectedLanguage('all'); }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700"
          >
            Show All {selectedGenre} Movies
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredMovies.map((movie, index) => (
            <div key={movie.id} className="flex justify-center">
              <MovieCard
                movie={movie}
                groupName={`genres-${selectedGenre}`}
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

      {/* TMDB Attribution Banner */}
      <div className="mt-12">
        <TMDBAttribution status={apiStatus} />
      </div>

    </div>
  );
};
