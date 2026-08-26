import { estimate1RM, round1 } from "./core";

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
