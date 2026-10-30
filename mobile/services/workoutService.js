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
   * Fetch program details by ID (alias)
   */
  async getProgramById(id) {
    return this.getProgram(id);
  },

  /**
   * Select a program / goal
   */
  async selectProgram(id) {
    return api.post(`/programs/${id}/select`);
  },

  /**
   * Fetch workout plans under a specific program
   * @param {string} programId
   * @param {object} [params]
   */
  async getWorkoutPlansByProgram(programId, params = {}) {
    return api.get(`/programs/${programId}/workoutplans`, params);
  },

  /**
   * Fetch structured workout plans list with optional filtering
   * @param {object} [params] { programId, difficulty, level, location, daysPerWeek, isPremium, search, page, limit }
   */
  async getWorkoutPlans(params = {}) {
    return api.get('/workout-plans', params);
  },

  /**
   * Fetch single workout plan details by ID
   */
  async getWorkoutPlan(id) {
    return api.get(`/workout-plans/${id}`);
  },

  /**
   * Fetch single workout plan details by ID (alias)
   */
  async getWorkoutPlanById(id) {
    return this.getWorkoutPlan(id);
  },

  /**
   * Select and activate a workout plan
   */
  async selectWorkoutPlan(id) {
    return api.post(`/workout-plans/${id}/select`);
  },

  /**
   * Fetch currently active workout plan for user
   */
  async getCurrentWorkoutPlan() {
    return api.get('/workout-plans/me/current');
  },

  /**
   * Switch active workout plan to a new plan
   * @param {string} newWorkoutPlanId
   */
  async switchWorkoutPlan(newWorkoutPlanId) {
    return api.post('/workout-plans/me/switch', { newWorkoutPlanId });
  },

  /**
   * Fetch current active user program enrollment
   * @returns {Promise<{ program: { id: string, title: string, goal: string, level: string, durationWeeks: number } | null, startDateKey: string, weekNumber: number, dayNumber: number }>}
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
   * Fetch workout calendar heatmap for a given month (YYYY-MM)
   * @param {string} month e.g. "2026-10"
   */
  async getWorkoutCalendar(month) {
    return api.get('/workouts/calendar', { month });
  },

  /**
   * Request presigned URL for workout proof photo upload
   * @param {string} sessionId
   * @param {object} payload { fileName: string, mimeType: 'image/jpeg'|'image/png'|'image/webp', fileSize?: number }
   */
  async getProofUploadUrl(sessionId, { fileName = 'proof.jpg', mimeType = 'image/jpeg', fileSize } = {}) {
    const payload = { fileName, mimeType };
    if (fileSize) payload.fileSize = fileSize;
    return api.post(`/workouts/${sessionId}/proof-upload-url`, payload);
  },

  /**
   * Helper to log an exercise set or full exercise completion
   * @param {string} sessionId
   * @param {string} exerciseId
   * @param {Array<{ setNumber?: number, reps?: number, weightKg?: number, durationSeconds?: number, completed?: boolean }>} [setsData]
   * @param {string} [notes]
   */
  async logExerciseCompletion(sessionId, exerciseId, setsData = [], notes = null) {
    const formattedSets = Array.isArray(setsData) && setsData.length > 0
      ? setsData.map((s, idx) => ({
          setNumber: s.setNumber || idx + 1,
          reps: Number(s.reps !== undefined ? s.reps : 10),
          weightKg: s.weightKg !== undefined ? s.weightKg : null,
          durationSeconds: s.durationSeconds !== undefined ? s.durationSeconds : null,
          completed: s.completed !== undefined ? Boolean(s.completed) : true,
        }))
      : [{ setNumber: 1, reps: 10, weightKg: null, durationSeconds: null, completed: true }];

    return this.logExercise(sessionId, {
      exerciseId: String(exerciseId),
      sets: formattedSets,
      notes: notes || undefined,
    });
  },

  /**
   * Ensures an active session exists.
   * Checks /workouts/today first; if active session exists and is in progress, returns it.
   * Otherwise calls /workouts/start to create and return a new session.
   * @param {object} [options] { programDayId, programId, title }
   */
  async ensureActiveSession(options = {}) {
    const todayRes = await this.getTodayWorkout();
    const normalized = normalizeTodayWorkout(todayRes);
    if (normalized?.session?.id && (normalized.session.status === 'in_progress' || normalized.session.status === 'started')) {
      return { sessionId: normalized.session.id, isNew: false, todayData: normalized };
    }
    const startPayload = {
      programDayId: options.programDayId || normalized?.programDay?.id || normalized?.workout?.id || undefined,
      programId: options.programId || normalized?.program?.id || undefined,
      title: options.title || normalized?.workout?.title || undefined,
    };
    const startRes = await this.startWorkout(startPayload);
    const sessionData = startRes?.data || startRes;
    const sessionId = sessionData?.session?._id || sessionData?._id || sessionData?.id || sessionData?.sessionId;
    return { sessionId: String(sessionId), isNew: true, todayData: normalized };
  },
};

/**
 * Normalizes backend /workouts/today response into a clean, predictable shape
 * Handles both the nested programDay shape, no_program state, and the direct workout shape seamlessly.
 */
export const normalizeTodayWorkout = (raw) => {
  if (!raw) return null;
  const data = raw.data !== undefined ? raw.data : raw;
  if (!data) return null;

  const dateKey = data.dateKey || new Date().toISOString().split('T')[0];

  // Debug: log the raw shape in dev
  if (__DEV__) {
    console.log('[normalizeTodayWorkout] raw keys:', Object.keys(data));
    console.log('[normalizeTodayWorkout] programDay?:', data.programDay ? {
      restDay: data.programDay.restDay,
      exercisesCount: data.programDay.exercises?.length,
      firstEx: data.programDay.exercises?.[0],
    } : 'null');
  }

  // 1. Check if user does not have an active program
  if (data.type === 'no_program' || (!data.program && !data.workoutPlan && !data.workout && !data.programDay)) {
    return {
      dateKey,
      type: 'no_program',
      hasProgram: false,
      isRest: false,
      message: data.message || 'Complete your profile or choose a workout plan to begin your daily routine.',
      workout: null,
      session: null,
      hasCompletedToday: false,
    };
  }

  const isRest = Boolean(
    data.type === 'rest' ||
    data.programDay?.restDay ||
    data.programDay?.isRest ||
    data.workout?.isRest
  );

  // Backend returns exercises in programDay.exercises with keys:
  //   exerciseId, name, slug, muscleGroups, equipment, difficulty,
  //   instructions, safetyNotes, targetSets, targetReps, restSeconds,
  //   notes, videoKey, videoUrl, thumbnailUrl
  const rawExercises =
    (Array.isArray(data.programDay?.exercises) && data.programDay.exercises.length > 0)
      ? data.programDay.exercises
      : (Array.isArray(data.workout?.exercises) && data.workout.exercises.length > 0)
      ? data.workout.exercises
      : Array.isArray(data.exercises)
      ? data.exercises
      : [];

  const exercises = rawExercises.map((ex, exIdx) => {
    const rawExObj = (typeof ex.exercise === 'object' && ex.exercise !== null) ? ex.exercise : {};
    const rawExIdObj = (typeof ex.exerciseId === 'object' && ex.exerciseId !== null) ? ex.exerciseId : {};
    const exId = String(
      (typeof ex.exerciseId === 'string' && ex.exerciseId) ||
      rawExIdObj._id ||
      rawExIdObj.id ||
      ex._id ||
      ex.id ||
      rawExObj._id ||
      rawExObj.id ||
      `ex_${exIdx}`
    );

    return {
      exerciseId: exId,
      name: ex.name || rawExIdObj.name || rawExObj.name || ex.title || 'Exercise',
      slug: ex.slug || rawExIdObj.slug || rawExObj.slug || '',
      sets: Number(ex.targetSets || ex.sets || rawExIdObj.sets || 3),
      reps: String(ex.targetReps || ex.reps || rawExIdObj.reps || '10-12'),
      restSec: Number(ex.restSeconds || ex.restSec || rawExIdObj.restSeconds || 60),
      videoUrl: ex.videoUrl || rawExIdObj.videoUrl || rawExObj.videoUrl || ex.videoKey || null,
      thumbnailUrl: ex.thumbnailUrl || rawExIdObj.thumbnailUrl || rawExObj.thumbnailUrl || null,
      difficulty: ex.difficulty || rawExIdObj.difficulty || rawExObj.difficulty || null,
      instructions: Array.isArray(ex.instructions)
        ? ex.instructions
        : Array.isArray(rawExIdObj.instructions)
        ? rawExIdObj.instructions
        : Array.isArray(rawExObj.instructions)
        ? rawExObj.instructions
        : [],
      safetyNotes: Array.isArray(ex.safetyNotes)
        ? ex.safetyNotes
        : Array.isArray(rawExIdObj.safetyNotes)
        ? rawExIdObj.safetyNotes
        : Array.isArray(rawExObj.safetyNotes)
        ? rawExObj.safetyNotes
        : [],
      muscleGroups: Array.isArray(ex.muscleGroups)
        ? ex.muscleGroups
        : Array.isArray(rawExIdObj.muscleGroups)
        ? rawExIdObj.muscleGroups
        : Array.isArray(rawExObj.muscleGroups)
        ? rawExObj.muscleGroups
        : [],
      equipment: Array.isArray(ex.equipment)
        ? ex.equipment
        : Array.isArray(rawExIdObj.equipment)
        ? rawExIdObj.equipment
        : Array.isArray(rawExObj.equipment)
        ? rawExObj.equipment
        : [],
      notes: ex.notes || rawExObj.notes || '',
    };
  });

  // Deduplicate exercises so each unique exercise is presented strictly once
  const seenExerciseKeys = new Set();
  const deduplicatedExercises = [];
  for (const ex of exercises) {
    const key = (ex.exerciseId && !ex.exerciseId.startsWith('ex_'))
      ? ex.exerciseId
      : (ex.slug || ex.name.toLowerCase().trim());
    if (!seenExerciseKeys.has(key)) {
      seenExerciseKeys.add(key);
      deduplicatedExercises.push(ex);
    }
  }

  if (__DEV__) {
    console.log('[normalizeTodayWorkout] mapped unique exercises:', deduplicatedExercises.length, deduplicatedExercises.map(e => e.name));
  }

  const activeSession = data.activeSession || data.session || null;
  const rawStatus = activeSession?.status || data.sessionStatus || 'not_started';
  
  // Map backend status enum ("STARTED", "started", "COMPLETED", "completed", "ABANDONED") to normalized status
  let sessionStatus = 'not_started';
  if (rawStatus === 'COMPLETED' || rawStatus === 'completed' || data.hasCompletedToday) {
    sessionStatus = 'completed';
  } else if (rawStatus === 'STARTED' || rawStatus === 'started' || rawStatus === 'in_progress') {
    sessionStatus = 'in_progress';
  }

  const hasCompleted = sessionStatus === 'completed';

  // Build completedSets and completedExerciseMap from activeSession
  const completedSetsMap = {};
  const completedExerciseMap = {};
  if (activeSession && Array.isArray(activeSession.exercises)) {
    activeSession.exercises.forEach((exLog, exIdx) => {
      const rawExId = String(
        (typeof exLog.exerciseId === 'string' && exLog.exerciseId) ||
        exLog.exerciseId?._id ||
        exLog.exerciseId?.id ||
        exLog.exercise?._id ||
        exLog._id ||
        ''
      );
      const exName = String(exLog.name || exLog.exercise?.name || '').toLowerCase().trim();
      const isExCompleted = Boolean(
        exLog.completed ||
        (Array.isArray(exLog.sets) && exLog.sets.length > 0 && exLog.sets.every(s => s.completed))
      );

      if (isExCompleted) {
        if (rawExId) completedExerciseMap[rawExId] = true;
        if (exName) completedExerciseMap[exName] = true;
      }

      if (Array.isArray(exLog.sets)) {
        exLog.sets.forEach((setLog, sIdx) => {
          if (setLog.completed) {
            completedSetsMap[`${exIdx}_${sIdx}`] = true;
            if (rawExId) completedSetsMap[`${rawExId}_${sIdx}`] = true;
          }
        });
      }
    });
  }

  return {
    dateKey,
    type: isRest ? 'rest' : 'workout',
    hasProgram: true,
    isRest,
    program: data.program || null,
    workoutPlan: data.workoutPlan || null,
    programWeek: data.programWeek || null,
    programDay: data.programDay || null,
    workout: {
      id: data.workout?.id || data.programDay?.id || data.programDay?._id || 'today',
      title: data.workout?.title || data.programDay?.title || (isRest ? 'Rest Day' : "Today's Workout"),
      estimatedMin: Number(data.workout?.estimatedMin || Math.max(20, deduplicatedExercises.length * 8)),
      programName: data.program?.name || data.workoutPlan?.name || null,
      level: data.program?.level || data.workoutPlan?.difficulty || 'Beginner',
      muscleGroups: data.programDay?.muscleGroups || data.workout?.muscleGroups || [],
      exercises: deduplicatedExercises,
    },
    session: {
      id: activeSession?._id || activeSession?.id || null,
      status: sessionStatus,
      durationSeconds: Number(activeSession?.durationSeconds || 0),
      caloriesEstimate: activeSession?.caloriesEstimate || null,
      proof: activeSession?.proof || null,
      completedSetsMap,
      completedExerciseMap,
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
