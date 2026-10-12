import type { Movie, GenreType, MoodType, AgeRating } from '../types';
import type { 
  TMDBMovieSummary, 
  TMDBMovieDetails, 
  TMDBApiStatus, 
  TMDBPaginatedResponse 
} from '../types/tmdb';
import { MOVIES_DATABASE } from '../data/moviesData';

// TMDB Genre ID to canonical CineMind AI GenreType mapping
export const TMDB_TO_GENRE_MAP: Record<number, GenreType> = {
  28: 'Action',
  12: 'Action',          // Adventure
  16: 'Animation',
  35: 'Comedy',
  80: 'Thriller',        // Crime
  99: 'Drama',           // Documentary
  18: 'Drama',
  10751: 'Family',
  14: 'Science Fiction', // Fantasy
  36: 'Drama',           // History
  27: 'Thriller',        // Horror
  10402: 'Comedy',       // Music
  9648: 'Thriller',      // Mystery
  10749: 'Drama',        // Romance
  878: 'Science Fiction',
  10770: 'Drama',        // TV Movie
  53: 'Thriller',
  10752: 'Drama',        // War
  37: 'Action',          // Western
};

export const GENRE_TO_TMDB_ID: Record<GenreType, number> = {
  'Action': 28,
  'Comedy': 35,
  'Drama': 18,
  'Thriller': 53,
  'Animation': 16,
  'Science Fiction': 878,
  'Family': 10751,
};

// Global in-memory cache and registry
const movieRegistry = new Map<string, Movie>();

// Seed registry with initial sample database
MOVIES_DATABASE.forEach((m) => {
  movieRegistry.set(m.id, m);
});

// Cache for API responses to avoid repeated requests and handle rate limits
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

let apiStatus: TMDBApiStatus = {
  mode: 'sample',
  isConnected: true,
  isRateLimited: false,
  hasApiKey: false,
  lastChecked: new Date().toISOString(),
};

/**
 * Infer mood categories dynamically from genre and tone profile
 */
export function inferMoodsFromGenres(genres: GenreType[], rating: number): MoodType[] {
  const moods = new Set<MoodType>();

  if (genres.includes('Family') || genres.includes('Animation')) {
    moods.add('Happy');
    moods.add('Relaxed');
  }
  if (genres.includes('Comedy')) {
    moods.add('Happy');
  }
  if (genres.includes('Action') || genres.includes('Thriller')) {
    moods.add('Excited');
    moods.add('Adventurous');
  }
  if (genres.includes('Science Fiction')) {
    moods.add('Curious');
    moods.add('Adventurous');
  }
  if (genres.includes('Drama')) {
    moods.add('Curious');
    if (rating >= 7.8) moods.add('Relaxed');
  }

  if (moods.size === 0) {
    moods.add('Curious');
    moods.add('Relaxed');
  }

  return Array.from(moods);
}

/**
 * Normalize TMDB Movie item into canonical CineMind Movie model
 */
export function normalizeTMDBMovie(
  item: TMDBMovieSummary | TMDBMovieDetails,
  details?: TMDBMovieDetails
): Movie {
  const full = details || (item as TMDBMovieDetails);
  const tmdbId = item.id;
  const canonicalId = `tmdb-${tmdbId}`;

  // 1. Genres mapping
  const mappedGenres: GenreType[] = [];
  if ('genres' in full && Array.isArray(full.genres)) {
    full.genres.forEach((g) => {
      const canonical = TMDB_TO_GENRE_MAP[g.id];
      if (canonical && !mappedGenres.includes(canonical)) {
        mappedGenres.push(canonical);
      }
    });
  } else if (item.genre_ids) {
    item.genre_ids.forEach((id) => {
      const canonical = TMDB_TO_GENRE_MAP[id];
      if (canonical && !mappedGenres.includes(canonical)) {
        mappedGenres.push(canonical);
      }
    });
  }
  if (mappedGenres.length === 0) mappedGenres.push('Drama');

  // 2. Year parsing
  let year = 2024;
  if (item.release_date && item.release_date.includes('-')) {
    const parsed = parseInt(item.release_date.split('-')[0], 10);
    if (!isNaN(parsed) && parsed > 1900) year = parsed;
  }

  // 3. Rating & Runtime
  const rating = item.vote_average ? Math.round(item.vote_average * 10) / 10 : 7.0;
  const runtimeMinutes = full.runtime && full.runtime > 0 ? full.runtime : 115;

  // 4. Age Rating & US Certification extraction
  let ageRating: AgeRating = 'Unrated';
  let certificationStatus: 'verified' | 'unverified' = 'unverified';
  let certificationNote = '';

  if (full.release_dates && full.release_dates.results) {
    const usEntry = full.release_dates.results.find((r) => r.iso_3166_1 === 'US');
    if (usEntry && usEntry.release_dates.length > 0) {
      const certEntry = usEntry.release_dates.find((d) => d.certification && d.certification.trim().length > 0);
      if (certEntry) {
        const cert = certEntry.certification.trim().toUpperCase();
        if (cert === 'G' || cert === 'PG' || cert === 'PG-13' || cert === 'R' || cert === 'TV-14' || cert === 'TV-MA') {
          ageRating = cert;
          certificationStatus = 'verified';
          certificationNote = certEntry.note || `Official US MPAA Rating: ${cert}`;
        }
      }
    }
  }

  // Default age fallback based on genre if certification not provided by TMDB
  if (ageRating === 'Unrated') {
    if (mappedGenres.includes('Family') || mappedGenres.includes('Animation')) {
      ageRating = 'PG';
    } else {
      ageRating = 'PG-13';
    }
  }

  // 5. Cast and Director
  const cast: string[] = [];
  let director = '';
  if (full.credits) {
    if (Array.isArray(full.credits.cast)) {
      full.credits.cast.slice(0, 5).forEach((c) => {
        if (c.name) cast.push(c.name);
      });
    }
    if (Array.isArray(full.credits.crew)) {
      const dirEntry = full.credits.crew.find((c) => c.job === 'Director');
      if (dirEntry) director = dirEntry.name;
    }
  }
  if (cast.length === 0) cast.push('Ensemble Cast');
  if (!director) director = 'Director unlisted';

  // 6. Streaming Providers extraction (JustWatch via TMDB)
  let streamingProvider: string | undefined = undefined;
  let isVerifiedStreaming = false;
  let verifiedStreamingDestination = 'Streaming availability unverified for current region';
  const verifiedWatchProviders: Array<{ providerName: string; logoUrl?: string; type: 'flatrate' | 'rent' | 'buy' }> = [];

  const providersObj = full['watch/providers'];
  if (providersObj && providersObj.results && providersObj.results.US) {
    const usProviders = providersObj.results.US;
    if (usProviders.flatrate && usProviders.flatrate.length > 0) {
      isVerifiedStreaming = true;
      usProviders.flatrate.forEach((p) => {
        verifiedWatchProviders.push({
          providerName: p.provider_name,
          logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : undefined,
          type: 'flatrate',
        });
      });

      const prime = usProviders.flatrate.find((p) => 
        p.provider_name.toLowerCase().includes('prime') || 
        p.provider_name.toLowerCase().includes('amazon')
      );

      if (prime) {
        streamingProvider = 'Prime Video';
        verifiedStreamingDestination = 'Prime Video (Verified JustWatch Catalog)';
      } else {
        streamingProvider = usProviders.flatrate[0].provider_name;
        verifiedStreamingDestination = `${usProviders.flatrate[0].provider_name} (Verified JustWatch Catalog)`;
      }
    }
  }

  // 7. Poster & Backdrop CDN URLs
  const posterUrl = item.poster_path 
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
    : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80';
    
  const backdropUrl = item.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` 
    : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=85';

  // 8. Dynamic AI match insights
  const matchScore = Math.min(99, Math.max(70, Math.round(rating * 10 + 3)));
  const moods = inferMoodsFromGenres(mappedGenres, rating);

  const movie: Movie = {
    id: canonicalId,
    title: item.title,
    tagline: full.tagline || (item.overview ? item.overview.slice(0, 60) + '...' : ''),
    synopsis: item.overview || 'Overview unavailable from metadata provider.',
    year,
    runtimeMinutes,
    rating,
    ageRating,
    genres: mappedGenres,
    moods,
    posterUrl,
    backdropUrl,
    cast,
    director,
    streamingProvider: streamingProvider as any,
    isVerifiedStreaming,
    verifiedStreamingDestination,
    verifiedWatchProviders: verifiedWatchProviders.length > 0 ? verifiedWatchProviders : undefined,
    familySafety: {
      violence: certificationNote || (mappedGenres.includes('Action') || mappedGenres.includes('Thriller') ? 'Stylized action scenes and suspense.' : 'Low violence; suitable for broad audiences.'),
      language: ageRating === 'R' || ageRating === 'TV-MA' ? 'Strong language and mature dialogue.' : 'Mild to moderate dialogue.',
      themes: item.overview ? 'Themes of ' + mappedGenres.join(', ').toLowerCase() + '.' : 'Universal storytelling themes.',
      ageAppropriateVerdict: certificationStatus === 'verified' 
        ? `Officially certified ${ageRating} by US Ratings Board.` 
        : `Unverified rating. Estimated as ${ageRating} based on genre profile.`
    },
    isVerifiedEditorial: false,
    certificationStatus,
    aiInsights: {
      headline: `Highly acclaimed ${mappedGenres[0]} discovery with a ${rating}/10 viewer rating.`,
      matchScore,
      fitReasons: [
        `High audience reception (${rating}/10 on TMDB)`,
        `Combines ${mappedGenres.slice(0, 2).join(' & ')} elements`,
        `Optimized for ${moods[0]} entertainment`
      ],
      toneScores: {
        humor: mappedGenres.includes('Comedy') ? 85 : mappedGenres.includes('Family') ? 60 : 25,
        thrill: mappedGenres.includes('Action') || mappedGenres.includes('Thriller') ? 90 : 35,
        emotional: mappedGenres.includes('Drama') ? 85 : 55,
        pacing: mappedGenres.includes('Action') ? 88 : 70
      },
      bestFor: mappedGenres.includes('Family') ? 'Family movie night' : `${mappedGenres[0]} movie night`,
      spoilerFreeVibeCheck: item.overview ? item.overview.slice(0, 100) + '...' : 'Compelling cinematic experience.'
    },
    originalLanguage: item.original_language,
    voteCount: item.vote_count,
    isFromTMDB: true,
    trending: item.popularity > 50,
    familyFavorite: mappedGenres.includes('Family') && rating >= 7.5
  };

  // Register in global registry
  movieRegistry.set(canonicalId, movie);
  movieRegistry.set(String(tmdbId), movie);

  return movie;
}

/**
 * Fetch from proxy or fallback
 */
async function fetchFromTMDB<T>(subpath: string): Promise<{ data: T | null; error?: string; rateLimited?: boolean }> {
  const cacheKey = subpath;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { data: cached.data as T };
  }

  try {
    const res = await fetch(`/api/tmdb${subpath}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (res.status === 429) {
      apiStatus = {
        ...apiStatus,
        isRateLimited: true,
        mode: 'sample',
        lastChecked: new Date().toISOString(),
        lastError: 'HTTP 429: TMDB Rate Limit Exceeded'
      };
      return { data: null, rateLimited: true, error: 'RATE_LIMIT' };
    }

    const json = await res.json();

    if (json.fallback || json.error) {
      apiStatus = {
        ...apiStatus,
        mode: 'sample',
        hasApiKey: false,
        lastChecked: new Date().toISOString(),
        lastError: json.message
      };
      return { data: null, error: json.error || 'FALLBACK' };
    }

    apiStatus = {
      ...apiStatus,
      mode: 'tmdb',
      hasApiKey: true,
      isConnected: true,
      isRateLimited: false,
      lastChecked: new Date().toISOString(),
      lastError: undefined
    };

    cache.set(cacheKey, { data: json, timestamp: Date.now() });
    return { data: json as T };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    apiStatus = {
      ...apiStatus,
      mode: 'sample',
      isConnected: false,
      lastChecked: new Date().toISOString(),
      lastError: msg
    };
    return { data: null, error: msg };
  }
}

/**
 * Public TMDB Movie Service
 */
export const tmdbMovieService = {
  /**
   * Get current API connectivity and provider mode
   */
  async getStatus(): Promise<TMDBApiStatus> {
    try {
      const res = await fetch('/api/tmdb/status');
      if (res.ok) {
        const json = await res.json();
        apiStatus = {
          ...apiStatus,
          mode: json.mode || 'sample',
          hasApiKey: json.hasApiKey || false,
          isConnected: true,
          lastChecked: new Date().toISOString()
        };
      }
    } catch {
      apiStatus.mode = 'sample';
      apiStatus.isConnected = false;
    }
    return apiStatus;
  },

  /**
   * Fetch Trending Movies of the week
   */
  async getTrendingMovies(): Promise<Movie[]> {
    const { data } = await fetchFromTMDB<TMDBPaginatedResponse<TMDBMovieSummary>>(
      '/trending/movie/week?language=en-US'
    );

    if (data && data.results && data.results.length > 0) {
      return data.results.map((item) => normalizeTMDBMovie(item));
    }

    // Resilient Fallback to Sample Database
    return MOVIES_DATABASE.filter((m) => m.trending || m.featured);
  },

  /**
   * Fetch Popular Movies
   */
  async getPopularMovies(): Promise<Movie[]> {
    const { data } = await fetchFromTMDB<TMDBPaginatedResponse<TMDBMovieSummary>>(
      '/movie/popular?language=en-US&page=1'
    );

    if (data && data.results && data.results.length > 0) {
      return data.results.map((item) => normalizeTMDBMovie(item));
    }

    // Resilient Fallback to Sample Database
    return MOVIES_DATABASE.filter((m) => m.rating >= 8.0);
  },

  /**
   * Fetch Family Picks (Animation & Family)
   */
  async getFamilyPicks(): Promise<Movie[]> {
    const { data } = await fetchFromTMDB<TMDBPaginatedResponse<TMDBMovieSummary>>(
      '/discover/movie?with_genres=10751&sort_by=popularity.desc&page=1'
    );

    if (data && data.results && data.results.length > 0) {
      return data.results.map((item) => normalizeTMDBMovie(item));
    }

    return MOVIES_DATABASE.filter((m) => m.familyFavorite || ['G', 'PG'].includes(m.ageRating));
  },

  /**
   * Search Movies by title, with optional language and genre filtering
   */
  async searchMovies(
    query: string,
    options?: {
      language?: string;
      genre?: GenreType | 'All';
      page?: number;
    }
  ): Promise<{ movies: Movie[]; isRateLimited?: boolean; error?: string }> {
    const trimmed = query.trim();

    if (!trimmed && !options?.genre) {
      return { movies: MOVIES_DATABASE.slice(0, 10) };
    }

    // If searching by title
    if (trimmed) {
      let url = `/search/movie?query=${encodeURIComponent(trimmed)}&include_adult=false&language=en-US&page=${options?.page || 1}`;
      if (options?.language && options.language !== 'all') {
        url += `&with_original_language=${encodeURIComponent(options.language)}`;
      }

      const { data, rateLimited, error } = await fetchFromTMDB<TMDBPaginatedResponse<TMDBMovieSummary>>(url);

      if (data && data.results && data.results.length > 0) {
        let results = data.results.map((item) => normalizeTMDBMovie(item));

        if (options?.genre && options.genre !== 'All') {
          results = results.filter((m) => m.genres.includes(options.genre as GenreType));
        }

        return { movies: results };
      }

      if (rateLimited) {
        // Fallback to local filtering
        const localMatches = MOVIES_DATABASE.filter((m) => 
          m.title.toLowerCase().includes(trimmed.toLowerCase()) ||
          m.synopsis.toLowerCase().includes(trimmed.toLowerCase())
        );
        return { movies: localMatches, isRateLimited: true };
      }

      if (error && error !== 'FALLBACK') {
        const localMatches = MOVIES_DATABASE.filter((m) => 
          m.title.toLowerCase().includes(trimmed.toLowerCase())
        );
        return { movies: localMatches, error };
      }
    }

    // Fallback search over local sample database
    const localFiltered = MOVIES_DATABASE.filter((movie) => {
      if (trimmed) {
        const q = trimmed.toLowerCase();
        const matchesTitle = movie.title.toLowerCase().includes(q);
        const matchesSynopsis = movie.synopsis.toLowerCase().includes(q);
        const matchesCast = movie.cast.some((c) => c.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSynopsis && !matchesCast) return false;
      }
      if (options?.genre && options.genre !== 'All' && !movie.genres.includes(options.genre)) {
        return false;
      }
      return true;
    });

    return { movies: localFiltered };
  },

  /**
   * Fetch Movies by Genre and optional Language
   */
  async getMoviesByGenre(
    genre: GenreType,
    language?: string
  ): Promise<Movie[]> {
    const tmdbGenreId = GENRE_TO_TMDB_ID[genre];
    let url = `/discover/movie?with_genres=${tmdbGenreId}&sort_by=popularity.desc&page=1`;

    if (language && language !== 'all') {
      url += `&with_original_language=${encodeURIComponent(language)}`;
    }

    const { data } = await fetchFromTMDB<TMDBPaginatedResponse<TMDBMovieSummary>>(url);

    if (data && data.results && data.results.length > 0) {
      return data.results.map((item) => normalizeTMDBMovie(item));
    }

    // Local fallback
    return MOVIES_DATABASE.filter((m) => m.genres.includes(genre));
  },

  /**
   * Fetch Full Movie Details including cast, directors, release dates, and watch providers
   */
  async getMovieDetails(id: string): Promise<Movie | null> {
    // Check in-memory registry first
    const registered = movieRegistry.get(id);
    const tmdbId = id.startsWith('tmdb-') ? id.replace('tmdb-', '') : id;

    if (!isNaN(Number(tmdbId))) {
      const url = `/movie/${tmdbId}?append_to_response=credits,release_dates,watch/providers,videos`;
      const { data } = await fetchFromTMDB<TMDBMovieDetails>(url);

      if (data) {
        return normalizeTMDBMovie(data, data);
      }
    }

    return registered || MOVIES_DATABASE.find((m) => m.id === id) || null;
  },

  /**
   * Look up any movie by ID from memory registry or local database
   */
  getRegisteredMovie(id: string): Movie | undefined {
    return movieRegistry.get(id) || MOVIES_DATABASE.find((m) => m.id === id);
  },

  /**
   * Register an external movie in the global lookup map
   */
  registerMovie(movie: Movie): void {
    movieRegistry.set(movie.id, movie);
  }
};
