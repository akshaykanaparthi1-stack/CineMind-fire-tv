import React, { useState, useMemo } from 'react';
import type { Movie, AgeRating, MoodType } from '../../types';
import { SAMPLE_PROFILES } from '../../data/sampleProfiles';
import { MOVIES_DATABASE } from '../../data/moviesData';
import { useTVFocus, useTVNavigation } from '../../context/TVNavigationContext';
import confetti from 'canvas-confetti';
import { 
  Vote, 
  Users, 
  Trophy, 
  Check, 
  ThumbsUp, 
  Minus, 
  X, 
  Play, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  RotateCcw,
  Star,
  ChevronRight,
  Flame
} from 'lucide-react';

interface FamilyVoteHubProps {
  onSelectMovie: (movie: Movie) => void;
  preSelectedMovie?: Movie | null;
}

export const FamilyVoteHub: React.FC<FamilyVoteHubProps> = ({ 
  onSelectMovie,
  preSelectedMovie 
}) => {
  const { playFeedbackSound } = useTVNavigation();

  // Setup state
  const [step, setStep] = useState<'setup' | 'voting' | 'winner'>('setup');
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([
    'dad', 'mom', 'leo', 'maya'
  ]);
  const [maxAgeRating, setMaxAgeRating] = useState<AgeRating>('PG-13');
  const [maxRuntime, setMaxRuntime] = useState<number>(140);
  const [selectedMood, setSelectedMood] = useState<MoodType | 'Any'>('Any');

  // Voting Arena state
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
  // votes: { [movieId]: { [profileId]: 'love' | 'neutral' | 'skip' } }
  const [votes, setVotes] = useState<Record<string, Record<string, 'love' | 'neutral' | 'skip'>>>({});

  // Filter candidates matching family settings
  const candidateMovies = useMemo(() => {
    let list = MOVIES_DATABASE.filter(m => {
      // Age constraint
      if (maxAgeRating === 'G' && m.ageRating !== 'G') return false;
      if (maxAgeRating === 'PG' && !['G', 'PG'].includes(m.ageRating)) return false;
      if (maxAgeRating === 'PG-13' && !['G', 'PG', 'PG-13'].includes(m.ageRating)) return false;

      // Runtime constraint
      if (m.runtimeMinutes > maxRuntime) return false;

      // Mood constraint
      if (selectedMood !== 'Any' && !m.moods.includes(selectedMood)) return false;

      return true;
    });

    if (list.length < 4) {
      list = MOVIES_DATABASE.slice(0, 6);
    }

    // If pre-selected movie exists and fits, place first
    if (preSelectedMovie) {
      list = [preSelectedMovie, ...list.filter(m => m.id !== preSelectedMovie.id)];
    }

    return list.slice(0, 5); // 5 candidate movies per round
  }, [maxAgeRating, maxRuntime, selectedMood, preSelectedMovie]);

  // Handle auto-locking age rating when child (Leo) is toggled
  const handleToggleProfile = (profileId: string) => {
    playFeedbackSound('move');
    let updated: string[];
    if (selectedProfileIds.includes(profileId)) {
      if (selectedProfileIds.length <= 1) return; // Keep at least 1
      updated = selectedProfileIds.filter(id => id !== profileId);
    } else {
      updated = [...selectedProfileIds, profileId];
    }
    setSelectedProfileIds(updated);

    // If young child is in room, automatically ensure safe rating
    const hasKid = updated.some(id => {
      const p = SAMPLE_PROFILES.find(prof => prof.id === id);
      return p?.role === 'Kid';
    });
    if (hasKid && maxAgeRating === 'R') {
      setMaxAgeRating('PG');
    }
  };

  const handleStartVoting = () => {
    playFeedbackSound('select');
    setCurrentCandidateIndex(0);
    // Initialize default votes for candidate movies
    const initialVotes: Record<string, Record<string, 'love' | 'neutral' | 'skip'>> = {};
    candidateMovies.forEach(m => {
      initialVotes[m.id] = {};
      selectedProfileIds.forEach(pId => {
        const p = SAMPLE_PROFILES.find(prof => prof.id === pId);
        // Pre-fill realistic default votes based on user preferences
        if (p?.likes.includes(m.id)) {
          initialVotes[m.id][pId] = 'love';
        } else if (p?.dislikes.includes(m.id)) {
          initialVotes[m.id][pId] = 'skip';
        } else {
          initialVotes[m.id][pId] = 'neutral';
        }
      });
    });
    setVotes(initialVotes);
    setStep('voting');
  };

  const currentMovie = candidateMovies[currentCandidateIndex];

  const handleVoteChange = (profileId: string, voteType: 'love' | 'neutral' | 'skip') => {
    playFeedbackSound('move');
    if (!currentMovie) return;
    setVotes(prev => ({
      ...prev,
      [currentMovie.id]: {
        ...(prev[currentMovie.id] || {}),
        [profileId]: voteType
      }
    }));
  };

  const handleNextMovie = () => {
    playFeedbackSound('select');
    if (currentCandidateIndex < candidateMovies.length - 1) {
      setCurrentCandidateIndex(prev => prev + 1);
    } else {
      // Calculate winner & celebrate!
      setStep('winner');
      playFeedbackSound('fanfare');
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  // Score calculation for candidate movies
  const movieRankings = useMemo(() => {
    return candidateMovies.map(movie => {
      const movieVotes = votes[movie.id] || {};
      let totalPoints = 0;
      let maxPossible = selectedProfileIds.length * 2;
      const memberBreakdown: Record<string, number> = {};

      selectedProfileIds.forEach(pId => {
        const v = movieVotes[pId] || 'neutral';
        let memberScore = 70; // baseline
        if (v === 'love') {
          totalPoints += 2;
          memberScore = 98;
        } else if (v === 'neutral') {
          totalPoints += 1;
          memberScore = 78;
        } else {
          totalPoints -= 1;
          memberScore = 40;
        }
        memberBreakdown[pId] = memberScore;
      });

      const compatibilityPercent = Math.min(
        99,
        Math.max(50, Math.round(55 + (totalPoints / Math.max(1, maxPossible)) * 44))
      );

      return {
        movie,
        totalPoints,
        compatibilityPercent,
        memberBreakdown
      };
    }).sort((a, b) => b.compatibilityPercent - a.compatibilityPercent);
  }, [candidateMovies, votes, selectedProfileIds]);

  const winner = movieRankings[0];

  // TV Focus triggers
  const startBtn = useTVFocus('vote-btn-start', 'vote-setup', {
    order: 10,
    onSelect: handleStartVoting
  });

  const nextBtn = useTVFocus('vote-btn-next', 'vote-voting', {
    order: 20,
    onSelect: handleNextMovie
  });

  const winnerPlayBtn = useTVFocus('vote-btn-winner-play', 'vote-winner', {
    order: 30,
    onSelect: () => winner && onSelectMovie(winner.movie)
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-8 py-8 animate-fade-in select-none">
      
      {/* Feature Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-fire-amber p-0.5 shadow-xl shadow-purple-900/30">
            <div className="w-full h-full bg-cinematic-900 rounded-[14px] flex items-center justify-center">
              <Vote className="w-6 h-6 text-fire-amber" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                CineMind Family Vote
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-fire-amber/20 text-fire-amber border border-fire-amber/40 text-[10px] font-bold uppercase tracking-wider">
                Consensus Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              No more endless scrolling debates. Everyone votes, CineMind finds the perfect match.
            </p>
          </div>
        </div>

        {/* Status Stepper */}
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 text-xs font-semibold">
          <span className={step === 'setup' ? 'text-fire-amber font-bold' : 'text-slate-400'}>
            1. Who's Watching
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={step === 'voting' ? 'text-fire-amber font-bold' : 'text-slate-400'}>
            2. Cast Votes
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={step === 'winner' ? 'text-fire-amber font-bold' : 'text-slate-400'}>
            3. Final Match
          </span>
        </div>
      </div>

      {/* STEP 1: SETUP */}
      {step === 'setup' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Family Roster Picker */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-fire-amber" />
              <h2 className="text-lg font-bold font-display text-white">
                1. Select Family Members in the Room
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {SAMPLE_PROFILES.map((profile) => {
                const isSelected = selectedProfileIds.includes(profile.id);
                return (
                  <button
                    key={profile.id}
                    onClick={() => handleToggleProfile(profile.id)}
                    className={`relative p-5 rounded-2xl border text-left transition-all duration-200 tv-focusable ${
                      isSelected
                        ? 'bg-slate-800/90 border-fire-amber ring-2 ring-fire-amber shadow-lg shadow-fire-amber/20 scale-102'
                        : 'bg-cinematic-900/70 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{profile.avatar}</span>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-fire-amber text-black' : 'bg-slate-800 text-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white">{profile.name}</h3>
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">
                      Role: {profile.role}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">
                      Max: {profile.maxAgeRating} • Fav: {profile.favoriteMoods[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group Constraints Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl bg-cinematic-900/80 border border-slate-800">
            
            {/* Max Age Rating */}
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Age Safety Lock
              </label>
              <div className="flex gap-2">
                {(['G', 'PG', 'PG-13', 'R'] as AgeRating[]).map((rating) => (
                  <button
                    key={rating}
                    onClick={() => {
                      playFeedbackSound('move');
                      setMaxAgeRating(rating);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      maxAgeRating === rating
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {maxAgeRating === 'PG' && 'Strict family mode: Kids present, filter out PG-13 & R'}
                {maxAgeRating === 'PG-13' && 'Family mode with teens: Allows PG-13, filters R'}
                {maxAgeRating === 'R' && 'Adult movie night: All ratings enabled'}
              </p>
            </div>

            {/* Max Runtime */}
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                Max Runtime
              </label>
              <div className="flex gap-2">
                {[
                  { label: '90m', val: 95 },
                  { label: '115m', val: 120 },
                  { label: '140m', val: 145 },
                  { label: 'Any', val: 240 }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      playFeedbackSound('move');
                      setMaxRuntime(item.val);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      maxRuntime === item.val
                        ? 'bg-cyan-500 text-black shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {maxRuntime <= 100 ? 'Quick bedtime watch (< 100m)' : 'Standard evening feature'}
              </p>
            </div>

            {/* Target Mood */}
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-fire-amber" />
                Shared Mood Goal
              </label>
              <div className="flex gap-2">
                {(['Any', 'Happy', 'Excited', 'Relaxed'] as (MoodType | 'Any')[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      playFeedbackSound('move');
                      setSelectedMood(m);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedMood === m
                        ? 'bg-fire-amber text-black shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                CineMind aligns tone with everyone’s current state of mind
              </p>
            </div>

          </div>

          {/* Start Button */}
          <div className="flex justify-center pt-4">
            <button
              ref={startBtn.ref as any}
              onClick={handleStartVoting}
              className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-base tracking-wide transition-all shadow-xl tv-focusable ${
                startBtn.isFocused
                  ? 'bg-gradient-to-r from-fire-amber to-fire-orange text-black ring-4 ring-fire-amber scale-105 shadow-fire-amber/50'
                  : 'bg-gradient-to-r from-fire-amber to-fire-orange text-black hover:brightness-110 shadow-fire-amber/30'
              }`}
            >
              <Vote className="w-5 h-5 stroke-[2.5]" />
              <span>Enter Family Voting Arena ({candidateMovies.length} Candidates)</span>
            </button>
          </div>

        </div>
      )}

      {/* STEP 2: VOTING ARENA */}
      {step === 'voting' && currentMovie && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Progress bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Candidate Movie {currentCandidateIndex + 1} of {candidateMovies.length}</span>
            <div className="flex gap-1.5">
              {candidateMovies.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentCandidateIndex
                      ? 'w-8 bg-fire-amber'
                      : i < currentCandidateIndex
                      ? 'w-4 bg-emerald-500'
                      : 'w-4 bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Current Candidate Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-8 rounded-3xl bg-cinematic-900 border border-slate-800 shadow-2xl">
            
            {/* Poster / Backdrop column */}
            <div className="lg:col-span-4 relative rounded-2xl overflow-hidden aspect-[2/3] max-h-[460px] shadow-2xl">
              <img
                src={currentMovie.posterUrl}
                alt={currentMovie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-xs font-bold text-fire-amber border border-fire-amber/40">
                  {currentMovie.streamingProvider}
                </span>
                <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-xs font-bold text-white border border-slate-700">
                  {currentMovie.ageRating}
                </span>
              </div>
            </div>

            {/* Movie Info & Voting Matrix */}
            <div className="lg:col-span-8 flex flex-col justify-between">
              
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-fire-amber font-semibold uppercase tracking-wider">
                    ⚡ {currentMovie.moods.join(' • ')}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentMovie.runtimeMinutes} min
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-amber-400 flex items-center gap-1 font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {currentMovie.rating.toFixed(1)}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white">
                  {currentMovie.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 italic mb-3">
                  "{currentMovie.tagline}"
                </p>

                <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed mb-4">
                  {currentMovie.synopsis}
                </p>

                {/* AI Predicted Harmony Badge */}
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-fire-amber/30 flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-lg bg-fire-amber/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-fire-amber" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-white block">
                      Why AI Thinks Your Family Will Love This:
                    </span>
                    <span className="text-slate-300">
                      {currentMovie.aiInsights.headline}
                    </span>
                  </div>
                </div>
              </div>

              {/* Individual Family Member Votes */}
              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-fire-amber" />
                  Cast Votes for Each Family Member:
                </h4>

                <div className="space-y-2.5">
                  {selectedProfileIds.map((profileId) => {
                    const profile = SAMPLE_PROFILES.find((p) => p.id === profileId);
                    if (!profile) return null;
                    const currentVote = votes[currentMovie.id]?.[profileId] || 'neutral';

                    return (
                      <div
                        key={profileId}
                        className="flex items-center justify-between p-2.5 px-4 rounded-xl bg-slate-800/60 border border-slate-700/60"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{profile.avatar}</span>
                          <div>
                            <span className="text-xs font-bold text-white block leading-tight">
                              {profile.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {profile.role}
                            </span>
                          </div>
                        </div>

                        {/* 3-State Vote Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVoteChange(profileId, 'love')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentVote === 'love'
                                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400 scale-105'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Love It</span>
                          </button>

                          <button
                            onClick={() => handleVoteChange(profileId, 'neutral')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              currentVote === 'neutral'
                                ? 'bg-slate-200 text-black shadow-md ring-2 ring-white scale-105'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                            }`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                            <span>Neutral</span>
                          </button>

                          <button
                            onClick={() => handleVoteChange(profileId, 'skip')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentVote === 'skip'
                                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400 scale-105'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Skip</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Nav / Next Candidate Button */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setStep('setup')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel / Adjust Family
                </button>

                <button
                  ref={nextBtn.ref as any}
                  onClick={handleNextMovie}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg tv-focusable ${
                    nextBtn.isFocused
                      ? 'bg-fire-amber text-black ring-4 ring-fire-amber scale-105 shadow-fire-amber/40'
                      : 'bg-white text-black hover:bg-slate-200'
                  }`}
                >
                  <span>
                    {currentCandidateIndex < candidateMovies.length - 1
                      ? 'Next Candidate Movie'
                      : 'Reveal Winning Movie! 🎉'}
                  </span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* STEP 3: CONSENSUS WINNER REVEAL */}
      {step === 'winner' && winner && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Winner Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-cinematic-900 to-purple-900/30 border-2 border-fire-amber p-8 sm:p-10 shadow-[0_20px_70px_rgba(255,153,0,0.3)]">
            
            <div className="flex items-center gap-2.5 mb-3 text-fire-amber font-display font-extrabold text-sm uppercase tracking-widest">
              <Trophy className="w-5 h-5 text-fire-amber animate-bounce" />
              <span>Living Room Consensus Winner</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Winner Poster */}
              <div className="lg:col-span-4 rounded-2xl overflow-hidden shadow-2xl border border-fire-amber/50 aspect-[2/3] max-h-[440px]">
                <img
                  src={winner.movie.posterUrl}
                  alt={winner.movie.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Winner Stats and Per-Member Compatibility */}
              <div className="lg:col-span-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded bg-fire-amber text-black text-xs font-black uppercase">
                      #1 Ranked Choice
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-xs font-bold">
                      {winner.movie.ageRating}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      {winner.movie.runtimeMinutes} min
                    </span>
                    <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">
                      ⚡ 100% Family Friendly
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-black font-display text-white mb-2">
                    {winner.movie.title}
                  </h2>
                  <p className="text-base text-slate-300 italic mb-4">
                    "{winner.movie.tagline}"
                  </p>

                  <div className="p-4 rounded-2xl bg-cinematic-950/80 border border-fire-amber/40 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase font-bold text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-fire-amber" />
                        Overall Family Harmony Index
                      </span>
                      <span className="text-2xl font-black text-fire-amber font-display">
                        {winner.compatibilityPercent}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {winner.movie.aiInsights.headline}
                    </p>
                  </div>
                </div>

                {/* Per Family Member Breakdown */}
                <div className="mb-6">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
                    Individual Member Compatibility:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedProfileIds.map((pId) => {
                      const p = SAMPLE_PROFILES.find((prof) => prof.id === pId);
                      const score = winner.memberBreakdown[pId] || 85;
                      return (
                        <div
                          key={pId}
                          className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center"
                        >
                          <span className="text-2xl block mb-1">{p?.avatar}</span>
                          <span className="text-xs font-bold text-white block">
                            {p?.name.split(' ')[0]}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {score}% Match
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Winner CTAs */}
                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    ref={winnerPlayBtn.ref as any}
                    onClick={() => onSelectMovie(winner.movie)}
                    className={`flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base tracking-wide transition-all shadow-xl tv-focusable ${
                      winnerPlayBtn.isFocused
                        ? 'bg-fire-amber text-black ring-4 ring-fire-amber scale-105 shadow-fire-amber/50'
                        : 'bg-gradient-to-r from-fire-amber to-fire-orange text-black hover:brightness-110'
                    }`}
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Watch Now on {winner.movie.streamingProvider}</span>
                  </button>

                  <button
                    onClick={() => {
                      playFeedbackSound('select');
                      setStep('setup');
                    }}
                    className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-sm font-semibold border border-slate-700"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Start New Family Vote</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Runner-Ups Carousel */}
          {movieRankings.length > 1 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                Runner-Up Consensus Contenders:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {movieRankings.slice(1, 5).map((item, idx) => (
                  <div
                    key={item.movie.id}
                    onClick={() => onSelectMovie(item.movie)}
                    className="p-4 rounded-2xl bg-cinematic-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center gap-3.5 group"
                  >
                    <img
                      src={item.movie.posterUrl}
                      alt={item.movie.title}
                      className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-bold text-slate-400">
                        #{idx + 2} • {item.compatibilityPercent}% Match
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-fire-amber transition-colors line-clamp-1">
                        {item.movie.title}
                      </h4>
                      <span className="text-xs text-slate-400">
                        {item.movie.runtimeMinutes}m • {item.movie.ageRating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
