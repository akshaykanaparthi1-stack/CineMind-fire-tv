import React, { useState, useMemo } from 'react';
import type { Movie, WatchlistItem, UserProfile } from '../../types';
import { SAMPLE_PROFILES } from '../../data/sampleProfiles';
import { MOVIES_DATABASE } from '../../data/moviesData';
import { MovieCard } from '../movies/MovieCard';
import { Bookmark, Trash2, CheckCircle2 } from 'lucide-react';
import { useTVNavigation } from '../../context/TVNavigationContext';

interface WatchlistHubProps {
  watchlist: WatchlistItem[];
  onSelectMovie: (movie: Movie) => void;
  onRemoveFromWatchlist: (movieId: string) => void;
  onToggleWatched: (movieId: string) => void;
  activeProfile: UserProfile;
  onGoHome: () => void;
}

export const WatchlistHub: React.FC<WatchlistHubProps> = ({
  watchlist,
  onSelectMovie,
  onRemoveFromWatchlist,
  onToggleWatched,
  onGoHome,
}) => {
  const { playFeedbackSound } = useTVNavigation();
  const [filterProfileId, setFilterProfileId] = useState<string>('all');
  const [showWatchedOnly, setShowWatchedOnly] = useState<boolean>(false);

  // Map watchlist items to movie models
  const watchlistMovies = useMemo(() => {
    return watchlist
      .map((item) => {
        const movie = MOVIES_DATABASE.find((m) => m.id === item.movieId);
        const profile = SAMPLE_PROFILES.find((p) => p.id === item.addedByProfileId);
        return {
          item,
          movie,
          profile,
        };
      })
      .filter((entry) => entry.movie !== undefined) as {
      item: WatchlistItem;
      movie: Movie;
      profile?: UserProfile;
    }[];
  }, [watchlist]);

  const filteredItems = useMemo(() => {
    return watchlistMovies.filter(({ item }) => {
      if (filterProfileId !== 'all' && item.addedByProfileId !== filterProfileId) {
        return false;
      }
      if (showWatchedOnly && !item.watched) {
        return false;
      }
      return true;
    });
  }, [watchlistMovies, filterProfileId, showWatchedOnly]);

  return (
    <div className="w-full max-w-[1800px] mx-auto px-8 py-8 animate-fade-in select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-fire-amber/20 border border-fire-amber/40 flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-fire-amber" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold font-display text-white">
                Shared Family Watchlist
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono">
                {watchlist.length} Titles Saved
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              One central living room queue. Tagged with who added each title.
            </p>
          </div>
        </div>
      </div>

      {/* Filter by Family Member Bar */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => {
              playFeedbackSound('move');
              setFilterProfileId('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterProfileId === 'all'
                ? 'bg-fire-amber text-black shadow-md'
                : 'bg-cinematic-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Family ({watchlistMovies.length})
          </button>

          {SAMPLE_PROFILES.map((profile) => {
            const count = watchlistMovies.filter(
              (w) => w.item.addedByProfileId === profile.id
            ).length;
            const isSelected = filterProfileId === profile.id;

            return (
              <button
                key={profile.id}
                onClick={() => {
                  playFeedbackSound('move');
                  setFilterProfileId(profile.id);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-slate-100 text-black shadow-md font-bold'
                    : 'bg-cinematic-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{profile.avatar}</span>
                <span>{profile.name.split(' ')[0]}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Watched toggle */}
        <button
          onClick={() => setShowWatchedOnly(!showWatchedOnly)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            showWatchedOnly
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          {showWatchedOnly ? 'Showing Watched Only' : 'Include Watched'}
        </button>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-cinematic-900/60 border border-slate-800">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center mb-4">
            <Bookmark className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold font-display text-white mb-1">
            No Titles in This Watchlist View
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Bookmark movies from the Home screen or vote together in Family Vote to fill your shared queue!
          </p>
          <button
            onClick={onGoHome}
            className="px-6 py-3 rounded-2xl bg-fire-amber text-black font-bold text-xs tracking-wide hover:brightness-110 shadow-lg shadow-fire-amber/20"
          >
            Explore Movies on Home
          </button>
        </div>
      ) : (
        /* Watchlist Grid with Added By info */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredItems.map(({ item, movie, profile }, index) => (
            <div key={item.movieId} className="flex flex-col">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-300">
                  <span>{profile?.avatar || '👤'}</span>
                  <span>{profile?.name.split(' ')[0] || 'Family'}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onToggleWatched(movie.id)}
                    className={`text-xs p-1 rounded transition-colors ${
                      item.watched ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title={item.watched ? 'Mark as unwatched' : 'Mark as watched'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveFromWatchlist(movie.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <MovieCard
                movie={movie}
                groupName="watchlist-grid"
                order={index}
                onSelect={onSelectMovie}
                inWatchlist={true}
                onToggleWatchlist={() => onRemoveFromWatchlist(movie.id)}
              />
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
