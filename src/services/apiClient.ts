/**
 * CineMind - Backend Typed API Client
 * Seamlessly connects React Fire TV frontend to FastAPI & Supabase
 * with transparent fallback to local demo mode when offline.
 */

import type { Movie, UserProfile, WatchlistItem } from '../types';
import type { 
  ParticipantPreference, 
  VoteType, 
  GroupRecommendationResult 
} from '../types/familyVote';

export interface BackendHealthStatus {
  online: boolean;
  supabaseConnected: boolean;
  source: 'supabase' | 'demo' | 'offline';
  version?: string;
  environment?: string;
}

export interface BackendResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  source: 'supabase' | 'demo';
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || (import.meta.env.PROD ? '' : 'http://localhost:8000');
const DEFAULT_TIMEOUT_MS = 6000;

class ApiClient {
  private baseUrl: string;
  private cachedHealth: BackendHealthStatus | null = null;
  private lastHealthCheckTime = 0;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Helper to execute fetch with timeout
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    timeoutMs: number = DEFAULT_TIMEOUT_MS
  ): Promise<BackendResponse<T> | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(options.headers || {}),
        },
      });

      clearTimeout(timer);

      if (!response.ok) {
        return null;
      }

      const json = await response.json();
      return json as BackendResponse<T>;
    } catch {
      clearTimeout(timer);
      return null;
    }
  }

  /**
   * Probe Backend & Database connectivity status
   */
  async checkHealth(force = false): Promise<BackendHealthStatus> {
    const now = Date.now();
    if (!force && this.cachedHealth && now - this.lastHealthCheckTime < 10000) {
      return this.cachedHealth;
    }

    try {
      const res = await this.request<{
        status: string;
        environment: string;
        version: string;
        supabase_connected: boolean;
      }>('/api/v1/health');

      if (res && res.success && res.data) {
        this.cachedHealth = {
          online: true,
          supabaseConnected: res.data.supabase_connected,
          source: res.source || (res.data.supabase_connected ? 'supabase' : 'demo'),
          version: res.data.version,
          environment: res.data.environment,
        };
      } else {
        this.cachedHealth = {
          online: false,
          supabaseConnected: false,
          source: 'offline',
        };
      }
    } catch {
      this.cachedHealth = {
        online: false,
        supabaseConnected: false,
        source: 'offline',
      };
    }

    this.lastHealthCheckTime = now;
    return this.cachedHealth;
  }

  // ==========================================
  // Profiles & Preferences
  // ==========================================

  async getProfiles(): Promise<UserProfile[] | null> {
    const res = await this.request<UserProfile[]>('/api/v1/profiles');
    return res?.success ? res.data : null;
  }

  async updatePreferences(
    profileId: string, 
    preferences: Partial<UserProfile>
  ): Promise<boolean> {
    const res = await this.request<any>(`/api/v1/preferences/${profileId}`, {
      method: 'PUT',
      body: JSON.stringify({
        favorite_genres: preferences.favoriteGenres,
        favorite_moods: preferences.favoriteMoods,
        max_age_rating: preferences.maxAgeRating,
      }),
    });
    return !!res?.success;
  }

  // ==========================================
  // Watchlist Sync
  // ==========================================

  async getWatchlist(profileId?: string): Promise<WatchlistItem[] | null> {
    const q = profileId ? `?profile_id=${encodeURIComponent(profileId)}` : '';
    const res = await this.request<Array<{
      id: string;
      movie_id: string;
      profile_id?: string;
      is_family_shared: boolean;
      watched: boolean;
      notes?: string;
      created_at: string;
    }>>(`/api/v1/watchlist${q}`);

    if (res?.success && Array.isArray(res.data)) {
      return res.data.map((item) => ({
        movieId: item.movie_id,
        addedByProfileId: item.profile_id || 'dad',
        addedAt: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        watched: item.watched,
      }));
    }
    return null;
  }

  async addToWatchlist(
    movieId: string, 
    profileId: string, 
    movie?: Movie
  ): Promise<boolean> {
    const res = await this.request<any>('/api/v1/watchlist', {
      method: 'POST',
      body: JSON.stringify({
        movie_id: movieId,
        profile_id: profileId,
        is_family_shared: true,
        movie_snapshot: movie ? {
          title: movie.title,
          year: movie.year,
          rating: movie.rating,
          ageRating: movie.ageRating,
          genres: movie.genres,
        } : undefined,
      }),
    });
    return !!res?.success;
  }

  async removeFromWatchlist(movieId: string): Promise<boolean> {
    const res = await this.request<any>(`/api/v1/watchlist/${movieId}`, {
      method: 'DELETE',
    });
    return !!res?.success;
  }

  async toggleWatched(movieId: string, watched: boolean): Promise<boolean> {
    const res = await this.request<any>(`/api/v1/watchlist/${movieId}/watched?watched=${watched}`, {
      method: 'PATCH',
    });
    return !!res?.success;
  }

  // ==========================================
  // AI Explanations & Recommendations
  // ==========================================

  async getAiExplanation(
    movie: Movie, 
    participants?: ParticipantPreference[]
  ): Promise<{
    headline: string;
    spoilerFreeVibeCheck: string;
    parentalGuidance: string;
    tailoredReasons: string[];
    source: string;
  } | null> {
    const res = await this.request<{
      headline: string;
      spoiler_free_vibe_check: string;
      parental_guidance: string;
      tailored_reasons: string[];
    }>('/api/v1/recommendations/explain', {
      method: 'POST',
      body: JSON.stringify({
        movie: {
          id: movie.id,
          title: movie.title,
          tagline: movie.tagline,
          synopsis: movie.synopsis,
          year: movie.year,
          runtimeMinutes: movie.runtimeMinutes,
          rating: movie.rating,
          ageRating: movie.ageRating,
          genres: movie.genres,
          moods: movie.moods,
          posterUrl: movie.posterUrl,
          backdropUrl: movie.backdropUrl,
          cast: movie.cast,
          director: movie.director,
          familySafetyNotes: movie.familySafety,
        },
        participants: participants?.map((p) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          color: p.color,
          isTemporary: p.isTemporary,
          preferredMoods: p.preferredMoods,
          preferredGenres: p.preferredGenres,
          preferredLanguage: p.preferredLanguage,
          maxRuntimeMinutes: p.maxRuntimeMinutes,
          maxAgeRating: p.maxAgeRating,
          contentRestrictions: p.contentRestrictions,
        })),
      }),
    });

    if (res?.success && res.data) {
      return {
        headline: res.data.headline,
        spoilerFreeVibeCheck: res.data.spoiler_free_vibe_check,
        parentalGuidance: res.data.parental_guidance,
        tailoredReasons: res.data.tailored_reasons,
        source: res.source,
      };
    }
    return null;
  }

  // ==========================================
  // Family Vote Session Lifecycle
  // ==========================================

  async createSession(
    hostProfileId: string, 
    participantCount: number, 
    title?: string
  ): Promise<{ sessionId: string; source: string } | null> {
    const res = await this.request<{ id: string }>('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify({
        host_profile_id: hostProfileId,
        participant_count: participantCount,
        title: title || `Movie Night (${participantCount} Players)`,
      }),
    });

    if (res?.success && res.data) {
      return { sessionId: res.data.id, source: res.source };
    }
    return null;
  }

  async registerParticipants(
    sessionId: string, 
    participants: ParticipantPreference[]
  ): Promise<boolean> {
    for (const p of participants) {
      await this.request(`/api/v1/sessions/${sessionId}/participants`, {
        method: 'POST',
        body: JSON.stringify({
          name: p.name,
          avatar: p.avatar,
          color: p.color,
          is_temporary: !!p.isTemporary,
          profile_id: !p.isTemporary ? p.id : undefined,
          preferred_moods: p.preferredMoods,
          preferred_genres: p.preferredGenres,
          preferred_language: p.preferredLanguage,
          max_runtime_minutes: p.maxRuntimeMinutes,
          max_age_rating: p.maxAgeRating,
          content_restrictions: p.contentRestrictions,
        }),
      });
    }
    return true;
  }

  async submitBatchVotes(
    sessionId: string,
    votes: Array<{
      movieId: string;
      participantId: string;
      voteType: VoteType;
    }>
  ): Promise<boolean> {
    const res = await this.request(`/api/v1/sessions/${sessionId}/votes/batch`, {
      method: 'POST',
      body: JSON.stringify({
        votes: votes.map((v) => ({
          session_id: sessionId,
          movie_id: v.movieId,
          participant_id: v.participantId,
          vote_type: v.voteType,
        })),
      }),
    });
    return !!res?.success;
  }

  async calculateSessionResults(
    sessionId: string,
    candidateMovies: Movie[]
  ): Promise<{ results: GroupRecommendationResult[]; source: string } | null> {
    const res = await this.request<any[]>(`/api/v1/sessions/${sessionId}/calculate-results`, {
      method: 'POST',
      body: JSON.stringify({
        candidate_movies: candidateMovies.map((m) => ({
          id: m.id,
          title: m.title,
          tagline: m.tagline,
          synopsis: m.synopsis,
          year: m.year,
          runtimeMinutes: m.runtimeMinutes,
          rating: m.rating,
          ageRating: m.ageRating,
          genres: m.genres,
          moods: m.moods,
          posterUrl: m.posterUrl,
          backdropUrl: m.backdropUrl,
          cast: m.cast,
          director: m.director,
          familySafetyNotes: m.familySafety,
          aiInsights: m.aiInsights,
        })),
      }),
    });

    if (res?.success && Array.isArray(res.data)) {
      const mapped: GroupRecommendationResult[] = res.data.map((item) => ({
        movie: item.movie,
        rank: item.rank,
        compatibilityScore: item.compatibility_score,
        sharedInterests: item.shared_interests,
        compromisesMade: item.compromises_made,
        participantBreakdowns: (item.participant_breakdowns || []).map((b: any) => ({
          participantId: b.participant_id,
          participantName: b.participant_name,
          avatar: b.avatar,
          satisfactionScore: b.satisfaction_score,
          voteCast: b.vote_cast,
          genreOverlap: b.genre_overlap || [],
          moodOverlap: b.mood_overlap || [],
          runtimeCompliant: b.runtime_compliant,
          runtimeDifference: b.runtime_difference || 0,
          languageMatched: b.language_matched,
        })),
        vetoCount: item.veto_count,
        loveCount: item.love_count,
        explanation: item.explanation,
        compatibilityDisclaimer: item.compatibility_disclaimer,
      }));

      return { results: mapped, source: res.source };
    }
    return null;
  }

  async selectWinner(
    sessionId: string,
    movieId: string,
    saveToWatchlist = true
  ): Promise<boolean> {
    const res = await this.request<any>(`/api/v1/sessions/${sessionId}/select-winner`, {
      method: 'POST',
      body: JSON.stringify({
        movie_id: movieId,
        save_to_watchlist: saveToWatchlist,
      }),
    });
    return !!res?.success;
  }

  // ==========================================
  // AI Recommendation Assistant Endpoints
  // ==========================================

  async assistantQuery(
    query: string,
    profileId?: string,
    sessionId?: string,
    limit = 6
  ): Promise<{
    parsedFilters: any;
    matchedMovies: Movie[];
    recommendationExplanation: string;
    providerUsed: string;
    hasSufficientContext: boolean;
    verifiedDatasetCount: number;
    restrictedCount: number;
  } | null> {
    const res = await this.request<any>('/api/v1/assistant/query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        profile_id: profileId,
        session_id: sessionId,
        limit,
      }),
    });

    if (res?.success && res.data) {
      return {
        parsedFilters: res.data.parsed_filters,
        matchedMovies: (res.data.matched_movies || []).map((m: any) => ({
          ...m,
          familySafety: m.familySafety,
          aiInsights: m.aiInsights || {
            headline: m.tagline || 'Recommended Movie',
            matchScore: Math.round(m.rating * 10),
            fitReasons: ['Matches your natural language criteria'],
            toneScores: { humor: 70, thrill: 70, emotional: 70, pacing: 70 },
            bestFor: 'Family discovery',
            spoilerFreeVibeCheck: m.synopsis ? m.synopsis.slice(0, 120) + '...' : 'A captivating cinematic watch.'
          }
        })),
        recommendationExplanation: res.data.recommendation_explanation,
        providerUsed: res.data.provider_used,
        hasSufficientContext: res.data.has_sufficient_context,
        verifiedDatasetCount: res.data.verified_dataset_count,
        restrictedCount: res.data.restricted_count || 0,
      };
    }
    return null;
  }

  async explainMatch(
    movieId: string,
    profileId: string,
    mood?: string
  ): Promise<any | null> {
    const q = new URLSearchParams({ movie_id: movieId, profile_id: profileId });
    if (mood) q.append('mood', mood);
    const res = await this.request<any>(`/api/v1/assistant/explain-match?${q.toString()}`, {
      method: 'POST',
    });
    return res?.success ? res.data : null;
  }

  async explainGroup(
    movieId: string,
    sessionId: string
  ): Promise<any | null> {
    const q = new URLSearchParams({ movie_id: movieId, session_id: sessionId });
    const res = await this.request<any>(`/api/v1/assistant/explain-group?${q.toString()}`, {
      method: 'POST',
    });
    return res?.success ? res.data : null;
  }

  async getAiProviderStatus(): Promise<{
    activeProvider: string;
    configuredMode: string;
    bedrockAvailable: boolean;
    openaiAvailable: boolean;
  } | null> {
    const res = await this.request<any>('/api/v1/assistant/provider-status');
    if (res?.success && res.data) {
      return {
        activeProvider: res.data.active_provider,
        configuredMode: res.data.configured_mode,
        bedrockAvailable: res.data.amazon_bedrock?.available || false,
        openaiAvailable: res.data.openai?.available || false,
      };
    }
    return null;
  }
}

export const apiClient = new ApiClient();

