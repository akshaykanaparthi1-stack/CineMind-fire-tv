import type { FamilyVoteSession } from '../types/familyVote';

const STORAGE_KEY = 'cinemind_family_vote_active_session';
const HISTORY_KEY = 'cinemind_family_vote_session_history';

/**
 * Modular Family Vote Session Service
 * Provides decoupled state persistence ready to be connected to Supabase or FastAPI.
 */
export class FamilyVoteSessionService {
  /**
   * Save or update an in-progress voting session
   */
  static async saveSession(session: FamilyVoteSession): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // LocalStorage quota or private mode fallback
    }
  }

  /**
   * Retrieve active session, if any exists
   */
  static async loadCurrentSession(): Promise<FamilyVoteSession | null> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as FamilyVoteSession;
    } catch {
      return null;
    }
  }

  /**
   * Clear active session upon reset
   */
  static async clearSession(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  /**
   * Finalize and archive a session to history (and prepare for Supabase insert)
   */
  static async finalizeSession(session: FamilyVoteSession, finalSelectedMovieId: string): Promise<void> {
    try {
      const finalized: FamilyVoteSession = {
        ...session,
        status: 'final_selected',
        finalSelectedMovieId,
      };

      // Update current
      await this.saveSession(finalized);

      // Append to historical sessions
      const existingHistoryJson = localStorage.getItem(HISTORY_KEY);
      const history: FamilyVoteSession[] = existingHistoryJson ? JSON.parse(existingHistoryJson) : [];
      const updatedHistory = [finalized, ...history.filter(s => s.id !== finalized.id)].slice(0, 10);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch {
      // Ignore
    }
  }

  /**
   * Retrieve past completed family vote sessions
   */
  static async getSessionHistory(): Promise<FamilyVoteSession[]> {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
