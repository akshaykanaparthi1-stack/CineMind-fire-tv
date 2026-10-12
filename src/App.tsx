import React, { useState, useEffect } from 'react';
import type { ActiveScreen, Movie, MoodType, GenreType, WatchlistItem, UserProfile } from './types';
import { SAMPLE_PROFILES } from './data/sampleProfiles';
import { MOVIES_DATABASE } from './data/moviesData';
import { TVNavigationProvider } from './context/TVNavigationContext';
import { LeftNavigationRail } from './components/navigation/LeftNavigationRail';
import { HomeScreen } from './components/home/HomeScreen';
import { MoodStudio } from './components/moods/MoodStudio';
import { GenresScreen } from './components/genres/GenresScreen';
import { FamilyVoteHub } from './components/family-vote/FamilyVoteHub';
import { WatchlistHub } from './components/watchlist/WatchlistHub';
import { SearchHub } from './components/search/SearchHub';
import { ProfilesHub } from './components/profiles/ProfilesHub';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { MovieDetailModal } from './components/movies/MovieDetailModal';
import { VirtualRemoteOverlay } from './components/remote/VirtualRemoteOverlay';
import { TVRemoteGuide } from './components/common/TVRemoteGuide';

const AppContent: React.FC = () => {
  // Parse initial hash or default to 'home'
  const getScreenFromHash = (): ActiveScreen => {
    const hash = window.location.hash.replace('#', '') as ActiveScreen;
    const validScreens: ActiveScreen[] = [
      'home', 'moods', 'genres', 'family-vote', 'details', 'search', 'watchlist', 'profiles', 'settings'
    ];
    return validScreens.includes(hash) ? hash : 'home';
  };

  const [activeScreen, setActiveScreenState] = useState<ActiveScreen>(getScreenFromHash());
  const [activeProfile, setActiveProfile] = useState<UserProfile>(SAMPLE_PROFILES[0]); // David (Dad)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [familyVoteCandidate, setFamilyVoteCandidate] = useState<Movie | null>(null);
  const [familySafeMode, setFamilySafeMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [moodStudioInitial, setMoodStudioInitial] = useState<MoodType | null>('Happy');
  const [genresScreenInitial, setGenresScreenInitial] = useState<GenreType>('Action');

  // Pre-seed realistic shared family watchlist
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    { movieId: 'spider-verse', addedByProfileId: 'maya', addedAt: '2026-10-10', watched: false },
    { movieId: 'paddington-2', addedByProfileId: 'leo', addedAt: '2026-10-11', watched: false },
    { movieId: 'knives-out', addedByProfileId: 'mom', addedAt: '2026-10-12', watched: false },
  ]);

  const watchlistIds = watchlist.map((w) => w.movieId);

  // Sync screen state with browser history (Supports Browser Back & Forward!)
  const setActiveScreen = (screen: ActiveScreen, replaceHistory = false) => {
    setActiveScreenState(screen);
    if (replaceHistory) {
      window.history.replaceState(null, '', '#' + screen);
    } else {
      window.history.pushState(null, '', '#' + screen);
    }
  };

  // Browser Back navigation listener
  useEffect(() => {
    const handlePopState = () => {
      if (selectedMovie) {
        setSelectedMovie(null);
        return;
      }
      const target = getScreenFromHash();
      setActiveScreenState(target);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedMovie]);

  // Remote Back (Escape / Backspace) event listener
  useEffect(() => {
    const handleTVBack = () => {
      if (selectedMovie) {
        setSelectedMovie(null);
      } else if (activeScreen !== 'home') {
        window.history.back();
      }
    };

    window.addEventListener('tv:back', handleTVBack);
    return () => window.removeEventListener('tv:back', handleTVBack);
  }, [selectedMovie, activeScreen]);

  // Watchlist toggle handler
  const handleToggleWatchlist = (movie: Movie) => {
    setWatchlist((prev) => {
      const exists = prev.some((w) => w.movieId === movie.id);
      if (exists) {
        return prev.filter((w) => w.movieId !== movie.id);
      } else {
        return [
          {
            movieId: movie.id,
            addedByProfileId: activeProfile.id,
            addedAt: new Date().toISOString().split('T')[0],
            watched: false,
          },
          ...prev,
        ];
      }
    });
  };

  const handleRemoveFromWatchlist = (movieId: string) => {
    setWatchlist((prev) => prev.filter((w) => w.movieId !== movieId));
  };

  const handleToggleWatched = (movieId: string) => {
    setWatchlist((prev) =>
      prev.map((w) => (w.movieId === movieId ? { ...w, watched: !w.watched } : w))
    );
  };

  // Launch Family Vote with a specific candidate movie
  const handleStartFamilyVote = (movie: Movie) => {
    setFamilyVoteCandidate(movie);
    setActiveScreen('family-vote');
    if (selectedMovie) {
      setSelectedMovie(null);
    }
  };

  // Simulated Alexa Voice search trigger from remote
  const handleVoiceSearchTrigger = (query: string) => {
    setSearchQuery(query);
    setActiveScreen('search');
  };

  // Quick navigation to mood studio
  const handleNavigateToMoodStudio = (mood: MoodType) => {
    setMoodStudioInitial(mood);
    setActiveScreen('moods');
  };

  // Quick navigation to genre browse
  const handleNavigateToGenre = (genre: GenreType) => {
    setGenresScreenInitial(genre);
    setActiveScreen('genres');
  };

  // Switch profile & auto-adjust kid safety lock if kid profile chosen
  const handleProfileSelect = (profile: UserProfile) => {
    setActiveProfile(profile);
    if (profile.role === 'Kid') {
      setFamilySafeMode(true);
    }
    setActiveScreen('home');
  };

  // Reset watchlist helper for settings
  const handleResetWatchlist = () => {
    setWatchlist([
      { movieId: 'spider-verse', addedByProfileId: 'maya', addedAt: '2026-10-10', watched: false },
      { movieId: 'paddington-2', addedByProfileId: 'leo', addedAt: '2026-10-11', watched: false },
    ]);
  };

  return (
    <div className="min-h-screen bg-cinematic-950 text-slate-100 flex flex-col selection:bg-fire-amber selection:text-black">
      
      {/* 1. Left-Side Navigation Rail (TV Remote Friendly) */}
      <LeftNavigationRail
        activeScreen={activeScreen}
        onScreenChange={setActiveScreen}
        activeProfile={activeProfile}
        watchlistCount={watchlist.length}
        familySafeMode={familySafeMode}
        onToggleFamilySafeMode={() => setFamilySafeMode((prev) => !prev)}
      />

      {/* 2. Main Screen Viewport (Offset for left-rail on TV display) */}
      <div className="flex-1 w-full pl-20 lg:pl-64 flex flex-col transition-all duration-300">
        
        <main className="flex-1 w-full pb-16">
          {/* Screen 1: Home Screen */}
          {activeScreen === 'home' && (
            <HomeScreen
              onSelectMovie={setSelectedMovie}
              onStartFamilyVote={handleStartFamilyVote}
              watchlistIds={watchlistIds}
              onToggleWatchlist={handleToggleWatchlist}
              activeProfile={activeProfile}
              familySafeMode={familySafeMode}
              onNavigateToMoodStudio={handleNavigateToMoodStudio}
              onNavigateToGenre={handleNavigateToGenre}
            />
          )}

          {/* Screen 2: Discover by Mood */}
          {activeScreen === 'moods' && (
            <MoodStudio
              initialMood={moodStudioInitial}
              onSelectMovie={setSelectedMovie}
              watchlistIds={watchlistIds}
              onToggleWatchlist={handleToggleWatchlist}
              familySafeMode={familySafeMode}
            />
          )}

          {/* Screen 3: Browse Genres */}
          {activeScreen === 'genres' && (
            <GenresScreen
              initialGenre={genresScreenInitial}
              onSelectMovie={setSelectedMovie}
              watchlistIds={watchlistIds}
              onToggleWatchlist={handleToggleWatchlist}
              familySafeMode={familySafeMode}
            />
          )}

          {/* Screen 4: Family Vote */}
          {activeScreen === 'family-vote' && (
            <FamilyVoteHub
              onSelectMovie={setSelectedMovie}
              preSelectedMovie={familyVoteCandidate}
              onAddToWatchlist={handleToggleWatchlist}
              watchlistIds={watchlistIds}
            />
          )}

          {/* Screen 5: Movie Details (when navigated directly) */}
          {activeScreen === 'details' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold font-display text-white mb-4">
                Movie Details Showcase
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {MOVIES_DATABASE.slice(0, 12).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMovie(m)}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-fire-amber"
                  >
                    <span className="text-xs font-bold text-white block line-clamp-1">{m.title}</span>
                    <span className="text-[10px] text-slate-400 block">{m.year} • {m.ageRating}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Screen 6: Search */}
          {activeScreen === 'search' && (
            <SearchHub
              onSelectMovie={setSelectedMovie}
              watchlistIds={watchlistIds}
              onToggleWatchlist={handleToggleWatchlist}
              initialQuery={searchQuery}
            />
          )}

          {/* Screen 7: My Watchlist */}
          {activeScreen === 'watchlist' && (
            <WatchlistHub
              watchlist={watchlist}
              onSelectMovie={setSelectedMovie}
              onRemoveFromWatchlist={handleRemoveFromWatchlist}
              onToggleWatched={handleToggleWatched}
              activeProfile={activeProfile}
              onGoHome={() => setActiveScreen('home')}
            />
          )}

          {/* Screen 8: User Profiles */}
          {activeScreen === 'profiles' && (
            <ProfilesHub
              activeProfile={activeProfile}
              onSelectProfile={handleProfileSelect}
              onBackToHome={() => setActiveScreen('home')}
            />
          )}

          {/* Screen 9: Settings */}
          {activeScreen === 'settings' && (
            <SettingsScreen
              familySafeMode={familySafeMode}
              onToggleFamilySafeMode={() => setFamilySafeMode((prev) => !prev)}
              onResetWatchlist={handleResetWatchlist}
            />
          )}
        </main>

        {/* Persistent TV Remote Bottom Guide */}
        <TVRemoteGuide />
      </div>

      {/* Screen 5 / Modal: Movie Details Page & Verified Viewing Modal */}
      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onStartFamilyVote={handleStartFamilyVote}
        inWatchlist={selectedMovie ? watchlistIds.includes(selectedMovie.id) : false}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* Fire TV Virtual Remote Controller Overlay (Press R or click widget) */}
      <VirtualRemoteOverlay
        onHomePress={() => {
          setActiveScreen('home');
          setSelectedMovie(null);
        }}
        onVoiceSearchTrigger={handleVoiceSearchTrigger}
      />

    </div>
  );
};

export function App() {
  return (
    <TVNavigationProvider>
      <AppContent />
    </TVNavigationProvider>
  );
}

export default App;
