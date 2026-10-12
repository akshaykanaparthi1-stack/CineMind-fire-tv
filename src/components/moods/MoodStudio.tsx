import React, { useState, useMemo } from 'react';
import type { MoodType, GenreType, Movie } from '../../types';
import { MOVIES_DATABASE, MOODS_CONFIG, GENRES_LIST } from '../../data/moviesData';
import { MovieCard } from '../movies/MovieCard';
import { Sparkles, Clock, SlidersHorizontal } from 'lucide-react';
import { useTVNavigation } from '../../context/TVNavigationContext';

interface MoodStudioProps {
  initialMood?: MoodType | null;
  onSelectMovie: (movie: Movie) => void;
  watchlistIds: string[];
  onToggleWatchlist: (movie: Movie) => void;
  familySafeMode: boolean;
}

export const MoodStudio: React.FC<MoodStudioProps> = ({
  initialMood = 'Happy',
  onSelectMovie,
  watchlistIds,
  onToggleWatchlist,
  familySafeMode,
}) => {
  const { playFeedbackSound } = useTVNavigation();
  const [activeMood, setActiveMood] = useState<MoodType>(initialMood || 'Happy');
  const [selectedGenre, setSelectedGenre] = useState<GenreType | 'All'>('All');
  const [maxTime, setMaxTime] = useState<number>(180);
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'runtime'>('match');

  const filteredMovies = useMemo(() => {
    return MOVIES_DATABASE.filter((movie) => {
      // Mood filter
      if (!movie.moods.includes(activeMood)) return false;

      // Genre filter
      if (selectedGenre !== 'All' && !movie.genres.includes(selectedGenre)) return false;

      // Time constraint
      if (movie.runtimeMinutes > maxTime) return false;

      // Family safety
      if (familySafeMode && !['G', 'PG'].includes(movie.ageRating)) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'runtime') return a.runtimeMinutes - b.runtimeMinutes;
      return b.aiInsights.matchScore - a.aiInsights.matchScore;
    });
  }, [activeMood, selectedGenre, maxTime, sortBy, familySafeMode]);

  const activeMoodConfig = MOODS_CONFIG.find((m) => m.mood === activeMood) || MOODS_CONFIG[0];

  return (
    <div className="w-full max-w-[1800px] mx-auto px-8 py-8 animate-fade-in select-none">
      
      {/* Studio Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-fire-amber/20 border border-fire-amber/40 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-fire-amber" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold font-display text-white">
              CineMind Mood Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Align what’s playing with how you want to feel tonight.
            </p>
          </div>
        </div>
      </div>

      {/* Mood Selector Row */}
      <div className="mb-8">
        <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
          1. Select Desired Emotional Mood
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MOODS_CONFIG.map((m) => {
            const isCurrent = activeMood === m.mood;
            return (
              <button
                key={m.mood}
                onClick={() => {
                  playFeedbackSound('move');
                  setActiveMood(m.mood);
                }}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 tv-focusable ${
                  isCurrent
                    ? 'bg-slate-800 border-fire-amber ring-2 ring-fire-amber shadow-lg shadow-fire-amber/20 scale-102'
                    : 'bg-cinematic-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span className="text-2xl block mb-1">{m.emoji}</span>
                <span className="text-sm font-bold text-white block">{m.mood}</span>
                <span className="text-[11px] text-slate-400 block line-clamp-1">
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Constraints & Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl bg-cinematic-900 border border-slate-800 mb-8">
        
        {/* Genre Pill Selection */}
        <div>
          <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2">
            Genre Filter
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                playFeedbackSound('move');
                setSelectedGenre('All');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                selectedGenre === 'All'
                  ? 'bg-white text-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {GENRES_LIST.map((genre) => (
              <button
                key={genre}
                onClick={() => {
                  playFeedbackSound('move');
                  setSelectedGenre(genre);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  selectedGenre === genre
                    ? 'bg-fire-amber text-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Available Watch Time Filter */}
        <div>
          <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-fire-amber" />
            Available Time
          </label>
          <div className="flex gap-2">
            {[
              { label: '< 95 min', val: 95, desc: 'Quick Watch' },
              { label: '< 120 min', val: 120, desc: 'Feature' },
              { label: 'All Times', val: 240, desc: 'Any' },
            ].map((t) => (
              <button
                key={t.label}
                onClick={() => {
                  playFeedbackSound('move');
                  setMaxTime(t.val);
                }}
                className={`flex-1 py-2 rounded-none text-xs font-bold ${
                  maxTime === t.val
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-fire-amber" />
            Sort Criteria
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                playFeedbackSound('move');
                setSortBy('match');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                sortBy === 'match'
                  ? 'bg-fire-amber text-black shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              AI Match %
            </button>
            <button
              onClick={() => {
                playFeedbackSound('move');
                setSortBy('rating');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                sortBy === 'rating'
                  ? 'bg-fire-amber text-black shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              IMDb Rating
            </button>
            <button
              onClick={() => {
                playFeedbackSound('move');
                setSortBy('runtime');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                sortBy === 'runtime'
                  ? 'bg-fire-amber text-black shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Shortest
            </button>
          </div>
        </div>

      </div>

      {/* Active Mood Hero Callout */}
      <div className="p-4 rounded-2xl bg-cinematic-900/60 border border-slate-800 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{activeMoodConfig.emoji}</span>
          <div>
            <h2 className="text-base font-bold text-white">
              Selected Mood: {activeMoodConfig.mood} — {activeMoodConfig.label}
            </h2>
            <p className="text-xs text-slate-400">
              {activeMoodConfig.description}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-fire-amber bg-fire-amber/10 px-3 py-1.5 rounded-xl border border-fire-amber/30">
          {filteredMovies.length} Titles Found
        </span>
      </div>

      {/* Movie Results Grid */}
      {filteredMovies.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-cinematic-900/50 border border-slate-800">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-bold text-white mb-1">
            No Movies Match This Specific Filter Combo
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Try adjusting your available watch time or selecting "All Genres" to view more recommendations.
          </p>
          <button
            onClick={() => {
              setSelectedGenre('All');
              setMaxTime(180);
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredMovies.map((movie, index) => (
            <div key={movie.id} className="flex justify-center">
              <MovieCard
                movie={movie}
                groupName="mood-studio"
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
