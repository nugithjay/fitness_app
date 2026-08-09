import { todayISO, addDaysISO, estimate1RM, round0, round1 } from "./core";

export function computeStreak(foodLog) {
  let streak = 0;
  let d = todayISO();
  // if nothing logged yet today, don't break the streak on today — start checking from yesterday
  if (!(foodLog[d] && foodLog[d].length > 0)) d = addDaysISO(d, -1);
  while (foodLog[d] && foodLog[d].length > 0) {
    streak++;
    d = addDaysISO(d, -1);
  }
  return streak;
}

export function computeWeeklyRollup(foodLog, weightLog, workoutLog) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(todayISO(), -i));
  const totalCals = days.reduce((s, d) => s + (foodLog[d] || []).reduce((s2, e) => s2 + Number(e.calories || 0), 0), 0);
  const loggedDays = days.filter((d) => (foodLog[d] || []).length > 0).length;
  const avgCalories = loggedDays ? round0(totalCals / loggedDays) : 0;

  const sortedWeights = [...weightLog].sort((a, b) => (a.date < b.date ? -1 : 1));
  const inWeek = sortedWeights.filter((w) => w.date >= days[6]);
  const weightChangeKg = inWeek.length >= 2 ? inWeek[inWeek.length - 1].weightKg - inWeek[0].weightKg : null;

  const workoutsThisWeek = workoutLog.filter((w) => w.date >= days[6]).length;

  return { avgCalories, weightChangeKg, workoutsThisWeek, loggedDays };
}

// Finds the single best PR set (by estimated 1RM) achieved on the most recent workout date,
// only if it actually beats every prior instance of that exercise.
export function computeRecentPR(workoutLog) {
  const strength = [...workoutLog].filter((w) => w.type === "strength").sort((a, b) => (a.date < b.date ? -1 : 1));
  if (strength.length === 0) return null;
  const mostRecentDate = strength[strength.length - 1].date;
  const recentWorkouts = strength.filter((w) => w.date === mostRecentDate);

  const bestBefore = new Map(); // exercise name -> best est. 1RM before mostRecentDate
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
