import { todayISO, addDaysISO, estimate1RM, round1 } from "./core";

// Consecutive days with a weigh-in, most recent first (today doesn't break the
// streak if you just haven't logged yet today).
export function computeStreak(weightLog) {
  const logged = new Set(weightLog.map((w) => w.date));
  let streak = 0;
  let d = todayISO();
  if (!logged.has(d)) d = addDaysISO(d, -1);
  while (logged.has(d)) {
    streak++;
    d = addDaysISO(d, -1);
  }
  return streak;
}

export function computeWeeklyRollup(weightLog, workoutLog) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(todayISO(), -i));
  const sortedWeights = [...weightLog].sort((a, b) => (a.date < b.date ? -1 : 1));
  const inWeek = sortedWeights.filter((w) => w.date >= days[6]);
  const weightChangeKg = inWeek.length >= 2 ? inWeek[inWeek.length - 1].weightKg - inWeek[0].weightKg : null;
  const workoutsThisWeek = workoutLog.filter((w) => w.date >= days[6]).length;
  return { weightChangeKg, workoutsThisWeek };
}

export function computeRecentPR(workoutLog) {
  const strength = [...workoutLog].filter((w) => w.type === "strength").sort((a, b) => (a.date < b.date ? -1 : 1));
  if (strength.length === 0) return null;
  const mostRecentDate = strength[strength.length - 1].date;
  const recentWorkouts = strength.filter((w) => w.date === mostRecentDate);

  const bestBefore = new Map();
  strength.filter((w) => w.date < mostRecentDate).forEach((w) => {
    w.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        const e1rm = estimate1RM(s.weightKg, s.reps);
        const key = ex.name.toLowerCase();
        if (!bestBefore.has(key) || e1rm > bestBefore.get(key)) bestBefore.set(key, e1rm);
      });
    });
  });

  let best = null;
  recentWorkouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        const e1rm = estimate1RM(s.weightKg, s.reps);
        const key = ex.name.toLowerCase();
        const prior = bestBefore.get(key) || 0;
        if (e1rm > prior && (!best || e1rm > best.e1rm)) {
          best = { name: ex.name, weightKg: s.weightKg, reps: s.reps, e1rm: round1(e1rm), date: w.date };
        }
      });
    });
  });
  return best;
}
