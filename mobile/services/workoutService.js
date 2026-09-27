import { api } from './api';

export const workoutService = {
  /**
   * Fetch paginated exercises list with optional filtering
   * @param {object} params { category, difficulty, muscle, search, page, limit }
   */
  async getExercises(params = {}) {
    return api.get('/exercises', params);
  },

  /**
   * Fetch single exercise by ID or slug
   */
  async getExercise(id) {
    return api.get(`/exercises/${id}`);
  },

  /**
   * Fetch structured fitness programs
   */
  async getPrograms(params = {}) {
    return api.get('/programs', params);
  },

  /**
   * Fetch program details with full week-by-week schedule
   */
  async getProgram(id) {
    return api.get(`/programs/${id}`);
  },

  /**
   * Start a workout session
   * @param {string} [programDayId] Optional program day ID
   */
  async startWorkout(programDayId = null) {
    return api.post('/workouts/start', programDayId ? { programDayId } : {});
  },

  /**
   * Log an exercise set during an active session
   */
  async logExercise(sessionId, exerciseData) {
    return api.post(`/workouts/${sessionId}/log-exercise`, exerciseData);
  },

  /**
   * Complete active workout session. Server awards +5 Reward Points.
   */
  async completeWorkout(sessionId) {
    return api.post(`/workouts/${sessionId}/complete`);
  },

  /**
   * Abandon an in-progress workout session
   */
  async abandonWorkout(sessionId) {
    return api.post(`/workouts/${sessionId}/abandon`);
  },

  /**
   * Fetch workout history
   */
  async getWorkoutHistory(params = {}) {
    return api.get('/workouts/history', params);
  },

  /**
   * Fetch aggregate workout stats (total sessions, calories burned, minutes, streak)
   */
  async getWorkoutStats() {
    return api.get('/workouts/stats');
  },
};
