export const DEFAULT_EXERCISES = [
  "Bench Press (Barbell)", "Squat (Barbell)", "Deadlift (Barbell)", "Overhead Press (Barbell)",
  "Bent Over Row (Barbell)", "Pull Up", "Chin Up", "Lat Pulldown (Cable)", "Seated Row (Cable)",
  "Leg Press (Machine)", "Leg Curl (Machine)", "Leg Extension (Machine)", "Bicep Curl (Dumbbell)",
  "Hammer Curl (Dumbbell)", "Tricep Pushdown (Cable)", "Lateral Raise (Dumbbell)",
  "Incline Bench Press (Dumbbell)", "Romanian Deadlift (Barbell)", "Hip Thrust (Barbell)",
  "Plank", "Face Pull (Cable)", "Shoulder Press (Dumbbell)", "Calf Raise (Machine)",
  "Chest Fly (Machine)", "Cable Crunch",
];

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
