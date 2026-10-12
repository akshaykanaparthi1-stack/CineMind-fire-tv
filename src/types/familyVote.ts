import type { Movie, MoodType, GenreType, AgeRating } from './index';

export type VoteType = 'love' | 'like' | 'neutral' | 'dislike' | 'veto';

export interface ContentRestrictions {
  avoidViolence?: boolean;
  avoidStrongLanguage?: boolean;
  avoidSensitiveThemes?: boolean;
}

export interface ParticipantPreference {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isTemporary?: boolean;
  preferredMoods: MoodType[];
  preferredGenres: GenreType[];
  preferredLanguage: string; // 'English' | 'Spanish' | 'French' | 'Korean' | 'Japanese' | 'Any'
  maxRuntimeMinutes: number; // 90, 105, 120, 150, 180
  maxAgeRating: AgeRating;   // 'G' | 'PG' | 'PG-13' | 'TV-14' | 'R'
  contentRestrictions: ContentRestrictions;
}

export interface ParticipantScoreBreakdown {
  participantId: string;
  participantName: string;
  avatar: string;
  satisfactionScore: number; // 0-100
  voteCast: VoteType | null;
  genreOverlap: GenreType[];
  moodOverlap: MoodType[];
  runtimeCompliant: boolean;
  runtimeDifference: number; // minutes over max, or 0
  languageMatched: boolean;
}

export interface GroupRecommendationResult {
  movie: Movie;
  rank: number;
  compatibilityScore: number; // 0-100 normalized
  sharedInterests: string[];
  compromisesMade: string[];
  participantBreakdowns: ParticipantScoreBreakdown[];
  vetoCount: number;
  loveCount: number;
  explanation: string;
  compatibilityDisclaimer: string;
}

export interface FilterAuditResult {
  survivingMovies: Movie[];
  rejectedCount: number;
  rejectionReasons: {
    movieId: string;
    movieTitle: string;
    violatingParticipantNames: string[];
    reason: string;
  }[];
}

export interface FamilyVoteSession {
  id: string;
  title: string;
  createdAt: string;
  hostName: string;
  participantCount: number; // 2 to 6
  participants: ParticipantPreference[];
  candidateMovieIds: string[];
  // votes: [movieId][participantId] => VoteType
  votes: Record<string, Record<string, VoteType>>;
  currentVotingMovieIndex: number;
  status: 'setup_count' | 'setup_profiles' | 'voting' | 'results' | 'final_selected';
  finalSelectedMovieId?: string;
}
