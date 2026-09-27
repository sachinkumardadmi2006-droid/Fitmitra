import { api } from './api';

export const leaderboardService = {
  /**
   * Fetch top 50 ranked athletes by points and current user's rank
   */
  async getLeaderboard() {
    return api.get('/profiles/leaderboard');
  },
};
