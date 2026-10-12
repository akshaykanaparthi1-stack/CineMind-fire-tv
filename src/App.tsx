import React, { useState } from 'react';
import type { ActiveScreen, Movie, MoodType, WatchlistItem, UserProfile } from './types';
import { SAMPLE_PROFILES } from './data/sampleProfiles';
import { TVNavigationProvider } from './context/TVNavigationContext';
import { Navbar } from './components/navigation/Navbar';
import { HomeScreen } from './components/home/HomeScreen';
import { MoodStudio } from './components/moods/MoodStudio';
import { FamilyVoteHub } from './components/family-vote/FamilyVoteHub';
import { WatchlistHub } from './components/watchlist/WatchlistHub';
import { SearchHub } from './components/search/SearchHub';
import { ProfilesHub } from './components/profiles/ProfilesHub';
import { MovieDetailModal } from './components/movies/MovieDetailModal';
import { VirtualRemoteOverlay } from './components/remote/VirtualRemoteOverlay';
import { TVRemoteGuide } from './components/common/TVRemoteGuide';

const AppContent: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [activeProfile, setActiveProfile] = useState<UserProfile>(SAMPLE_PROFILES[0]); // David (Dad)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [familyVoteCandidate, setFamilyVoteCandidate] = useState<Movie | null>(null);
  const [familySafeMode, setFamilySafeMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [moodStudioInitial, setMoodStudioInitial] = useState<MoodType | null>('Happy');

  // Pre-seed realistic shared family watchlist
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    { movieId: 'spider-verse', addedByProfileId: 'maya', addedAt: '2026-10-10', watched: false },
    { movieId: 'paddington-2', addedByProfileId: 'leo', addedAt: '2026-10-11', watched: false },
    { movieId: 'knives-out', addedByProfileId: 'mom', addedAt: '2026-10-12', watched: false },
  ]);

  const watchlistIds = watchlist.map((w) => w.movieId);

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

  // Launch Family Vote with a specific pre-selected movie
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

  // Switch profile & auto-adjust kid safety lock if kid profile chosen
  const handleProfileSelect = (profile: UserProfile) => {
    setActiveProfile(profile);
    if (profile.role === 'Kid') {
      setFamilySafeMode(true);
    }
    setActiveScreen('home');
  };

  return (
    <div className="min-h-screen bg-cinematic-950 text-slate-100 flex flex-col selection:bg-fire-amber selection:text-black">
      
      {/* 10-Foot Navigation Bar */}
      <Navbar
        activeScreen={activeScreen}
        onScreenChange={setActiveScreen}
        activeProfile={activeProfile}
        onProfileClick={() => setActiveScreen('profiles')}
        watchlistCount={watchlist.length}
        familySafeMode={familySafeMode}
        onToggleFamilySafeMode={() => setFamilySafeMode((prev) => !prev)}
      />

      {/* Main Screen Body */}
      <main className="flex-1 w-full pb-16">
        {activeScreen === 'home' && (
          <HomeScreen
            onSelectMovie={setSelectedMovie}
            onStartFamilyVote={handleStartFamilyVote}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
            activeProfile={activeProfile}
            familySafeMode={familySafeMode}
            onNavigateToMoodStudio={handleNavigateToMoodStudio}
          />
        )}

        {activeScreen === 'moods' && (
          <MoodStudio
            initialMood={moodStudioInitial}
            onSelectMovie={setSelectedMovie}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
            familySafeMode={familySafeMode}
          />
        )}

        {activeScreen === 'family-vote' && (
          <FamilyVoteHub
            onSelectMovie={setSelectedMovie}
            preSelectedMovie={familyVoteCandidate}
          />
        )}

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

        {activeScreen === 'search' && (
          <SearchHub
            onSelectMovie={setSelectedMovie}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
            initialQuery={searchQuery}
          />
        )}

        {activeScreen === 'profiles' && (
          <ProfilesHub
            activeProfile={activeProfile}
            onSelectProfile={handleProfileSelect}
            onBackToHome={() => setActiveScreen('home')}
          />
        )}
      </main>

      {/* Movie Details Modal */}
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

      {/* Unobtrusive Remote Navigation Key Guide */}
      <TVRemoteGuide />
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
