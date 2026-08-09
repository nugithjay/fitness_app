import { estimate1RM, round1 } from "./core";

export const DEFAULT_EXERCISES = [
  "Bench Press (Barbell)", "Squat (Barbell)", "Deadlift (Barbell)", "Overhead Press (Barbell)",
  "Bent Over Row (Barbell)", "Pull Up", "Chin Up", "Lat Pulldown (Cable)", "Seated Row (Cable)",
  "Leg Press (Machine)", "Leg Curl (Machine)", "Leg Extension (Machine)", "Bicep Curl (Dumbbell)",
  "Hammer Curl (Dumbbell)", "Tricep Pushdown (Cable)", "Lateral Raise (Dumbbell)",
  "Incline Bench Press (Dumbbell)", "Romanian Deadlift (Barbell)", "Hip Thrust (Barbell)",
  "Plank", "Face Pull (Cable)", "Shoulder Press (Dumbbell)", "Calf Raise (Machine)",
  "Chest Fly (Machine)", "Cable Crunch",
];

// Every past instance of a given exercise, most recent first.
export function getExerciseHistory(workoutLog, exerciseName) {
  const key = exerciseName.trim().toLowerCase();
  return [...workoutLog]
    .filter((w) => w.type === "strength")
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((w) => {
      const ex = w.exercises.find((e) => e.name.trim().toLowerCase() === key);
      return ex ? { date: w.date, sets: ex.sets } : null;
    })
    .filter(Boolean);
}

// Best weight, best estimated 1RM, and best single-session volume ever logged for this exercise.
export function getExerciseRecords(workoutLog, exerciseName) {
  const history = getExerciseHistory(workoutLog, exerciseName);
  let bestWeightKg = 0, bestE1rm = 0, bestVolumeKg = 0;
  history.forEach(({ sets }) => {
    const sessionVolume = sets.reduce((s, set) => s + set.reps * set.weightKg, 0);
    if (sessionVolume > bestVolumeKg) bestVolumeKg = sessionVolume;
    sets.forEach((s) => {
      if (s.weightKg > bestWeightKg) bestWeightKg = s.weightKg;
      const e1rm = estimate1RM(s.weightKg, s.reps);
      if (e1rm > bestE1rm) bestE1rm = e1rm;
    });
  });
  return { bestWeightKg: round1(bestWeightKg), bestE1rm: round1(bestE1rm), bestVolumeKg: round1(bestVolumeKg) };
}

// Builds a searchable exercise list: your own history first (most-used first),
// then default exercises you haven't logged yet, so it's personalized but never empty.
export function buildExerciseLibrary(workoutLog) {
  const seen = new Map();
  workoutLog.filter((w) => w.type === "strength").forEach((w) => {
    (w.exercises || []).forEach((ex) => {
      const key = ex.name.trim().toLowerCase();
      const lastSet = ex.sets[ex.sets.length - 1];
      const existing = seen.get(key);
      seen.set(key, {
        name: ex.name.trim(),
        lastWeightKg: lastSet ? lastSet.weightKg : (existing ? existing.lastWeightKg : 0),
        lastReps: lastSet ? lastSet.reps : (existing ? existing.lastReps : 0),
        count: (existing ? existing.count : 0) + 1,
      });
    });
  });
  const fromHistory = Array.from(seen.values()).sort((a, b) => b.count - a.count);
  const historyNames = new Set(fromHistory.map((e) => e.name.toLowerCase()));
  const extras = DEFAULT_EXERCISES
    .filter((n) => !historyNames.has(n.toLowerCase()))
    .map((n) => ({ name: n, lastWeightKg: 0, lastReps: 0, count: 0 }));
  return [...fromHistory, ...extras];
}
