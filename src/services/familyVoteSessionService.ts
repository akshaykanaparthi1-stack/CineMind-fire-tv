import type { FamilyVoteSession } from '../types/familyVote';
import { apiClient } from './apiClient';

const STORAGE_KEY = 'cinemind_family_vote_active_session';
const HISTORY_KEY = 'cinemind_family_vote_session_history';

/**
 * Modular Family Vote Session Service
 * Provides instant local cache + background FastAPI & Supabase synchronization.
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

    // Background sync to backend if online
    try {
      if (session.backendSessionId && session.votes) {
        const flatVotes: Array<{ movieId: string; participantId: string; voteType: any }> = [];
        Object.entries(session.votes).forEach(([movieId, pVotes]) => {
          Object.entries(pVotes).forEach(([pId, vType]) => {
            flatVotes.push({ movieId, participantId: pId, voteType: vType });
          });
        });
        if (flatVotes.length > 0) {
          apiClient.submitBatchVotes(session.backendSessionId, flatVotes).catch(() => {});
        }
      }
    } catch {
      // Graceful offline fallback
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
   * Finalize and archive a session to history (and sync winner to backend)
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

      // Sync winner to backend
      if (session.backendSessionId) {
        apiClient.selectWinner(session.backendSessionId, finalSelectedMovieId, true).catch(() => {});
      }
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
