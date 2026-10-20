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
   * Fetch current active user program enrollment
   */
  async getCurrentProgram() {
    return api.get('/programs/me/current');
  },

  /**
   * Start a workout session
   * @param {object|string} [params] programDayId string or { programDayId, programId, title }
   */
  async startWorkout(params = {}) {
    const body = typeof params === 'string' ? { programDayId: params } : (params || {});
    return api.post('/workouts/start', body);
  },

  /**
   * Get single workout session with logged sets
   */
  async getWorkoutById(sessionId) {
    return api.get(`/workouts/${sessionId}`);
  },

  /**
   * Log an exercise set during an active session
   */
  async logExercise(sessionId, exerciseData) {
    return api.post(`/workouts/${sessionId}/log-exercise`, exerciseData);
  },

  /**
   * Complete active workout session. Server awards reward points and returns updated streak & points.
   */
  async completeWorkout(sessionId, data = {}) {
    return api.post(`/workouts/${sessionId}/complete`, data);
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

  /**
   * Fetch today's workout, active session, and enrolled program schedule
   */
  async getTodayWorkout() {
    return api.get('/workouts/today');
  },

  /**
   * Request presigned URL for workout proof photo upload
   */
  async getProofUploadUrl(sessionId, { fileName, mimeType, fileSize }) {
    return api.post(`/workouts/${sessionId}/proof-upload-url`, { fileName, mimeType, fileSize });
  },

  /**
   * Confirm proof upload after photo has been stored
   */
  async confirmProof(sessionId, photoKey) {
    return api.post(`/workouts/${sessionId}/proof/confirm`, { photoKey });
  },
};

/**
 * Normalizes backend /workouts/today response into a clean, predictable shape
 * Handles both the nested programDay shape and the direct workout shape seamlessly.
 */
export const normalizeTodayWorkout = (raw) => {
  if (!raw) return null;
  const data = raw.data !== undefined ? raw.data : raw;
  if (!data) return null;

  const isRest = Boolean(data.type === 'rest' || data.programDay?.restDay);

  const rawExercises =
    data.workout?.exercises ||
    data.programDay?.exercises ||
    [];

  const exercises = rawExercises.map((ex) => ({
    exerciseId: String(ex.exerciseId || ex._id || ex.id || ''),
    name: ex.name || 'Exercise',
    slug: ex.slug || '',
    sets: Number(ex.sets || ex.targetSets || 3),
    reps: String(ex.reps || ex.targetReps || '10-12'),
    restSec: Number(ex.restSec || ex.restSeconds || 60),
    videoUrl: ex.videoUrl || null,
    thumbnailUrl: ex.thumbnailUrl || null,
    instructions: Array.isArray(ex.instructions) ? ex.instructions : [],
    safetyNotes: Array.isArray(ex.safetyNotes) ? ex.safetyNotes : [],
    muscleGroups: Array.isArray(ex.muscleGroups) ? ex.muscleGroups : [],
    notes: ex.notes || '',
  }));

  const sessionStatus = data.session?.status || data.sessionStatus || 'not_started';
  const hasCompleted = Boolean(data.hasCompletedToday || sessionStatus === 'completed');

  return {
    dateKey: data.dateKey || new Date().toISOString().split('T')[0],
    type: isRest ? 'rest' : 'workout',
    isRest,
    workout: {
      id: data.workout?.id || data.programDay?.id || data.programDay?._id || null,
      title: data.workout?.title || data.programDay?.title || (isRest ? 'Rest Day' : 'Today\'s Workout'),
      estimatedMin: Number(data.workout?.estimatedMin || Math.max(20, exercises.length * 8)),
      programName: data.program?.name || null,
      level: data.program?.level || 'Beginner',
      exercises,
    },
    session: {
      id: data.session?.id || data.activeSession?._id || data.activeSession?.id || null,
      status: hasCompleted ? 'completed' : sessionStatus,
      durationSeconds: Number(data.activeSession?.durationSeconds || 0),
      proof: data.activeSession?.proof || null,
    },
    hasCompletedToday: hasCompleted,
  };
};

/**
 * Computes 7-day consistency dots (Monday to Sunday) using the server's dateKey
 * and user's completed sessions. Does NOT compute fake streaks or dates on client.
 */
export const getWeekConsistency = (serverDateKey, recentWorkouts = [], hasCompletedToday = false) => {
  const dateStr = serverDateKey || new Date().toISOString().split('T')[0];
  const parts = dateStr.split('-').map(Number);
  const year = parts[0] || 1970;
  const month = parts[1] || 1;
  const day = parts[2] || 1;

  const date = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = (date.getUTCDay() + 6) % 7; // Monday = 0, Sunday = 6
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - dayOfWeek);

  const daysMeta = [
    { label: 'M', name: 'Mon' },
    { label: 'T', name: 'Tue' },
    { label: 'W', name: 'Wed' },
    { label: 'T', name: 'Thu' },
    { label: 'F', name: 'Fri' },
    { label: 'S', name: 'Sat' },
    { label: 'S', name: 'Sun' },
  ];

  return daysMeta.map((item, index) => {
    const curDate = new Date(monday);
    curDate.setUTCDate(monday.getUTCDate() + index);
    const dayKey = curDate.toISOString().split('T')[0];

    const isMatchCompleted =
      (recentWorkouts || []).some(
        (w) => w.dateKey === dayKey && (w.status === 'COMPLETED' || w.status === 'completed')
      ) || (dayKey === dateStr && hasCompletedToday);

    return {
      label: item.label,
      name: item.name,
      dateKey: dayKey,
      isToday: dayKey === dateStr,
      isCompleted: Boolean(isMatchCompleted),
    };
  });
};
