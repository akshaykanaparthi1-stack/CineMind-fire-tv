import type { Movie, AgeRating } from '../types';
import type { 
  ParticipantPreference, 
  VoteType, 
  GroupRecommendationResult, 
  ParticipantScoreBreakdown,
  FilterAuditResult 
} from '../types/familyVote';

// Age rating rank mapping: strict numeric order
export const AGE_RATING_SEVERITY: Record<AgeRating, number> = {
  'G': 1,
  'PG': 2,
  'PG-13': 3,
  'TV-14': 3,
  'R': 4,
  'TV-MA': 4,
  'Unrated': 3,
  'NR': 3,
};

/**
 * Mandatory Content & Age Restriction Filter
 * Eliminates any movie that violates ANY participant's required age ceiling or content restrictions.
 */
export function filterMoviesByMandatoryRestrictions(
  movies: Movie[],
  participants: ParticipantPreference[]
): FilterAuditResult {
  const rejections: FilterAuditResult['rejectionReasons'] = [];

  const survivingMovies = movies.filter((movie) => {
    const movieSeverity = AGE_RATING_SEVERITY[movie.ageRating] || 3;

    for (const p of participants) {
      const allowedSeverity = AGE_RATING_SEVERITY[p.maxAgeRating] || 4;

      // 1. Mandatory Age Rating Check
      if (movieSeverity > allowedSeverity) {
        rejections.push({
          movieId: movie.id,
          movieTitle: movie.title,
          violatingParticipantNames: [p.name],
          reason: `Exceeds ${p.name}'s maximum allowed rating (${p.maxAgeRating}) with ${movie.ageRating}`,
        });
        return false;
      }

      // 2. Mandatory Content Restrictions Check
      if (p.contentRestrictions.avoidViolence) {
        const vText = movie.familySafety?.violence?.toLowerCase() || '';
        if (movie.ageRating === 'R' || movie.ageRating === 'TV-MA' || vText.includes('gore') || vText.includes('combat') || vText.includes('war')) {
          rejections.push({
            movieId: movie.id,
            movieTitle: movie.title,
            violatingParticipantNames: [p.name],
            reason: `Violates ${p.name}'s restriction: Avoid Violence (${movie.familySafety?.violence || 'High age-rating content'})`,
          });
          return false;
        }
      }

      if (p.contentRestrictions.avoidStrongLanguage) {
        const langText = movie.familySafety?.language?.toLowerCase() || '';
        if (movie.ageRating === 'R' || movie.ageRating === 'TV-MA' || langText.includes('coarse') || langText.includes('strong') || langText.includes('profanity')) {
          rejections.push({
            movieId: movie.id,
            movieTitle: movie.title,
            violatingParticipantNames: [p.name],
            reason: `Violates ${p.name}'s restriction: Avoid Strong Language (${movie.familySafety?.language || 'High age-rating language'})`,
          });
          return false;
        }
      }

      if (p.contentRestrictions.avoidSensitiveThemes) {
        const themeText = movie.familySafety?.themes?.toLowerCase() || '';
        if (themeText.includes('extinction') || themeText.includes('death') || themeText.includes('fanaticism')) {
          rejections.push({
            movieId: movie.id,
            movieTitle: movie.title,
            violatingParticipantNames: [p.name],
            reason: `Violates ${p.name}'s restriction: Avoid Sensitive Themes (${movie.familySafety?.themes || 'Mature themes'})`,
          });
          return false;
        }
      }
    }

    return true;
  });

  return {
    survivingMovies,
    rejectedCount: rejections.length,
    rejectionReasons: rejections,
  };
}

/**
 * Score a single participant against a candidate movie
 */
export function calculateParticipantScore(
  participant: ParticipantPreference,
  movie: Movie,
  voteCast: VoteType | null
): ParticipantScoreBreakdown {
  // 1. Vote Weight (0 to 1)
  let voteWeight = 0.5; // neutral default if missing
  if (voteCast === 'love') voteWeight = 1.0;
  else if (voteCast === 'like') voteWeight = 0.75;
  else if (voteCast === 'neutral') voteWeight = 0.5;
  else if (voteCast === 'dislike') voteWeight = 0.2;
  else if (voteCast === 'veto') voteWeight = 0.0;

  // 2. Genre Overlap
  const genreOverlap = movie.genres.filter((g) => participant.preferredGenres.includes(g));
  let genreWeight = 0.4;
  if (participant.preferredGenres.length === 0) {
    genreWeight = 0.6; // No strict genre preference
  } else if (genreOverlap.length >= 2) {
    genreWeight = 1.0;
  } else if (genreOverlap.length === 1) {
    genreWeight = 0.8;
  } else {
    genreWeight = 0.25;
  }

  // 3. Mood Overlap
  const moodOverlap = movie.moods.filter((m) => participant.preferredMoods.includes(m));
  let moodWeight = 0.4;
  if (participant.preferredMoods.length === 0) {
    moodWeight = 0.6;
  } else if (moodOverlap.length >= 2) {
    moodWeight = 1.0;
  } else if (moodOverlap.length === 1) {
    moodWeight = 0.8;
  } else {
    moodWeight = 0.3;
  }

  // 4. Runtime Compliance
  const maxRuntime = participant.maxRuntimeMinutes || 180;
  let runtimeWeight = 1.0;
  let runtimeDiff = 0;
  if (movie.runtimeMinutes <= maxRuntime) {
    runtimeWeight = 1.0;
    runtimeDiff = 0;
  } else {
    runtimeDiff = movie.runtimeMinutes - maxRuntime;
    // Penalty decays smoothly: 10m over -> ~0.85, 30m over -> ~0.5, 60m+ over -> 0.15
    runtimeWeight = Math.max(0.15, 1.0 - (runtimeDiff / 45) * 0.75);
  }

  // 5. Language Fit (Default movie sample data is English)
  const prefLang = participant.preferredLanguage || 'Any';
  const languageMatched = prefLang === 'Any' || prefLang === 'English';
  const languageWeight = languageMatched ? 1.0 : 0.6;

  // Composite raw satisfaction (0.0 to 1.0)
  // Weights: Vote (35%), Genre (25%), Mood (15%), Runtime (15%), Language (10%)
  const rawSatisfaction = 
    0.35 * voteWeight +
    0.25 * genreWeight +
    0.15 * moodWeight +
    0.15 * runtimeWeight +
    0.10 * languageWeight;

  const satisfactionScore = Math.min(100, Math.max(0, Math.round(rawSatisfaction * 100)));

  return {
    participantId: participant.id,
    participantName: participant.name,
    avatar: participant.avatar,
    satisfactionScore,
    voteCast,
    genreOverlap,
    moodOverlap,
    runtimeCompliant: movie.runtimeMinutes <= maxRuntime,
    runtimeDifference: runtimeDiff,
    languageMatched,
  };
}

/**
 * Transparent Family Recommendation Engine
 * Calculates normalized 0-100 compatibility scores with deterministic ranking,
 * shared interests, and compromise explanations.
 */
export function rankMoviesForFamilyGroup(
  survivingMovies: Movie[],
  participants: ParticipantPreference[],
  votes: Record<string, Record<string, VoteType>> // [movieId][participantId]
): GroupRecommendationResult[] {
  if (survivingMovies.length === 0 || participants.length === 0) {
    return [];
  }

  const results: GroupRecommendationResult[] = survivingMovies.map((movie) => {
    const movieVotes = votes[movie.id] || {};
    let totalSatisfaction = 0;
    let vetoCount = 0;
    let loveCount = 0;

    const participantBreakdowns: ParticipantScoreBreakdown[] = participants.map((p) => {
      const voteCast = movieVotes[p.id] || null;
      if (voteCast === 'veto') vetoCount++;
      if (voteCast === 'love') loveCount++;

      const breakdown = calculateParticipantScore(p, movie, voteCast);
      totalSatisfaction += breakdown.satisfactionScore;
      return breakdown;
    });

    // Base compatibility score is average satisfaction
    let baseScore = totalSatisfaction / participants.length;

    // Heavy penalty for vetos (avoids forcing a hated movie on someone)
    if (vetoCount > 0) {
      baseScore = Math.max(10, baseScore - vetoCount * 22);
    }

    // Cohesion bonus for unanimous/multi-love
    if (loveCount >= participants.length) {
      baseScore = Math.min(100, baseScore + 6);
    } else if (loveCount >= Math.ceil(participants.length / 2)) {
      baseScore = Math.min(100, baseScore + 3);
    }

    const compatibilityScore = Math.min(100, Math.max(10, Math.round(baseScore)));

    // Extract shared interests across participants for this movie
    const sharedInterests: string[] = [];
    const commonGenres = movie.genres.filter((g) => {
      const interestedCount = participants.filter((p) => p.preferredGenres.includes(g)).length;
      return interestedCount >= Math.ceil(participants.length / 2);
    });
    if (commonGenres.length > 0) {
      sharedInterests.push(`Shared Genre Interest: ${commonGenres.join(', ')}`);
    }

    const commonMoods = movie.moods.filter((m) => {
      const interestedCount = participants.filter((p) => p.preferredMoods.includes(m)).length;
      return interestedCount >= Math.ceil(participants.length / 2);
    });
    if (commonMoods.length > 0) {
      sharedInterests.push(`Shared Vibe: ${commonMoods.join(', ')}`);
    }

    if (movie.runtimeMinutes <= Math.min(...participants.map((p) => p.maxRuntimeMinutes || 180))) {
      sharedInterests.push(`Ideal Runtime: ${movie.runtimeMinutes}m fits everyone’s bedtime schedule`);
    }

    // Extract compromises made
    const compromisesMade: string[] = [];
    participantBreakdowns.forEach((pb) => {
      if (pb.runtimeDifference > 0) {
        compromisesMade.push(
          `${pb.participantName} preferred ≤ ${movie.runtimeMinutes - pb.runtimeDifference}m, but approved ${movie.runtimeMinutes}m (+${pb.runtimeDifference}m)`
        );
      }
      if (pb.genreOverlap.length === 0 && participants.find((p) => p.id === pb.participantId)?.preferredGenres.length! > 0) {
        compromisesMade.push(
          `${pb.participantName}'s preferred genres were swapped for group-harmony ${movie.genres[0]}`
        );
      }
      if (pb.voteCast === 'dislike') {
        compromisesMade.push(`${pb.participantName} rated it neutral/dislike but agreed to group pick`);
      }
    });

    if (sharedInterests.length === 0) {
      sharedInterests.push(`Cross-genre bridge: combines ${movie.genres.join(' & ')} to bridge diverse tastes`);
    }
    if (compromisesMade.length === 0) {
      compromisesMade.push('Zero compromises required: Unanimously aligned across all preferences');
    }

    // Generate human-readable explanation
    const explanation = `Matched ${compatibilityScore}% compatibility across ${participants.length} family members. ${movie.aiInsights.headline}`;

    return {
      movie,
      rank: 0, // Assigned after sorting
      compatibilityScore,
      sharedInterests,
      compromisesMade,
      participantBreakdowns,
      vetoCount,
      loveCount,
      explanation,
      compatibilityDisclaimer:
        'This score measures group preference compatibility across genres, moods, runtimes, and votes — not a guarantee that every participant will enjoy the movie.',
    };
  });

  // Deterministic multi-tier tie breaking:
  // 1. Highest Compatibility Score
  // 2. Fewest Vetoes
  // 3. Most Love Votes
  // 4. Stricter Runtime Fit
  // 5. Higher IMDb Baseline Rating
  results.sort((a, b) => {
    if (b.compatibilityScore !== a.compatibilityScore) {
      return b.compatibilityScore - a.compatibilityScore;
    }
    if (a.vetoCount !== b.vetoCount) {
      return a.vetoCount - b.vetoCount; // Fewest vetoes first
    }
    if (b.loveCount !== a.loveCount) {
      return b.loveCount - a.loveCount; // Most loves first
    }
    if (a.movie.runtimeMinutes !== b.movie.runtimeMinutes) {
      return a.movie.runtimeMinutes - b.movie.runtimeMinutes; // Shorter first
    }
    return b.movie.rating - a.movie.rating; // Higher IMDb score
  });

  // Assign ranks 1..N
  results.forEach((item, index) => {
    item.rank = index + 1;
  });

  return results;
}
