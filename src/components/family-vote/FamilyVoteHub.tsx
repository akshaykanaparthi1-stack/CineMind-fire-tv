import React, { useState, useEffect, useMemo } from 'react';
import type { Movie, AgeRating } from '../../types';
import type { 
  ParticipantPreference, 
  VoteType, 
  GroupRecommendationResult,
  FamilyVoteSession 
} from '../../types/familyVote';
import { SAMPLE_PROFILES } from '../../data/sampleProfiles';
import { MOVIES_DATABASE, GENRES_LIST, MOODS_CONFIG } from '../../data/moviesData';
import { 
  filterMoviesByMandatoryRestrictions, 
  rankMoviesForFamilyGroup 
} from '../../services/familyVoteAlgorithm';
import { FamilyVoteSessionService } from '../../services/familyVoteSessionService';
import { apiClient } from '../../services/apiClient';
import { useTVFocus, useTVNavigation } from '../../context/TVNavigationContext';
import { MovieImage } from '../common/MovieImage';
import confetti from 'canvas-confetti';
import { 
  Vote, 
  Trophy, 
  Ban, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  RotateCcw, 
  AlertTriangle, 
  ChevronRight, 
  Globe,
  Award
} from 'lucide-react';

interface FamilyVoteHubProps {
  onSelectMovie: (movie: Movie) => void;
  preSelectedMovie?: Movie | null;
  onAddToWatchlist?: (movie: Movie) => void;
  watchlistIds?: string[];
}

// Default participant preset generator
function createDefaultParticipant(index: number, existingProfileId?: string): ParticipantPreference {
  if (existingProfileId) {
    const existing = SAMPLE_PROFILES.find(p => p.id === existingProfileId);
    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        avatar: existing.avatar,
        color: existing.color,
        isTemporary: false,
        preferredMoods: [...existing.favoriteMoods],
        preferredGenres: [...existing.favoriteGenres],
        preferredLanguage: 'English',
        maxRuntimeMinutes: existing.role === 'Kid' ? 100 : 135,
        maxAgeRating: existing.maxAgeRating,
        contentRestrictions: {
          avoidViolence: existing.role === 'Kid',
          avoidStrongLanguage: existing.role === 'Kid',
          avoidSensitiveThemes: false,
        }
      };
    }
  }

  const defaultAvatars = ['🍿', '🎮', '🎧', '🎸', '🌟', '🦄'];
  const defaultColors = ['#3b82f6', '#ec4899', '#ff9900', '#10b981', '#a855f7', '#06b6d4'];

  return {
    id: `player-${index + 1}-${Date.now().toString().slice(-4)}`,
    name: `Player ${index + 1}`,
    avatar: defaultAvatars[index % defaultAvatars.length],
    color: defaultColors[index % defaultColors.length],
    isTemporary: true,
    preferredMoods: ['Happy', 'Excited'],
    preferredGenres: ['Comedy', 'Action'],
    preferredLanguage: 'English',
    maxRuntimeMinutes: 120,
    maxAgeRating: 'PG-13',
    contentRestrictions: {}
  };
}

export const FamilyVoteHub: React.FC<FamilyVoteHubProps> = ({ 
  onSelectMovie,
  preSelectedMovie,
  onAddToWatchlist,
  watchlistIds = []
}) => {
  const { playFeedbackSound } = useTVNavigation();

  // Session state
  const [sessionStep, setSessionStep] = useState<
    'count_selection' | 'participant_config' | 'restrictions_audit' | 'voting_arena' | 'results'
  >('count_selection');

  const [participantCount, setParticipantCount] = useState<number>(4);
  const [participants, setParticipants] = useState<ParticipantPreference[]>([]);
  const [editingParticipantIndex, setEditingParticipantIndex] = useState<number>(0);

  // Voting state
  const [candidateMovies, setCandidateMovies] = useState<Movie[]>([]);
  const [currentVotingIndex, setCurrentVotingIndex] = useState<number>(0);
  const [votes, setVotes] = useState<Record<string, Record<string, VoteType>>>({});

  // Final Results state
  const [rankedResults, setRankedResults] = useState<GroupRecommendationResult[]>([]);
  const [finalSelectedMovie, setFinalSelectedMovie] = useState<Movie | null>(null);
  const [isSavedToWatchlist, setIsSavedToWatchlist] = useState<boolean>(false);
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'supabase' | 'demo'>('demo');
  const [aiWinnerExplanation, setAiWinnerExplanation] = useState<{
    headline: string;
    vibeCheck: string;
    parentalGuidance: string;
    tailoredReasons: string[];
  } | null>(null);

  // Initialize participants when count or step changes
  useEffect(() => {
    // Attempt to seed from initial household profiles
    const initialProfiles = ['dad', 'mom', 'leo', 'maya', 'grandma'];
    const seeded: ParticipantPreference[] = [];
    for (let i = 0; i < participantCount; i++) {
      seeded.push(createDefaultParticipant(i, initialProfiles[i]));
    }
    setParticipants(seeded);
  }, [participantCount]);

  // Load session from storage if present
  useEffect(() => {
    FamilyVoteSessionService.loadCurrentSession().then((saved) => {
      if (saved && saved.status === 'results' && saved.participants.length >= 2) {
        // Option to resume or start fresh
      }
    });
  }, []);

  // Run Mandatory Filter Audit
  const filterAudit = useMemo(() => {
    return filterMoviesByMandatoryRestrictions(MOVIES_DATABASE, participants);
  }, [participants]);

  // Pre-seed candidate movies when entering voting arena
  const handleProceedToVoting = () => {
    playFeedbackSound('select');
    let pool = filterAudit.survivingMovies;
    if (preSelectedMovie && pool.some(m => m.id === preSelectedMovie.id)) {
      pool = [preSelectedMovie, ...pool.filter(m => m.id !== preSelectedMovie.id)];
    }
    const candidates = pool.slice(0, 6); // 6 candidates for the round
    setCandidateMovies(candidates);
    setCurrentVotingIndex(0);

    // Initialize default votes based on past preferences
    const initVotes: Record<string, Record<string, VoteType>> = {};
    candidates.forEach((m) => {
      initVotes[m.id] = {};
      participants.forEach((p) => {
        initVotes[m.id][p.id] = 'neutral';
      });
    });
    setVotes(initVotes);
    setSessionStep('voting_arena');

    // Register session in FastAPI & Supabase backend asynchronously
    apiClient.createSession(participants[0]?.id || 'host', participants.length)
      .then((created) => {
        if (created) {
          setBackendSessionId(created.sessionId);
          setDataSource(created.source === 'supabase' ? 'supabase' : 'demo');
          apiClient.registerParticipants(created.sessionId, participants).catch(() => {});
        }
      })
      .catch(() => {});
  };

  // Cast vote for participant
  const handleCastVote = (participantId: string, voteType: VoteType) => {
    playFeedbackSound('move');
    const currentMovie = candidateMovies[currentVotingIndex];
    if (!currentMovie) return;

    setVotes((prev) => ({
      ...prev,
      [currentMovie.id]: {
        ...(prev[currentMovie.id] || {}),
        [participantId]: voteType,
      },
    }));
  };

  // Quick unanimous vote for couch speed
  const handleQuickUnanimousVote = (voteType: VoteType) => {
    playFeedbackSound('select');
    const currentMovie = candidateMovies[currentVotingIndex];
    if (!currentMovie) return;

    const roundVotes: Record<string, VoteType> = {};
    participants.forEach((p) => {
      roundVotes[p.id] = voteType;
    });

    setVotes((prev) => ({
      ...prev,
      [currentMovie.id]: roundVotes,
    }));
  };

  // Next candidate movie or calculate results
  const handleNextMovie = () => {
    playFeedbackSound('select');
    if (currentVotingIndex < candidateMovies.length - 1) {
      setCurrentVotingIndex((prev) => prev + 1);
    } else {
      // Calculate transparent results
      const ranked = rankMoviesForFamilyGroup(candidateMovies, participants, votes);
      setRankedResults(ranked);
      setSessionStep('results');
      playFeedbackSound('fanfare');
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
      });

      // Persist session
      const sessionRecord: FamilyVoteSession = {
        id: `vote-session-${Date.now()}`,
        title: `Movie Night (${participants.length} Players)`,
        createdAt: new Date().toISOString(),
        hostName: participants[0]?.name || 'Host',
        participantCount: participants.length,
        participants,
        candidateMovieIds: candidateMovies.map((m) => m.id),
        votes,
        currentVotingMovieIndex: currentVotingIndex,
        status: 'results',
        backendSessionId: backendSessionId || undefined,
        source: dataSource,
      };
      FamilyVoteSessionService.saveSession(sessionRecord);

      // Async backend verification & ranking calculation
      if (backendSessionId) {
        apiClient.calculateSessionResults(backendSessionId, candidateMovies)
          .then((backendRes) => {
            if (backendRes && backendRes.results.length > 0) {
              setRankedResults(backendRes.results);
              setDataSource(backendRes.source === 'supabase' ? 'supabase' : 'demo');
            }
          })
          .catch(() => {});
      }

      // Fetch AI spoiler-free explanation for top pick
      const topPick = ranked[0]?.movie;
      if (topPick) {
        apiClient.getAiExplanation(topPick, participants)
          .then((aiRes) => {
            if (aiRes) {
              setAiWinnerExplanation({
                headline: aiRes.headline,
                vibeCheck: aiRes.spoilerFreeVibeCheck,
                parentalGuidance: aiRes.parentalGuidance,
                tailoredReasons: aiRes.tailoredReasons,
              });
            }
          })
          .catch(() => {});
      }
    }
  };

  // Final choice selection & Watchlist save
  const handleChooseFinalMovie = (movie: Movie) => {
    playFeedbackSound('fanfare');
    setFinalSelectedMovie(movie);
    if (onAddToWatchlist) {
      onAddToWatchlist(movie);
      setIsSavedToWatchlist(true);
    }

    if (backendSessionId) {
      apiClient.selectWinner(backendSessionId, movie.id, true).catch(() => {});
    }
  };

  // Restart session
  const handleRestart = () => {
    playFeedbackSound('select');
    setSessionStep('count_selection');
    setFinalSelectedMovie(null);
    setIsSavedToWatchlist(false);
  };

  // TV Focus hooks
  const startCountBtn = useTVFocus('vote-btn-confirm-count', 'vote-step1', {
    order: 0,
    onSelect: () => setSessionStep('participant_config'),
  });

  const auditBtn = useTVFocus('vote-btn-audit-pass', 'vote-step3', {
    order: 10,
    onSelect: handleProceedToVoting,
  });

  const nextVoteBtn = useTVFocus('vote-btn-voting-next', 'vote-step4', {
    order: 20,
    onSelect: handleNextMovie,
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-8 py-8 animate-fade-in select-none">
      
      {/* Feature Header with Step Indicator */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800 flex-wrap gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-none bg-gradient-to-tr from-purple-600 via-indigo-600 to-fire-amber p-0.5 shadow-xl shadow-purple-900/30 flex-shrink-0">
            <div className="w-full h-full bg-cinematic-900 rounded-none flex items-center justify-center">
              <Vote className="w-6 h-6 text-fire-amber" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                Family Vote
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-fire-amber/20 text-fire-amber border border-fire-amber/40 text-[10px] font-bold uppercase tracking-wider">
                Consensus Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Transparent multi-viewer recommendation scoring: combining votes, moods, runtimes, and age safety.
            </p>
          </div>
        </div>

        {/* 5-Step Process Bar */}
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 text-xs font-semibold overflow-x-auto no-scrollbar">
          <span className={sessionStep === 'count_selection' ? 'text-fire-amber font-bold' : 'text-slate-500'}>
            1. Player Count
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={sessionStep === 'participant_config' ? 'text-fire-amber font-bold' : 'text-slate-500'}>
            2. Player Profiles
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={sessionStep === 'restrictions_audit' ? 'text-fire-amber font-bold' : 'text-slate-500'}>
            3. Safety Audit
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={sessionStep === 'voting_arena' ? 'text-fire-amber font-bold' : 'text-slate-500'}>
            4. Remote Voting
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={sessionStep === 'results' ? 'text-fire-amber font-bold' : 'text-slate-500'}>
            5. Top 3 Results
          </span>
        </div>
      </div>

      {/* ================= STEP 1: PARTICIPANT COUNT SELECTION (2 to 6) ================= */}
      {sessionStep === 'count_selection' && (
        <div className="max-w-3xl mx-auto py-6 space-y-8 animate-fade-in text-center">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-fire-amber block mb-2">
              STEP 1 OF 5 • SESSION SETUP
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white mb-2">
              How Many People Are Watching Tonight?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Select the number of participants gathered on the couch (2 to 6 viewers). CineMind will harmonize everyone’s tastes.
            </p>
          </div>

          {/* Participant Count Selector (2 to 6) */}
          <div className="grid grid-cols-5 gap-3.5 max-w-xl mx-auto">
            {[2, 3, 4, 5, 6].map((count) => (
              <button
                key={count}
                onClick={() => {
                  playFeedbackSound('move');
                  setParticipantCount(count);
                }}
                className={`py-6 rounded-3xl border text-center transition-all duration-200 tv-focusable ${
                  participantCount === count
                    ? 'bg-gradient-to-b from-fire-amber to-fire-orange text-black font-black scale-105 shadow-xl shadow-fire-amber/30 border-fire-amber'
                    : 'bg-cinematic-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                <span className="text-3xl font-display font-black block">{count}</span>
                <span className="text-[11px] font-semibold tracking-wider uppercase block mt-1 opacity-80">
                  Viewers
                </span>
              </button>
            ))}
          </div>

          <div className="pt-4">
            <button
              ref={startCountBtn.ref as any}
              onClick={() => {
                playFeedbackSound('select');
                setSessionStep('participant_config');
              }}
              className={`inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl font-bold text-base tracking-wide transition-all shadow-xl tv-focusable ${
                startCountBtn.isFocused
                  ? 'bg-fire-amber text-black ring-4 ring-fire-amber scale-105 shadow-fire-amber/40'
                  : 'bg-white text-black hover:bg-slate-200'
              }`}
            >
              <span>Configure {participantCount} Participant Profiles</span>
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: PARTICIPANT PREFERENCE CONFIGURATION ================= */}
      {sessionStep === 'participant_config' && (
        <div className="space-y-8 animate-fade-in">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-fire-amber block mb-1">
              STEP 2 OF 5 • PARTICIPANT PROFILES
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              Who Is In The Room Tonight?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select existing household members or create temporary players. Customize genres, moods, runtimes, and mandatory age locks.
            </p>
          </div>

          {/* Participant Tab Bar */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 border-b border-slate-800">
            {participants.map((p, idx) => {
              const isEditing = editingParticipantIndex === idx;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    playFeedbackSound('move');
                    setEditingParticipantIndex(idx);
                  }}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border text-xs font-bold transition-all ${
                    isEditing
                      ? 'bg-slate-800 border-fire-amber text-white ring-2 ring-fire-amber shadow-lg scale-102'
                      : 'bg-cinematic-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl">{p.avatar}</span>
                  <div className="text-left">
                    <span className="block text-white font-bold">{p.name}</span>
                    <span className="block text-[10px] text-slate-400 font-normal">
                      Max: {p.maxAgeRating} • {p.maxRuntimeMinutes}m
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Participant Preference Studio */}
          {participants[editingParticipantIndex] && (() => {
            const currentP = participants[editingParticipantIndex];

            const updateCurrent = (patch: Partial<ParticipantPreference>) => {
              setParticipants((prev) => {
                const updated = [...prev];
                updated[editingParticipantIndex] = {
                  ...updated[editingParticipantIndex],
                  ...patch,
                };
                return updated;
              });
            };

            return (
              <div className="p-6 sm:p-8 rounded-3xl bg-cinematic-900 border border-slate-800 space-y-6">
                
                {/* Profile Identity & Preset Quick Picker */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="text-3xl p-3 rounded-2xl bg-slate-800 border border-slate-700">
                      {currentP.avatar}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={currentP.name}
                        onChange={(e) => updateCurrent({ name: e.target.value })}
                        className="text-lg font-bold text-white bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700 focus:outline-none focus:border-fire-amber"
                        placeholder="Player Name"
                      />
                      <span className="text-[11px] text-slate-400 block mt-1">
                        Editing Preferences for Player {editingParticipantIndex + 1}
                      </span>
                    </div>
                  </div>

                  {/* Load from Existing Household Profile */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Copy from:</span>
                    {SAMPLE_PROFILES.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          playFeedbackSound('select');
                          updateCurrent({
                            name: preset.name.split(' ')[0],
                            avatar: preset.avatar,
                            color: preset.color,
                            preferredGenres: [...preset.favoriteGenres],
                            preferredMoods: [...preset.favoriteMoods],
                            maxAgeRating: preset.maxAgeRating,
                            maxRuntimeMinutes: preset.role === 'Kid' ? 95 : 135,
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
                        title={`Copy ${preset.name}'s preferences`}
                      >
                        {preset.avatar} {preset.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preference Grid: Moods, Genres, Runtime, Age Rating, Restrictions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* 1. Preferred Moods */}
                  <div>
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-fire-amber" />
                      Preferred Moods (Select 1-3)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {MOODS_CONFIG.map((m) => {
                        const isFav = currentP.preferredMoods.includes(m.mood);
                        return (
                          <button
                            key={m.mood}
                            onClick={() => {
                              playFeedbackSound('move');
                              const next = isFav
                                ? currentP.preferredMoods.filter((x) => x !== m.mood)
                                : [...currentP.preferredMoods, m.mood];
                              updateCurrent({ preferredMoods: next });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isFav
                                ? 'bg-fire-amber text-black shadow-md'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {m.emoji} {m.mood}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Preferred Genres */}
                  <div>
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-neon-cyan" />
                      Preferred Genres
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {GENRES_LIST.map((genre) => {
                        const isFav = currentP.preferredGenres.includes(genre);
                        return (
                          <button
                            key={genre}
                            onClick={() => {
                              playFeedbackSound('move');
                              const next = isFav
                                ? currentP.preferredGenres.filter((g) => g !== genre)
                                : [...currentP.preferredGenres, genre];
                              updateCurrent({ preferredGenres: next });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              isFav
                                ? 'bg-cyan-500 text-black font-bold'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {genre}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Mandatory Age Rating Restriction */}
                  <div>
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Mandatory Age Ceiling
                    </label>
                    <div className="flex gap-1.5">
                      {(['G', 'PG', 'PG-13', 'R'] as AgeRating[]).map((rating) => (
                        <button
                          key={rating}
                          onClick={() => {
                            playFeedbackSound('move');
                            updateCurrent({ maxAgeRating: rating });
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            currentP.maxAgeRating === rating
                              ? 'bg-emerald-500 text-black shadow-md'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Strict rule: Any movie above this ceiling will be barred from ranking for the entire group.
                    </p>
                  </div>

                  {/* 4. Maximum Runtime */}
                  <div>
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      Target Runtime Ceiling
                    </label>
                    <div className="flex gap-1.5">
                      {[
                        { label: '90m', val: 95 },
                        { label: '110m', val: 115 },
                        { label: '130m', val: 135 },
                        { label: 'No Limit', val: 240 },
                      ].map((t) => (
                        <button
                          key={t.label}
                          onClick={() => {
                            playFeedbackSound('move');
                            updateCurrent({ maxRuntimeMinutes: t.val });
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            currentP.maxRuntimeMinutes === t.val
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Language Preference */}
                  <div>
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-amber-400" />
                      Audio Language
                    </label>
                    <div className="flex gap-2">
                      {['English', 'Spanish', 'French', 'Any'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            playFeedbackSound('move');
                            updateCurrent({ preferredLanguage: lang });
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                            currentP.preferredLanguage === lang
                              ? 'bg-amber-500 text-black shadow-md'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 6. Content Restrictions */}
                  <div>
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-300 block mb-2 flex items-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-rose-400" />
                      Mandatory Content Restrictions
                    </label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!currentP.contentRestrictions.avoidViolence}
                          onChange={(e) =>
                            updateCurrent({
                              contentRestrictions: {
                                ...currentP.contentRestrictions,
                                avoidViolence: e.target.checked,
                              },
                            })
                          }
                          className="rounded text-rose-500"
                        />
                        <span>Strict No Violence / Combat</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!currentP.contentRestrictions.avoidStrongLanguage}
                          onChange={(e) =>
                            updateCurrent({
                              contentRestrictions: {
                                ...currentP.contentRestrictions,
                                avoidStrongLanguage: e.target.checked,
                              },
                            })
                          }
                          className="rounded text-rose-500"
                        />
                        <span>Strict No Strong Language</span>
                      </label>
                    </div>
                  </div>

                </div>

                {/* Switch to next player or finish */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    disabled={editingParticipantIndex === 0}
                    onClick={() => {
                      playFeedbackSound('move');
                      setEditingParticipantIndex((prev) => Math.max(0, prev - 1));
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40"
                  >
                    ← Previous Player
                  </button>

                  {editingParticipantIndex < participants.length - 1 ? (
                    <button
                      onClick={() => {
                        playFeedbackSound('select');
                        setEditingParticipantIndex((prev) => prev + 1);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-fire-amber text-black text-xs font-bold shadow-md hover:brightness-110"
                    >
                      Next: Configure Player {editingParticipantIndex + 2} →
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        playFeedbackSound('select');
                        setSessionStep('restrictions_audit');
                      }}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-fire-amber to-fire-orange text-black font-extrabold text-sm shadow-xl shadow-fire-amber/30 hover:brightness-110"
                    >
                      Review Mandatory Safety Audit & Candidates →
                    </button>
                  )}
                </div>

              </div>
            );
          })()}

        </div>
      )}

      {/* ================= STEP 3: MANDATORY CONTENT RESTRICTIONS AUDIT ================= */}
      {sessionStep === 'restrictions_audit' && (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-fire-amber block mb-1">
              STEP 3 OF 5 • MANDATORY SAFETY AUDIT
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              Pre-Voting Content Verification
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              CineMind applies mandatory content restrictions before ranking. Any movie violating any participant's age ceiling or content restriction is excluded.
            </p>
          </div>

          {filterAudit.survivingMovies.length === 0 ? (
            /* ZERO MATCH EXPLANATION */
            <div className="p-8 rounded-3xl bg-rose-950/40 border-2 border-rose-500/60 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                No Suitable Match Found for Current Restrictions
              </h3>
              <p className="text-xs text-rose-200 max-w-md mx-auto">
                Every movie in the catalog violated at least one participant’s mandatory restriction.
              </p>

              {/* Audit Breakdown */}
              <div className="p-4 rounded-2xl bg-black/60 border border-rose-500/30 text-left max-h-48 overflow-y-auto no-scrollbar text-xs text-slate-300 space-y-2">
                <span className="font-bold text-rose-300 block mb-1">Exclusion Audit:</span>
                {filterAudit.rejectionReasons.slice(0, 6).map((r, i) => (
                  <div key={i} className="border-b border-slate-800 pb-1">
                    <span className="font-bold text-white">{r.movieTitle}: </span>
                    <span className="text-slate-400">{r.reason}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSessionStep('participant_config')}
                className="px-8 py-3 rounded-2xl bg-fire-amber text-black font-bold text-xs uppercase tracking-wider hover:brightness-110"
              >
                Adjust Participant Restrictions
              </button>
            </div>
          ) : (
            /* SUCCESS AUDIT CARD */
            <div className="p-6 rounded-3xl bg-cinematic-900 border border-slate-800 space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-300 block">
                    ✓ Mandatory Safety Check Passed: {filterAudit.survivingMovies.length} Titles Qualified
                  </span>
                  <span className="text-slate-300">
                    All candidates meet every participant's mandatory age rating and content limits.
                    ({filterAudit.rejectedCount} titles excluded for safety).
                  </span>
                </div>
              </div>

              {/* Sample Surviving Candidate Carousel */}
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 mb-3">
                  Qualified Candidate Titles for Tonight's Vote:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {filterAudit.survivingMovies.slice(0, 6).map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-left"
                    >
                      <span className="text-xs font-bold text-white block line-clamp-1">{m.title}</span>
                      <span className="text-[10px] text-slate-400">{m.ageRating} • {m.runtimeMinutes}m</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setSessionStep('participant_config')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  ← Back to Profiles
                </button>

                <button
                  ref={auditBtn.ref as any}
                  onClick={handleProceedToVoting}
                  className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-xl tv-focusable ${
                    auditBtn.isFocused
                      ? 'bg-fire-amber text-black ring-4 ring-fire-amber scale-105 shadow-fire-amber/40'
                      : 'bg-white text-black hover:bg-slate-200'
                  }`}
                >
                  <Vote className="w-4 h-4" />
                  <span>Start Remote Voting Session</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= STEP 4: REMOTE-FRIENDLY VOTING ARENA ================= */}
      {sessionStep === 'voting_arena' && candidateMovies[currentVotingIndex] && (() => {
        const currentMovie = candidateMovies[currentVotingIndex];
        const roundVotes = votes[currentMovie.id] || {};

        return (
          <div className="space-y-6 animate-fade-in">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
              <span>Candidate {currentVotingIndex + 1} of {candidateMovies.length}</span>
              <div className="flex gap-1.5">
                {candidateMovies.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentVotingIndex
                        ? 'w-8 bg-fire-amber'
                        : i < currentVotingIndex
                        ? 'w-4 bg-emerald-500'
                        : 'w-4 bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Voting Stage Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-8 rounded-3xl bg-cinematic-900 border border-slate-800 shadow-2xl">
              
              {/* Left Poster Column */}
              <div className="lg:col-span-4 relative rounded-2xl overflow-hidden aspect-[2/3] max-h-[460px] shadow-2xl">
                <MovieImage
                  src={currentMovie.posterUrl}
                  alt={currentMovie.title}
                  title={currentMovie.title}
                  year={currentMovie.year}
                  genre={currentMovie.genres[0]}
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

              {/* Right Voting Controls Column */}
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
                    <span className="text-xs text-amber-400 font-bold">
                      ★ {currentMovie.rating.toFixed(1)} IMDb
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
                </div>

                {/* Per-Participant Voting Matrix */}
                <div className="my-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                      Cast Votes for Each Family Member:
                    </h4>
                    {/* Couch Speed Unanimous Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickUnanimousVote('love')}
                        className="text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60"
                      >
                        💚 All Love
                      </button>
                      <button
                        onClick={() => handleQuickUnanimousVote('neutral')}
                        className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                      >
                        😐 All Neutral
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {participants.map((p) => {
                      const userVote = roundVotes[p.id] || 'neutral';

                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2.5 px-4 rounded-xl bg-slate-800/60 border border-slate-700/60"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{p.avatar}</span>
                            <div>
                              <span className="text-xs font-bold text-white block leading-tight">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Max: {p.maxAgeRating} • {p.maxRuntimeMinutes}m
                              </span>
                            </div>
                          </div>

                          {/* Remote-friendly vote options: Love, Like, Neutral, Dislike, Veto */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCastVote(p.id, 'love')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                userVote === 'love'
                                  ? 'bg-emerald-500 text-black shadow-md ring-2 ring-emerald-400 scale-105'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              }`}
                              title="Love it (+1.0)"
                            >
                              💚 Love
                            </button>

                            <button
                              onClick={() => handleCastVote(p.id, 'like')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                userVote === 'like'
                                  ? 'bg-cyan-500 text-black shadow-md ring-2 ring-cyan-400 scale-105'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              }`}
                              title="Like (+0.5)"
                            >
                              👍 Like
                            </button>

                            <button
                              onClick={() => handleCastVote(p.id, 'neutral')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                userVote === 'neutral'
                                  ? 'bg-white text-black shadow-md ring-2 ring-white scale-105'
                                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                              }`}
                              title="Neutral (0.0)"
                            >
                              😐 Neutral
                            </button>

                            <button
                              onClick={() => handleCastVote(p.id, 'dislike')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                userVote === 'dislike'
                                  ? 'bg-amber-500 text-black shadow-md ring-2 ring-amber-400 scale-105'
                                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                              }`}
                              title="Dislike (-0.75)"
                            >
                              👎 Pass
                            </button>

                            <button
                              onClick={() => handleCastVote(p.id, 'veto')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                userVote === 'veto'
                                  ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400 scale-105'
                                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                              }`}
                              title="Veto / Strict Skip (-1.5)"
                            >
                              🚫 Veto
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Bar: Next Candidate Button */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setSessionStep('restrictions_audit')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Adjust Restrictions
                  </button>

                  <button
                    ref={nextVoteBtn.ref as any}
                    onClick={handleNextMovie}
                    className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg tv-focusable ${
                      nextVoteBtn.isFocused
                        ? 'bg-fire-amber text-black ring-4 ring-fire-amber scale-105 shadow-fire-amber/40'
                        : 'bg-white text-black hover:bg-slate-200'
                    }`}
                  >
                    <span>
                      {currentVotingIndex < candidateMovies.length - 1
                        ? 'Next Candidate Title'
                        : 'Calculate & Reveal Top 3 Matches! 🏆'}
                    </span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= STEP 5: TOP 3 RECOMMENDATIONS & FINAL SELECTION ================= */}
      {sessionStep === 'results' && rankedResults.length > 0 && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Header Banner & Normalized Score Disclaimer */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-cinematic-900 to-amber-950/40 border border-fire-amber/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-fire-amber font-display font-extrabold text-sm uppercase tracking-widest mb-1">
                <Trophy className="w-5 h-5 text-fire-amber animate-bounce" />
                <span>Family Vote Consensus Results</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-white">
                Tonight's Top 3 Recommendations
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Ranked using our transparent multi-tier algorithm.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  dataSource === 'supabase'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                    : 'bg-purple-950 text-purple-300 border border-purple-700/60'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dataSource === 'supabase' ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400'}`} />
                  {dataSource === 'supabase' ? 'Supabase Cloud Sync Active' : 'Local Algorithmic Consensus Engine (Demo)'}
                </span>
              </div>
            </div>

            {/* Disclaimer Pill */}
            <div className="p-3 rounded-2xl bg-black/60 border border-slate-700 max-w-sm text-[11px] text-slate-300 leading-tight">
              <span className="text-fire-amber font-bold block mb-0.5">ℹ️ Score Metric:</span>
              Normalized compatibility score (0–100) measures preference compatibility across genres, moods, runtimes, and votes — not a guarantee that every participant will enjoy the movie.
            </div>
          </div>

          {/* AI Consensus Insights Card */}
          {aiWinnerExplanation && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/40 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI Consensus Insights: {aiWinnerExplanation.headline}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/20">
                  <span className="font-bold text-slate-300 block mb-1">🍿 Spoiler-Free Vibe Check:</span>
                  <p className="text-slate-300 leading-relaxed">{aiWinnerExplanation.vibeCheck}</p>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/20">
                  <span className="font-bold text-slate-300 block mb-1">🛡️ Parental & Group Guidance:</span>
                  <p className="text-slate-300 leading-relaxed">{aiWinnerExplanation.parentalGuidance}</p>
                </div>
              </div>
            </div>
          )}

          {/* Final Choice Confirmation Box if selected */}
          {finalSelectedMovie && (
            <div className="p-6 rounded-3xl bg-emerald-950/40 border-2 border-emerald-500 text-center space-y-2 animate-bounce-subtle">
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 block">
                GROUP CHOICE CONFIRMED
              </span>
              <h3 className="text-2xl font-black font-display text-white">
                "{finalSelectedMovie.title}" is Tonight's Feature!
              </h3>
              <p className="text-xs text-emerald-200">
                {(isSavedToWatchlist || watchlistIds.includes(finalSelectedMovie.id)) 
                  ? '✓ Saved to Shared Family Watchlist.' 
                  : 'Ready for playback on Fire TV.'}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => onSelectMovie(finalSelectedMovie)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs shadow-lg hover:brightness-110"
                >
                  Play Now on Fire TV
                </button>
              </div>
            </div>
          )}

          {/* The Top 3 Recommendations Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {rankedResults.slice(0, 3).map((rec) => {
              const rankColor = rec.rank === 1 ? 'border-fire-amber' : rec.rank === 2 ? 'border-slate-400' : 'border-amber-700';
              const rankBadge = rec.rank === 1 ? 'bg-fire-amber text-black' : rec.rank === 2 ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white';

              return (
                <div
                  key={rec.movie.id}
                  className={`p-6 rounded-3xl bg-cinematic-900 border-2 ${rankColor} shadow-2xl flex flex-col justify-between space-y-5`}
                >
                  <div>
                    {/* Rank Badge & Compatibility Score */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${rankBadge}`}>
                        #{rec.rank} Choice
                      </span>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-semibold">Group Compatibility</span>
                        <span className="text-2xl font-black text-fire-amber font-display">
                          {rec.compatibilityScore}%
                        </span>
                      </div>
                    </div>

                    {/* Movie Poster & Metadata */}
                    <div className="relative rounded-2xl overflow-hidden aspect-video mb-3 shadow-lg">
                      <MovieImage
                        src={rec.movie.backdropUrl}
                        alt={rec.movie.title}
                        title={rec.movie.title}
                        year={rec.movie.year}
                        genre={rec.movie.genres[0]}
                        aspectRatio="backdrop"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                        {rec.movie.ageRating} • {rec.movie.runtimeMinutes}m
                      </div>
                    </div>

                    <h3 className="text-xl font-bold font-display text-white mb-1">
                      {rec.movie.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                      {rec.movie.synopsis}
                    </p>

                    {/* Shared Interests */}
                    <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 mb-3 text-xs space-y-1">
                      <span className="font-bold text-emerald-400 block text-[11px] uppercase tracking-wider">
                        ✓ Shared Group Overlap:
                      </span>
                      {rec.sharedInterests.map((si, i) => (
                        <p key={i} className="text-slate-200 text-[11px] leading-tight">
                          • {si}
                        </p>
                      ))}
                    </div>

                    {/* Compromises Made */}
                    <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-xs space-y-1">
                      <span className="font-bold text-amber-400 block text-[11px] uppercase tracking-wider">
                        ⚖️ Compromises Made:
                      </span>
                      {rec.compromisesMade.map((cm, i) => (
                        <p key={i} className="text-slate-300 text-[11px] leading-tight">
                          • {cm}
                        </p>
                      ))}
                    </div>

                    {/* Per-Participant Breakdown */}
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                        Individual Satisfaction Breakdown:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {rec.participantBreakdowns.map((pb) => (
                          <div
                            key={pb.participantId}
                            className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-[11px]"
                          >
                            <span className="text-slate-300 flex items-center gap-1">
                              <span>{pb.avatar}</span>
                              <span className="font-semibold">{pb.participantName}</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-400">
                              {pb.satisfactionScore}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this Recommendation */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleChooseFinalMovie(rec.movie)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-fire-amber to-fire-orange text-black font-extrabold text-xs tracking-wide shadow-lg hover:brightness-110 transition-all"
                    >
                      {watchlistIds.includes(rec.movie.id) ? "✓ In Watchlist • Pick Feature" : "Choose as Tonight's Movie"}
                    </button>

                    <button
                      onClick={() => onSelectMovie(rec.movie)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                    >
                      View Full Parental Safety & Cast
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reset / New Session */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start New Family Vote Session</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
