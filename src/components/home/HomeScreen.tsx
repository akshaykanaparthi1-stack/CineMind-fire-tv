import React, { useState, useMemo } from 'react';
import type { Movie, MoodType, GenreType, UserProfile } from '../../types';
import { MOVIES_DATABASE } from '../../data/moviesData';
import { HeroBanner } from './HeroBanner';
import { MoodSelector } from './MoodSelector';
import { GenreFilterBar } from './GenreFilterBar';
import { MovieRail } from '../movies/MovieRail';
import { Flame, Sparkles, ShieldCheck, Zap, Clock, PlayCircle } from 'lucide-react';

interface HomeScreenProps {
  onSelectMovie: (movie: Movie) => void;
  onStartFamilyVote: (movie: Movie) => void;
  watchlistIds: string[];
  onToggleWatchlist: (movie: Movie) => void;
  activeProfile: UserProfile;
  familySafeMode: boolean;
  onNavigateToMoodStudio: (mood: MoodType) => void;
  onNavigateToGenre?: (genre: GenreType) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectMovie,
  onStartFamilyVote,
  watchlistIds,
  onToggleWatchlist,
  activeProfile,
  familySafeMode,
  onNavigateToMoodStudio,
  onNavigateToGenre,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<GenreType | 'All'>('All');
  const [activeMoodFilter, setActiveMoodFilter] = useState<MoodType | null>(null);

  // Featured Hero movie
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

  // Section 1: Continue Exploring (Titles with in-progress viewing)
  const continueExploringMovies = useMemo(() => {
    return baseMovies.filter((m) => m.continueWatchingProgress !== undefined);
  }, [baseMovies]);

  // Section 2: Recommended for You (AI match ranking)
  const recommendedForYou = useMemo(() => {
    return [...baseMovies].sort((a, b) => b.aiInsights.matchScore - a.aiInsights.matchScore);
  }, [baseMovies]);

  // Section 3: Popular Movies
  const popularMovies = useMemo(() => {
    return baseMovies.filter((m) => m.trending || m.rating >= 8.0);
  }, [baseMovies]);

  // Section 4: Family Picks
  const familyPicks = useMemo(() => {
    return baseMovies.filter((m) => m.familyFavorite || ['G', 'PG'].includes(m.ageRating));
  }, [baseMovies]);

  // Extra Curated Rails
  const quickWatches = useMemo(() => {
    return baseMovies.filter((m) => m.runtimeMinutes <= 100);
  }, [baseMovies]);

  const highEnergyMovies = useMemo(() => {
    return baseMovies.filter((m) => m.moods.includes('Excited') || m.genres.includes('Action'));
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
      
      {/* 1. Featured Movie Banner */}
      <HeroBanner
        movie={featuredMovie}
        onSelectMovie={onSelectMovie}
        onStartFamilyVote={onStartFamilyVote}
        inWatchlist={watchlistIds.includes(featuredMovie.id)}
        onToggleWatchlist={onToggleWatchlist}
      />

      {/* 2. Browse by Mood Section (Interactive mood selection cards) */}
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
            {selectedGenre !== 'All' && onNavigateToGenre && (
              <button
                onClick={() => onNavigateToGenre(selectedGenre)}
                className="text-xs text-neon-cyan hover:underline font-semibold"
              >
                Explore in Genres Hub →
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

      {/* 3. Continue Exploring */}
      {continueExploringMovies.length > 0 && (
        <MovieRail
          title="Continue Exploring"
          subtitle="Pick up right where your household left off"
          icon={<PlayCircle className="w-5 h-5 text-fire-amber" />}
          movies={continueExploringMovies}
          groupName="rail-continue"
          onSelectMovie={onSelectMovie}
          watchlistIds={watchlistIds}
          onToggleWatchlist={onToggleWatchlist}
          cardSize="standard"
          showProgress={true}
        />
      )}

      {/* 4. Recommended for You */}
      <MovieRail
        title={`Recommended for You (${activeProfile.name.split(' ')[0]})`}
        subtitle="Curated by CineMind AI based on your favorite tones, pacing, and rating safety"
        icon={<Sparkles className="w-5 h-5 text-neon-cyan" />}
        movies={recommendedForYou}
        groupName="rail-recommended"
        onSelectMovie={onSelectMovie}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        cardSize="standard"
      />

      {/* 5. Popular Movies */}
      <MovieRail
        title="Popular Movies"
        subtitle="Trending with top critic and audience ratings across Fire TV"
        icon={<Flame className="w-5 h-5 text-fire-amber" />}
        movies={popularMovies}
        groupName="rail-popular"
        onSelectMovie={onSelectMovie}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        cardSize="standard"
      />

      {/* 6. Family Picks */}
      <MovieRail
        title="Family Picks (G & PG)"
        subtitle="Verified safe for all ages with zero content warnings"
        icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
        movies={familyPicks}
        groupName="rail-family-picks"
        onSelectMovie={onSelectMovie}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        cardSize="standard"
      />

      {/* 7. 90-Minute Quick Watches */}
      <MovieRail
        title="90-Minute Quick Watches"
        subtitle="Fast-paced, satisfying features perfect for bedtime constraints"
        icon={<Clock className="w-5 h-5 text-purple-400" />}
        movies={quickWatches}
        groupName="rail-quick"
        onSelectMovie={onSelectMovie}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        cardSize="standard"
      />

      {/* 8. High Energy Spectacle & Adrenaline */}
      <MovieRail
        title="High Energy Spectacle & Adrenaline"
        subtitle="Blockbusters with dynamic audio mixes and thrilling set pieces"
        icon={<Zap className="w-5 h-5 text-orange-500" />}
        movies={highEnergyMovies}
        groupName="rail-energy"
        onSelectMovie={onSelectMovie}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        cardSize="standard"
      />

    </div>
  );
};
