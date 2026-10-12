import React, { useState, useMemo } from 'react';
import type { Movie, MoodType, GenreType, UserProfile } from '../../types';
import { MOVIES_DATABASE } from '../../data/moviesData';
import { HeroBanner } from './HeroBanner';
import { MoodSelector } from './MoodSelector';
import { GenreFilterBar } from './GenreFilterBar';
import { MovieRail } from '../movies/MovieRail';
import { Flame, Sparkles, ShieldCheck, Zap, Clock, Heart } from 'lucide-react';

interface HomeScreenProps {
  onSelectMovie: (movie: Movie) => void;
  onStartFamilyVote: (movie: Movie) => void;
  watchlistIds: string[];
  onToggleWatchlist: (movie: Movie) => void;
  activeProfile: UserProfile;
  familySafeMode: boolean;
  onNavigateToMoodStudio: (mood: MoodType) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectMovie,
  onStartFamilyVote,
  watchlistIds,
  onToggleWatchlist,
  activeProfile,
  familySafeMode,
  onNavigateToMoodStudio,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<GenreType | 'All'>('All');
  const [activeMoodFilter, setActiveMoodFilter] = useState<MoodType | null>(null);

  // Featured Hero movie (Spider-Verse or Dune 2, or first available)
  const featuredMovie = useMemo(() => {
    if (familySafeMode) {
      return MOVIES_DATABASE.find((m) => m.id === 'paddington-2') || MOVIES_DATABASE[0];
    }
    return MOVIES_DATABASE.find((m) => m.featured) || MOVIES_DATABASE[0];
  }, [familySafeMode]);

  // Master filtered list according to global safe mode and genre
  const baseMovies = useMemo(() => {
    return MOVIES_DATABASE.filter((m) => {
      if (familySafeMode && !['G', 'PG'].includes(m.ageRating)) {
        return false;
      }
      if (selectedGenre !== 'All' && !m.genres.includes(selectedGenre)) {
        return false;
      }
      if (activeMoodFilter && !m.moods.includes(activeMoodFilter)) {
        return false;
      }
      return true;
    });
  }, [familySafeMode, selectedGenre, activeMoodFilter]);

  // Specialized Shelf Rails
  const trendingMovies = useMemo(() => {
    return baseMovies.filter((m) => m.trending || m.rating >= 8.0);
  }, [baseMovies]);

  const aiTopPicks = useMemo(() => {
    return [...baseMovies].sort((a, b) => b.aiInsights.matchScore - a.aiInsights.matchScore);
  }, [baseMovies]);

  const familyFavorites = useMemo(() => {
    return baseMovies.filter((m) => m.familyFavorite || ['G', 'PG'].includes(m.ageRating));
  }, [baseMovies]);

  const highEnergyMovies = useMemo(() => {
    return baseMovies.filter((m) => m.moods.includes('Excited') || m.genres.includes('Action'));
  }, [baseMovies]);

  const quickWatches = useMemo(() => {
    return baseMovies.filter((m) => m.runtimeMinutes <= 100);
  }, [baseMovies]);

  const feelGoodMovies = useMemo(() => {
    return baseMovies.filter(
      (m) => m.moods.includes('Happy') || m.moods.includes('Relaxed')
    );
  }, [baseMovies]);

  const handleMoodSelect = (mood: MoodType) => {
    if (activeMoodFilter === mood) {
      setActiveMoodFilter(null);
    } else {
      setActiveMoodFilter(mood);
    }
  };

  return (
    <div className="w-full pb-20 animate-fade-in select-none">
      
      {/* Hero Cinematic Billboard */}
      <HeroBanner
        movie={featuredMovie}
        onSelectMovie={onSelectMovie}
        onStartFamilyVote={onStartFamilyVote}
        inWatchlist={watchlistIds.includes(featuredMovie.id)}
        onToggleWatchlist={onToggleWatchlist}
      />

      {/* Mood Selector Strip */}
      <MoodSelector
        selectedMood={activeMoodFilter}
        onSelectMood={handleMoodSelect}
      />

      {/* Genre Filter Bar */}
      <GenreFilterBar
        selectedGenre={selectedGenre}
        onSelectGenre={setSelectedGenre}
      />

      {/* Active Filter Banner if filters applied */}
      {(selectedGenre !== 'All' || activeMoodFilter !== null) && (
        <div className="px-8 my-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="font-semibold text-fire-amber">Filtered View:</span>
            {selectedGenre !== 'All' && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-white">
                Genre: {selectedGenre}
              </span>
            )}
            {activeMoodFilter && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-white">
                Mood: {activeMoodFilter}
              </span>
            )}
            <span className="text-slate-400">({baseMovies.length} movies)</span>
          </div>
          <div className="flex items-center gap-3">
            {activeMoodFilter && (
              <button
                onClick={() => onNavigateToMoodStudio(activeMoodFilter)}
                className="text-xs text-neon-cyan hover:underline font-semibold"
              >
                Deep Tune in Mood Studio →
              </button>
            )}
            <button
              onClick={() => {
                setSelectedGenre('All');
                setActiveMoodFilter(null);
              }}
              className="text-xs text-fire-amber hover:underline font-semibold"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Rail 1: Trending Tonight */}
      <MovieRail
        title="Trending Tonight on Fire TV"
        subtitle="Most streamed across your household network this weekend"
        icon={<Flame className="w-5 h-5 text-fire-amber" />}
        movies={trendingMovies}
        groupName="rail-trending"
        onSelectMovie={onSelectMovie}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        cardSize="standard"
      />

      {/* Rail 2: AI Match Recommendations */}
      <MovieRail
        title={`CineMind AI Match for ${activeProfile.name.split(' ')[0]}`}
        subtitle="Ranked by your viewing interests, preferred pacing, and emotional tone"
        icon={<Sparkles className="w-5 h-5 text-neon-cyan" />}
        movies={aiTopPicks}
        groupName="rail-ai-picks"
        onSelectMovie={onSelectMovie}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        cardSize="standard"
      />

      {/* Rail 3: Family Night Favorites */}
      <MovieRail
        title="Family Night Favorites (G & PG)"
        subtitle="Crowd-tested masterpieces guaranteed to unite parents and kids"
        icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
        movies={familyFavorites}
        groupName="rail-family"
        onSelectMovie={onSelectMovie}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        cardSize="standard"
      />

      {/* Rail 4: High Energy & Thrills */}
      <MovieRail
        title="High Energy Spectacle & Adrenaline"
        subtitle="Heart-racing blockbusters with thunderous audio and edge-of-seat action"
        icon={<Zap className="w-5 h-5 text-orange-500" />}
        movies={highEnergyMovies}
        groupName="rail-energy"
        onSelectMovie={onSelectMovie}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        cardSize="standard"
      />

      {/* Rail 5: Under 95 Minutes Quick Watches */}
      <MovieRail
        title="90-Minute Quick Watches"
        subtitle="Perfect for tight schedules, weeknight dinners, and early bedtimes"
        icon={<Clock className="w-5 h-5 text-purple-400" />}
        movies={quickWatches}
        groupName="rail-quick"
        onSelectMovie={onSelectMovie}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        cardSize="standard"
      />

      {/* Rail 6: Cozy & Feel Good */}
      <MovieRail
        title="Feel-Good Smiles & Cozy Vibes"
        subtitle="Wholesome, uplifting stories to relax and decompress together"
        icon={<Heart className="w-5 h-5 text-pink-400" />}
        movies={feelGoodMovies}
        groupName="rail-cozy"
        onSelectMovie={onSelectMovie}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        cardSize="standard"
      />

    </div>
  );
};
