export interface TMDBMovieSummary {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
  adult?: boolean;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface TMDBWatchProviderInfo {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface TMDBWatchProviderRegion {
  link?: string;
  flatrate?: TMDBWatchProviderInfo[];
  rent?: TMDBWatchProviderInfo[];
  buy?: TMDBWatchProviderInfo[];
  free?: TMDBWatchProviderInfo[];
  ads?: TMDBWatchProviderInfo[];
}

export interface TMDBReleaseDateItem {
  certification: string;
  iso_639_1: string;
  note?: string;
  release_date: string;
  type: number;
}

export interface TMDBReleaseDatesResult {
  iso_3166_1: string;
  release_dates: TMDBReleaseDateItem[];
}

export interface TMDBVideoItem {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
}

export interface TMDBMovieDetails extends TMDBMovieSummary {
  runtime: number | null;
  tagline: string;
  status: string;
  genres: TMDBGenre[];
  credits?: {
    cast: TMDBCastMember[];
    crew: TMDBCrewMember[];
  };
  release_dates?: {
    results: TMDBReleaseDatesResult[];
  };
  'watch/providers'?: {
    results: Record<string, TMDBWatchProviderRegion>;
  };
  videos?: {
    results: TMDBVideoItem[];
  };
}

export interface TMDBPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export type MetadataSourceMode = 'tmdb' | 'sample';

export interface TMDBApiStatus {
  mode: MetadataSourceMode;
  isConnected: boolean;
  isRateLimited: boolean;
  rateLimitResetSeconds?: number;
  hasApiKey: boolean;
  lastChecked: string;
  lastError?: string;
}
