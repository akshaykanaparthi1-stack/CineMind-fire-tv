import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  normalizeTMDBMovie, 
  inferMoodsFromGenres, 
  tmdbMovieService,
  TMDB_TO_GENRE_MAP 
} from '../tmdbService';
import type { TMDBMovieSummary, TMDBMovieDetails } from '../../types/tmdb';

describe('TMDB Integration & Service Layer', () => {

  const MOCK_TMDB_SUMMARY: TMDBMovieSummary = {
    id: 550,
    title: 'Fight Club',
    original_title: 'Fight Club',
    overview: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club.',
    release_date: '1999-10-15',
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    vote_average: 8.433,
    vote_count: 26280,
    genre_ids: [18, 53], // Drama, Thriller
    original_language: 'en',
    popularity: 88.5,
  };

  const MOCK_TMDB_DETAILS: TMDBMovieDetails = {
    ...MOCK_TMDB_SUMMARY,
    runtime: 139,
    tagline: 'Mischief. Mayhem. Soap.',
    status: 'Released',
    genres: [
      { id: 18, name: 'Drama' },
      { id: 53, name: 'Thriller' }
    ],
    credits: {
      cast: [
        { id: 819, name: 'Edward Norton', character: 'Narrator', profile_path: null, order: 0 },
        { id: 287, name: 'Brad Pitt', character: 'Tyler Durden', profile_path: null, order: 1 }
      ],
      crew: [
        { id: 7467, name: 'David Fincher', job: 'Director', department: 'Directing' }
      ]
    },
    release_dates: {
      results: [
        {
          iso_3166_1: 'US',
          release_dates: [
            {
              certification: 'R',
              iso_639_1: 'en',
              note: 'Rated R for strong violence, sexuality and language',
              release_date: '1999-10-15',
              type: 3
            }
          ]
        }
      ]
    },
    'watch/providers': {
      results: {
        US: {
          flatrate: [
            {
              provider_id: 9,
              provider_name: 'Amazon Prime Video',
              logo_path: '/emthp39XA2zhzgTvILbg2a2eG6q.jpg',
              display_priority: 1
            }
          ]
        }
      }
    }
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Normalization & Mapping
  describe('TMDB Movie Normalization', () => {
    it('normalizes TMDB summary into canonical CineMind Movie model', () => {
      const movie = normalizeTMDBMovie(MOCK_TMDB_SUMMARY);

      expect(movie.id).toBe('tmdb-550');
      expect(movie.title).toBe('Fight Club');
      expect(movie.year).toBe(1999);
      expect(movie.rating).toBe(8.4);
      expect(movie.isFromTMDB).toBe(true);
      expect(movie.posterUrl).toContain('https://image.tmdb.org/t/p/w500');
      expect(movie.backdropUrl).toContain('https://image.tmdb.org/t/p/w1280');
      expect(movie.genres).toContain('Drama');
      expect(movie.genres).toContain('Thriller');
    });

    it('extracts official US MPAA certification and marks it verified', () => {
      const movie = normalizeTMDBMovie(MOCK_TMDB_SUMMARY, MOCK_TMDB_DETAILS);

      expect(movie.ageRating).toBe('R');
      expect(movie.certificationStatus).toBe('verified');
      expect(movie.familySafety?.violence).toContain('Rated R for strong violence');
    });

    it('extracts verified watch providers and recognizes Prime Video', () => {
      const movie = normalizeTMDBMovie(MOCK_TMDB_SUMMARY, MOCK_TMDB_DETAILS);

      expect(movie.isVerifiedStreaming).toBe(true);
      expect(movie.streamingProvider).toBe('Prime Video');
      expect(movie.verifiedWatchProviders?.length).toBe(1);
      expect(movie.verifiedWatchProviders?.[0].providerName).toBe('Amazon Prime Video');
    });

    it('distinguishes unverified availability when no US flatrate providers exist', () => {
      const detailsNoStream: TMDBMovieDetails = {
        ...MOCK_TMDB_DETAILS,
        'watch/providers': { results: {} }
      };

      const movie = normalizeTMDBMovie(MOCK_TMDB_SUMMARY, detailsNoStream);
      expect(movie.isVerifiedStreaming).toBe(false);
      expect(movie.verifiedStreamingDestination).toContain('unverified');
    });
  });

  // 2. Mood Inference
  describe('Dynamic Mood Inference', () => {
    it('infers Happy and Relaxed for Animation and Family movies', () => {
      const moods = inferMoodsFromGenres(['Family', 'Animation'], 8.0);
      expect(moods).toContain('Happy');
      expect(moods).toContain('Relaxed');
    });

    it('infers Excited and Adventurous for Action and Thriller movies', () => {
      const moods = inferMoodsFromGenres(['Action', 'Thriller'], 7.8);
      expect(moods).toContain('Excited');
      expect(moods).toContain('Adventurous');
    });

    it('infers Curious for Science Fiction movies', () => {
      const moods = inferMoodsFromGenres(['Science Fiction'], 8.5);
      expect(moods).toContain('Curious');
    });
  });

  // 3. Resilient Fallbacks
  describe('Resilient Fallback Behavior', () => {
    it('falls back to bundled sample database when API key is missing or offline', async () => {
      // Mock fetch returning fallback indicator
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, fallback: true, mode: 'sample' }),
        status: 200
      });

      const trending = await tmdbMovieService.getTrendingMovies();
      expect(trending.length).toBeGreaterThan(0);
      // Sample database movies are returned
      expect(trending.some(m => m.id === 'spider-verse' || m.id === 'paddington-2')).toBe(true);
    });

    it('handles HTTP 429 rate limiting gracefully and switches to sample data', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ rateLimited: true, status: 429 })
      });

      const searchRes = await tmdbMovieService.searchMovies('Spider-Man');
      expect(searchRes.isRateLimited).toBe(true);
      expect(searchRes.movies.length).toBeGreaterThan(0);
    });
  });

  // 4. Registry & Watchlist Integration
  describe('Movie Registry & Watchlist Lookup', () => {
    it('registers normalized movies so they can be retrieved by ID across screens', () => {
      normalizeTMDBMovie(MOCK_TMDB_SUMMARY);
      const retrieved = tmdbMovieService.getRegisteredMovie('tmdb-550');
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('Fight Club');
    });

    it('returns sample movie if looked up by sample id', () => {
      const sample = tmdbMovieService.getRegisteredMovie('paddington-2');
      expect(sample).toBeDefined();
      expect(sample?.title).toContain('Paddington');
    });
  });

  // 5. Genre Mapping
  describe('Genre Map Completeness', () => {
    it('maps essential TMDB genre IDs to valid CineMind GenreTypes', () => {
      expect(TMDB_TO_GENRE_MAP[28]).toBe('Action');
      expect(TMDB_TO_GENRE_MAP[35]).toBe('Comedy');
      expect(TMDB_TO_GENRE_MAP[18]).toBe('Drama');
      expect(TMDB_TO_GENRE_MAP[53]).toBe('Thriller');
      expect(TMDB_TO_GENRE_MAP[16]).toBe('Animation');
      expect(TMDB_TO_GENRE_MAP[878]).toBe('Science Fiction');
      expect(TMDB_TO_GENRE_MAP[10751]).toBe('Family');
    });
  });

});
