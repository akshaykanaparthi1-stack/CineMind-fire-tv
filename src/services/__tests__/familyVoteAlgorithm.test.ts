import { describe, it, expect } from 'vitest';
import { 
  filterMoviesByMandatoryRestrictions, 
  calculateParticipantScore, 
  rankMoviesForFamilyGroup 
} from '../familyVoteAlgorithm';
import type { Movie } from '../../types';
import type { ParticipantPreference, VoteType } from '../../types/familyVote';

const MOCK_MOVIES: Movie[] = [
  {
    id: 'bear-movie',
    title: 'Paddington Bear 2',
    tagline: 'Warm family bear',
    synopsis: 'A wholesome adventure',
    year: 2017,
    runtimeMinutes: 100,
    rating: 8.2,
    ageRating: 'PG',
    genres: ['Family', 'Comedy'],
    moods: ['Happy', 'Relaxed'],
    posterUrl: 'https://example.com/p.jpg',
    backdropUrl: 'https://example.com/b.jpg',
    cast: ['Ben Whishaw'],
    director: 'Paul King',
    streamingProvider: 'Prime Video',
    familySafety: {
      violence: 'None. Comedic slapstick only.',
      language: 'Completely wholesome.',
      themes: 'Kindness and community.',
      ageAppropriateVerdict: 'Safe for all ages.'
    },
    aiInsights: {
      headline: 'Heartwarming masterpiece',
      matchScore: 99,
      fitReasons: ['Joyful humor'],
      toneScores: { humor: 90, thrill: 30, emotional: 85, pacing: 80 },
      bestFor: 'Family movie night',
      spoilerFreeVibeCheck: 'Cozy and sweet'
    }
  },
  {
    id: 'sci-fi-action',
    title: 'Interstellar Voyage',
    tagline: 'To the stars',
    synopsis: 'Epic cosmic space travel',
    year: 2014,
    runtimeMinutes: 160,
    rating: 8.7,
    ageRating: 'PG-13',
    genres: ['Science Fiction', 'Drama'],
    moods: ['Curious', 'Adventurous'],
    posterUrl: 'https://example.com/p2.jpg',
    backdropUrl: 'https://example.com/b2.jpg',
    cast: ['Matthew M'],
    director: 'Christopher Nolan',
    streamingProvider: 'Prime Video',
    familySafety: {
      violence: 'Tense space peril, cosmic combat hazards.',
      language: 'Brief PG-13 profanity.',
      themes: 'Extinction, space time sacrifice.',
      ageAppropriateVerdict: 'Teens and adults.'
    },
    aiInsights: {
      headline: 'A cosmic triumph',
      matchScore: 94,
      fitReasons: ['Mind bending science'],
      toneScores: { humor: 20, thrill: 85, emotional: 95, pacing: 75 },
      bestFor: 'Teens and adults',
      spoilerFreeVibeCheck: 'Mind expanding'
    }
  },
  {
    id: 'gritty-r-movie',
    title: 'Underworld Syndicate',
    tagline: 'No way out',
    synopsis: 'Gritty crime drama',
    year: 2021,
    runtimeMinutes: 110,
    rating: 7.5,
    ageRating: 'R',
    genres: ['Action', 'Thriller'],
    moods: ['Excited'],
    posterUrl: 'https://example.com/p3.jpg',
    backdropUrl: 'https://example.com/b3.jpg',
    cast: ['John Doe'],
    director: 'Jane Smith',
    streamingProvider: 'Max',
    familySafety: {
      violence: 'Intense shootouts and gore.',
      language: 'Coarse language and strong profanity.',
      themes: 'Revenge and crime.',
      ageAppropriateVerdict: 'Adults only.'
    },
    aiInsights: {
      headline: 'Action thrill ride',
      matchScore: 80,
      fitReasons: ['Non stop adrenaline'],
      toneScores: { humor: 10, thrill: 95, emotional: 40, pacing: 90 },
      bestFor: 'Late night action fans',
      spoilerFreeVibeCheck: 'Dark and intense'
    }
  }
];

describe('Family Vote Recommendation Algorithm', () => {

  // 1. Mandatory Restrictions
  describe('Mandatory Content & Age Restrictions', () => {
    it('strictly eliminates any movie exceeding a participant maximum age rating', () => {
      const participants: ParticipantPreference[] = [
        {
          id: 'dad',
          name: 'Dad',
          avatar: '👨',
          color: '#3b82f6',
          preferredMoods: ['Adventurous'],
          preferredGenres: ['Science Fiction'],
          preferredLanguage: 'English',
          maxRuntimeMinutes: 180,
          maxAgeRating: 'R',
          contentRestrictions: {}
        },
        {
          id: 'leo',
          name: 'Leo (Kid)',
          avatar: '👦',
          color: '#ff9900',
          preferredMoods: ['Happy'],
          preferredGenres: ['Family'],
          preferredLanguage: 'English',
          maxRuntimeMinutes: 100,
          maxAgeRating: 'PG', // MANDATORY CEILING: PG
          contentRestrictions: {}
        }
      ];

      const audit = filterMoviesByMandatoryRestrictions(MOCK_MOVIES, participants);

      // Only 'bear-movie' (PG) should survive. 'sci-fi-action' (PG-13) and 'gritty-r-movie' (R) must be eliminated!
      expect(audit.survivingMovies.length).toBe(1);
      expect(audit.survivingMovies[0].id).toBe('bear-movie');
      expect(audit.rejectedCount).toBe(2);

      const rRejection = audit.rejectionReasons.find(r => r.movieId === 'gritty-r-movie');
      expect(rRejection?.reason).toContain("Exceeds Leo (Kid)'s maximum allowed rating (PG) with R");
    });

    it('eliminates movies violating content restrictions like avoidViolence', () => {
      const participants: ParticipantPreference[] = [
        {
          id: 'mom',
          name: 'Mom',
          avatar: '👩',
          color: '#ec4899',
          preferredMoods: ['Relaxed'],
          preferredGenres: ['Family'],
          preferredLanguage: 'English',
          maxRuntimeMinutes: 120,
          maxAgeRating: 'R',
          contentRestrictions: {
            avoidViolence: true // Strictly avoid violence
          }
        }
      ];

      const audit = filterMoviesByMandatoryRestrictions(MOCK_MOVIES, participants);

      // 'gritty-r-movie' (gore/combat) and 'sci-fi-action' (combat) should be rejected
      const survivingIds = audit.survivingMovies.map(m => m.id);
      expect(survivingIds).toContain('bear-movie');
      expect(survivingIds).not.toContain('gritty-r-movie');
    });

    it('returns empty surviving list with transparent audit trail when no movie qualifies', () => {
      const participants: ParticipantPreference[] = [
        {
          id: 'strict-user',
          name: 'Strict User',
          avatar: '👤',
          color: '#10b981',
          preferredMoods: ['Happy'],
          preferredGenres: ['Animation'],
          preferredLanguage: 'English',
          maxRuntimeMinutes: 90,
          maxAgeRating: 'G', // None of MOCK_MOVIES are G rated
          contentRestrictions: {}
        }
      ];

      const audit = filterMoviesByMandatoryRestrictions(MOCK_MOVIES, participants);
      expect(audit.survivingMovies.length).toBe(0);
      expect(audit.rejectedCount).toBe(3);
    });
  });

  // 2. Individual Scoring & Missing Preferences
  describe('Individual Scoring & Missing Preferences Handling', () => {
    it('handles completely empty genres and moods gracefully without NaN', () => {
      const emptyParticipant: ParticipantPreference = {
        id: 'user-empty',
        name: 'Empty Preferences User',
        avatar: '👤',
        color: '#6366f1',
        preferredMoods: [],
        preferredGenres: [],
        preferredLanguage: 'Any',
        maxRuntimeMinutes: 120,
        maxAgeRating: 'PG-13',
        contentRestrictions: {}
      };

      const breakdown = calculateParticipantScore(emptyParticipant, MOCK_MOVIES[0], null);
      expect(breakdown.satisfactionScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.satisfactionScore).toBeLessThanOrEqual(100);
      expect(Number.isNaN(breakdown.satisfactionScore)).toBe(false);
    });

    it('awards highest satisfaction score when user votes love and preferences match', () => {
      const happyParticipant: ParticipantPreference = {
        id: 'happy-user',
        name: 'Happy User',
        avatar: '😄',
        color: '#f59e0b',
        preferredMoods: ['Happy', 'Relaxed'],
        preferredGenres: ['Family', 'Comedy'],
        preferredLanguage: 'English',
        maxRuntimeMinutes: 110,
        maxAgeRating: 'PG',
        contentRestrictions: {}
      };

      const breakdown = calculateParticipantScore(happyParticipant, MOCK_MOVIES[0], 'love');
      expect(breakdown.satisfactionScore).toBeGreaterThanOrEqual(95);
      expect(breakdown.voteCast).toBe('love');
      expect(breakdown.runtimeCompliant).toBe(true);
    });
  });

  // 3. Group Ranking & Deterministic Tie Breaking
  describe('Group Compatibility Ranking & Tie Breaking', () => {
    it('ranks movie with higher group consensus and love votes at Rank 1', () => {
      const participants: ParticipantPreference[] = [
        {
          id: 'p1',
          name: 'Participant 1',
          avatar: '👤',
          color: '#3b82f6',
          preferredMoods: ['Happy'],
          preferredGenres: ['Family'],
          preferredLanguage: 'English',
          maxRuntimeMinutes: 120,
          maxAgeRating: 'PG',
          contentRestrictions: {}
        },
        {
          id: 'p2',
          name: 'Participant 2',
          avatar: '👤',
          color: '#ec4899',
          preferredMoods: ['Happy'],
          preferredGenres: ['Comedy'],
          preferredLanguage: 'English',
          maxRuntimeMinutes: 120,
          maxAgeRating: 'PG',
          contentRestrictions: {}
        }
      ];

      const votes: Record<string, Record<string, VoteType>> = {
        'bear-movie': { p1: 'love', p2: 'love' }
      };

      const results = rankMoviesForFamilyGroup([MOCK_MOVIES[0]], participants, votes);
      expect(results.length).toBe(1);
      expect(results[0].rank).toBe(1);
      expect(results[0].compatibilityScore).toBeGreaterThanOrEqual(90);
      expect(results[0].sharedInterests.length).toBeGreaterThan(0);
      expect(results[0].compatibilityDisclaimer).toContain('preference compatibility');
    });

    it('breaks ties deterministically using fewest vetoes and runtime fit', () => {
      const movieA: Movie = {
        ...MOCK_MOVIES[0],
        id: 'movie-a',
        title: 'Movie A (Shorter 90m)',
        runtimeMinutes: 90,
        rating: 8.0,
      };

      const movieB: Movie = {
        ...MOCK_MOVIES[0],
        id: 'movie-b',
        title: 'Movie B (Longer 115m)',
        runtimeMinutes: 115,
        rating: 8.0,
      };

      const participants: ParticipantPreference[] = [
        {
          id: 'user1',
          name: 'User 1',
          avatar: '👤',
          color: '#fff',
          preferredMoods: ['Happy'],
          preferredGenres: ['Family'],
          preferredLanguage: 'English',
          maxRuntimeMinutes: 120,
          maxAgeRating: 'PG',
          contentRestrictions: {}
        }
      ];

      const votes = {
        'movie-a': { user1: 'like' as VoteType },
        'movie-b': { user1: 'like' as VoteType }
      };

      const ranked = rankMoviesForFamilyGroup([movieB, movieA], participants, votes);

      // movie-a is shorter and strictly complies with runtime, so it breaks the tie and wins rank 1
      expect(ranked[0].movie.id).toBe('movie-a');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].movie.id).toBe('movie-b');
      expect(ranked[1].rank).toBe(2);
    });
  });

});
