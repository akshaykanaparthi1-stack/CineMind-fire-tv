export type MoodType = 'Happy' | 'Relaxed' | 'Excited' | 'Curious' | 'Romantic' | 'Adventurous';

export type GenreType = 
  | 'Action' 
  | 'Comedy' 
  | 'Drama' 
  | 'Thriller' 
  | 'Animation' 
  | 'Science Fiction' 
  | 'Family';

export type AgeRating = 'G' | 'PG' | 'PG-13' | 'TV-14' | 'R' | 'TV-MA';

export interface FamilySafetyNotes {
  violence: string;
  language: string;
  themes: string;
  ageAppropriateVerdict: string;
}

export interface AIMatchInsights {
  headline: string;
  matchScore: number; // 0-100
  fitReasons: string[];
  toneScores: {
    humor: number;     // 0-100
    thrill: number;    // 0-100
    emotional: number; // 0-100
    pacing: number;    // 0-100
  };
  bestFor: string;
  spoilerFreeVibeCheck: string;
}

export interface Movie {
  id: string;
  title: string;
  tagline: string;
  synopsis: string;
  year: number;
  runtimeMinutes: number;
  rating: number; // e.g. 8.7
  ageRating: AgeRating;
  genres: GenreType[];
  moods: MoodType[];
  posterUrl: string;
  backdropUrl: string;
  trailerVideoId?: string; // YouTube embed ID or video placeholder
  cast: string[];
  director: string;
  streamingProvider: 'Prime Video' | 'Freevee' | 'Paramount+' | 'Max' | 'MGM+';
  familySafety: FamilySafetyNotes;
  aiInsights: AIMatchInsights;
  featured?: boolean;
  trending?: boolean;
  familyFavorite?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: 'Parent' | 'Teen' | 'Kid';
  favoriteMoods: MoodType[];
  favoriteGenres: GenreType[];
  maxAgeRating: AgeRating;
  likes: string[]; // movie IDs
  dislikes: string[];
}

export interface FamilyVoteState {
  isActive: boolean;
  step: 'setup' | 'voting' | 'results';
  selectedProfileIds: string[];
  maxAgeRating: AgeRating;
  maxRuntimeMinutes: number; // e.g. 100, 120, 180
  targetMood?: MoodType | 'Any';
  candidateMovieIds: string[];
  currentIndex: number;
  // votes: { [movieId]: { [profileId]: 'love' | 'neutral' | 'skip' } }
  votes: Record<string, Record<string, 'love' | 'neutral' | 'skip'>>;
}

export interface WatchlistItem {
  movieId: string;
  addedByProfileId: string;
  addedAt: string;
  watched: boolean;
}

export type ActiveScreen = 'home' | 'moods' | 'family-vote' | 'watchlist' | 'search' | 'profiles';
