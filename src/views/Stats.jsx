import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Trash2, X, Loader2, Plus } from "lucide-react";
import {
  THEME, uid, round0, round1, todayISO, addDaysISO, shortLabel, isoWeekStart,
  formatDateLabel, displayWeight,
} from "../lib/core";
import { Card, SectionLabel, GhostButton, IconButton, EmptyState } from "../components/ui";
import { StatCard, chartTooltipStyle } from "../components/Metrics";
import { ExerciseDetail } from "../components/ExerciseDetail";
import { uploadProgressPhoto, getPhotoSignedUrl, deleteProgressPhotoFile } from "../lib/db";

function TabPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "9px 4px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
        background: active ? THEME.surfaceHigh : "transparent",
        color: active ? THEME.text : THEME.textMuted,
        border: `1px solid ${active ? THEME.accent : THEME.border}`,
      }}
    >
      {children}
    </button>
  );
}

function ProgressPhotos({ photos, onAdd, onDelete }) {
  const [urls, setUrls] = useState({});
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = photos.filter((p) => !urls[p.id]);
      if (missing.length === 0) return;
      const entries = await Promise.all(missing.map(async (p) => [p.id, await getPhotoSignedUrl(p.path)]));
      if (!cancelled) setUrls((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const id = uid();
      const path = await uploadProgressPhoto(file, todayISO(), id);
      onAdd({ id, date: todayISO(), path });
    } catch (err) {
      console.error("Photo upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const sorted = [...photos].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div>
      <SectionLabel>Progress photos</SectionLabel>
      <Card style={{ padding: 12 }}>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 2 }}>
          <label style={{
            flexShrink: 0, width: 84, height: 84, borderRadius: 12, border: `1.5px dashed ${THEME.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: THEME.textMuted,
          }}>
            <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFile} />
            {uploading ? <Loader2 size={20} className="spin" /> : <Plus size={22} />}
          </label>
          {sorted.map((p) => (
            <button
              key={p.id}
              onClick={() => setViewing(p)}
              style={{
                flexShrink: 0, width: 84, height: 84, borderRadius: 12, overflow: "hidden",
                border: `1px solid ${THEME.border}`, padding: 0, cursor: "pointer", background: THEME.surfaceHigh,
                backgroundImage: urls[p.id] ? `url(${urls[p.id]})` : "none",
                backgroundSize: "cover", backgroundPosition: "center",
              }}
            />
          ))}
        </div>
      </Card>

      {viewing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 70, display: "flex", flexDirection: "column" }} onClick={() => setViewing(null)}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: 16 }}>
            <span style={{ color: THEME.text, fontSize: 13, fontFamily: THEME.mono }}>{viewing.date}</span>
            <div style={{ display: "flex", gap: 14 }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { deleteProgressPhotoFile(viewing.path); onDelete(viewing.id); setViewing(null); }} style={{ background: "none", border: "none", color: THEME.danger, cursor: "pointer" }}>
                <Trash2 size={20} />
              </button>
              <button onClick={() => setViewing(null)} style={{ background: "none", border: "none", color: THEME.text, cursor: "pointer" }}>
                <X size={22} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            {urls[viewing.id] ? <img src={urls[viewing.id]} alt={viewing.date} style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }} onClick={(e) => e.stopPropagation()} /> : <Loader2 size={24} color={THEME.text} className="spin" />}
          </div>
        </div>
      )}
    </div>
  );
}

function WeightStats({ weightLog, profile, photos, onAddPhoto, onDeletePhoto }) {
  const [rangeDays, setRangeDays] = useState(30);
  const sortedWeights = useMemo(() => [...weightLog].sort((a, b) => (a.date < b.date ? -1 : 1)), [weightLog]);
  const rangeStart = rangeDays === Infinity ? null : addDaysISO(todayISO(), -rangeDays);
  const weightInRange = sortedWeights.filter((w) => !rangeStart || w.date >= rangeStart);
  const chartData = weightInRange.map((w) => ({ date: shortLabel(w.date), weight: displayWeight(w.weightKg, profile.weightUnit) }));
  const currentWeight = sortedWeights.length ? sortedWeights[sortedWeights.length - 1] : null;
  const weightChange = weightInRange.length >= 2
    ? displayWeight(weightInRange[weightInRange.length - 1].weightKg - weightInRange[0].weightKg, profile.weightUnit)
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <StatCard label="Weight" value={currentWeight ? displayWeight(currentWeight.weightKg, profile.weightUnit) : "—"} sub={profile.weightUnit} />
        <StatCard label="Change" value={weightChange != null ? `${weightChange > 0 ? "+" : ""}${weightChange}` : "—"} sub={rangeDays === Infinity ? "all time" : `${rangeDays}d`} />
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <SectionLabel>Trend</SectionLabel>
          <div style={{ display: "flex", gap: 6 }}>
            {[[7, "7D"], [30, "30D"], [90, "90D"], [Infinity, "All"]].map(([d, l]) => (
              <GhostButton key={l} active={rangeDays === d} onClick={() => setRangeDays(d)} style={{ padding: "5px 9px", fontSize: 11 }}>{l}</GhostButton>
            ))}
          </div>
        </div>
        <Card>
          {chartData.length < 2 ? (
            <EmptyState text="Log your weight a few times to see a trend line here." />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="date" tick={{ fill: THEME.textMuted, fontSize: 10 }} axisLine={{ stroke: THEME.border }} tickLine={false} />
                <YAxis domain={["auto", "auto"]} tick={{ fill: THEME.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="weight" stroke={THEME.accent} strokeWidth={2.5} dot={{ r: 2.5, fill: THEME.accent }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
      <ProgressPhotos photos={photos} onAdd={onAddPhoto} onDelete={onDeletePhoto} />
    </div>
  );
}

function WorkoutHistoryItem({ workout, onDelete, weightUnit, onOpenDetail }) {
  const [expanded, setExpanded] = useState(false);
  const volume = workout.type === "strength"
    ? workout.exercises.reduce((sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps * set.weightKg, 0), 0)
    : null;

  return (
    <div style={{ borderBottom: `1px solid ${THEME.border}`, padding: "12px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text }}>{workout.name}</div>
          <div style={{ fontSize: 11.5, color: THEME.textMuted, marginTop: 2 }}>
            {workout.type === "strength"
              ? `${workout.exercises.length} exercise${workout.exercises.length !== 1 ? "s" : ""} · ${round0(displayWeight(volume, weightUnit))} ${weightUnit} volume`
              : `${workout.durationMin ? `${round1(workout.durationMin)} min` : ""}${workout.distanceKm ? ` · ${workout.distanceKm} km` : ""}${workout.caloriesBurned ? ` · ${workout.caloriesBurned} kcal` : ""}${workout.avgHR ? ` · ${workout.avgHR} avg HR` : ""}`}
          </div>
        </div>
        <IconButton icon={Trash2} onClick={(e) => { e.stopPropagation(); onDelete(workout.id); }} />
      </div>
      {expanded && workout.type === "strength" && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {workout.exercises.map((ex, i) => (
            <div key={i}>
              <button onClick={(e) => { e.stopPropagation(); onOpenDetail(ex.name); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: THEME.text, textDecoration: "underline", textDecorationColor: THEME.border, textUnderlineOffset: 2 }}>{ex.name}</span>
              </button>
              <div style={{ fontSize: 11.5, color: THEME.textMuted, fontFamily: THEME.mono }}>
                {ex.sets.map((s) => `${s.reps}×${round1(displayWeight(s.weightKg, weightUnit))}${weightUnit}`).join("  ·  ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkoutStats({ workoutLog, onDeleteWorkout, weightUnit }) {
  const [detailExercise, setDetailExercise] = useState(null);

  const grouped = useMemo(() => {
    const byDate = {};
    [...workoutLog].sort((a, b) => (a.date < b.date ? 1 : -1)).forEach((w) => {
      byDate[w.date] = byDate[w.date] || [];
      byDate[w.date].push(w);
    });
    return byDate;
  }, [workoutLog]);
  const dates = Object.keys(grouped);

  const weeklyVolume = useMemo(() => {
    const map = {};
    workoutLog.filter((w) => w.type === "strength").forEach((w) => {
      const wk = isoWeekStart(w.date);
      const vol = w.exercises.reduce((sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps * set.weightKg, 0), 0);
      map[wk] = (map[wk] || 0) + vol;
    });
    const weeks = Array.from({ length: 8 }, (_, i) => isoWeekStart(addDaysISO(todayISO(), -7 * (7 - i))));
    return weeks.map((wk) => ({ date: shortLabel(wk), volume: round0(displayWeight(map[wk] || 0, weightUnit)) }));
  }, [workoutLog, weightUnit]);

  const thisWeekStart = isoWeekStart(todayISO());
  const workoutsThisWeek = workoutLog.filter((w) => w.date >= thisWeekStart).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <StatCard label="Workouts this week" value={workoutsThisWeek} />

      <div>
        <SectionLabel>Weekly strength volume</SectionLabel>
        <Card>
          {weeklyVolume.every((w) => w.volume === 0) ? (
            <EmptyState text="Import strength workouts to track your weekly volume." />
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={weeklyVolume} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="date" tick={{ fill: THEME.textMuted, fontSize: 9 }} axisLine={{ stroke: THEME.border }} tickLine={false} />
                <YAxis tick={{ fill: THEME.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="volume" fill={THEME.protein} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div>
        <SectionLabel>History</SectionLabel>
        {dates.length === 0 ? (
          <Card><EmptyState text="No workouts yet — import from the Import tab." /></Card>
        ) : (
          dates.map((d) => (
            <div key={d} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 4, fontWeight: 600 }}>{formatDateLabel(d)}</div>
              <Card style={{ padding: "0 16px" }}>
                {grouped[d].map((w) => <WorkoutHistoryItem key={w.id} workout={w} onDelete={onDeleteWorkout} weightUnit={weightUnit} onOpenDetail={setDetailExercise} />)}
              </Card>
            </div>
          ))
        )}
      </div>

      {detailExercise && (
        <ExerciseDetail exerciseName={detailExercise} workoutLog={workoutLog} weightUnit={weightUnit} onClose={() => setDetailExercise(null)} />
      )}
    </div>
  );
}

function HealthStats({ healthLog, workoutLog }) {
  const last30 = Array.from({ length: 30 }, (_, i) => addDaysISO(todayISO(), -(29 - i)));
  const stepsData = last30.map((d) => ({ date: shortLabel(d), steps: healthLog[d]?.steps || 0 }));
  const rhrData = last30.filter((d) => healthLog[d]?.restingHR).map((d) => ({ date: shortLabel(d), restingHR: healthLog[d].restingHR }));
  const sleepData = last30.map((d) => ({ date: shortLabel(d), hours: healthLog[d]?.sleepMinutes ? round1(healthLog[d].sleepMinutes / 60) : 0 }));

  const daysWithData = Object.keys(healthLog).length;
  const avg = (arr) => (arr.length ? round0(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
  const avgSteps = avg(last30.map((d) => healthLog[d]?.steps).filter(Boolean));
  const avgRHR = avg(last30.map((d) => healthLog[d]?.restingHR).filter(Boolean));
  const avgSleepHrs = avg(last30.map((d) => healthLog[d]?.sleepMinutes).filter(Boolean).map((m) => m / 60));

  const activityHR = useMemo(() => (
    [...workoutLog].filter((w) => w.type === "cardio" && w.avgHR).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-20)
      .map((w) => ({ date: shortLabel(w.date), avgHR: w.avgHR, maxHR: w.maxHR || null }))
  ), [workoutLog]);

  if (daysWithData === 0 && activityHR.length === 0) {
    return <Card><EmptyState text="Import Garmin health data from the Import tab to see steps, resting heart rate, sleep, and more here." /></Card>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <StatCard label="Avg steps" value={avgSteps || "—"} sub="30d" />
        <StatCard label="Avg resting HR" value={avgRHR || "—"} sub="bpm" />
        <StatCard label="Avg sleep" value={avgSleepHrs || "—"} sub="hrs" />
      </div>

      <div>
        <SectionLabel>Steps — last 30 days</SectionLabel>
        <Card>
          {stepsData.every((d) => d.steps === 0) ? <EmptyState text="No step data imported yet." /> : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={stepsData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="date" tick={{ fill: THEME.textMuted, fontSize: 8 }} axisLine={{ stroke: THEME.border }} tickLine={false} interval={4} />
                <YAxis tick={{ fill: THEME.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="steps" fill={THEME.accent} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div>
        <SectionLabel>Resting heart rate</SectionLabel>
        <Card>
          {rhrData.length < 2 ? <EmptyState text="Not enough resting HR data yet." /> : (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={rhrData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="date" tick={{ fill: THEME.textMuted, fontSize: 9 }} axisLine={{ stroke: THEME.border }} tickLine={false} />
                <YAxis domain={["auto", "auto"]} tick={{ fill: THEME.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="restingHR" stroke={THEME.protein} strokeWidth={2.5} dot={{ r: 2.5, fill: THEME.protein }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div>
        <SectionLabel>Sleep — last 30 days</SectionLabel>
        <Card>
          {sleepData.every((d) => d.hours === 0) ? <EmptyState text="No sleep data imported yet." /> : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={sleepData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="date" tick={{ fill: THEME.textMuted, fontSize: 8 }} axisLine={{ stroke: THEME.border }} tickLine={false} interval={4} />
                <YAxis tick={{ fill: THEME.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="hours" fill={THEME.carbs} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div>
        <SectionLabel>Heart rate — last 20 Garmin activities</SectionLabel>
        <Card>
          {activityHR.length < 2 ? <EmptyState text="Import Garmin activities with heart rate data to see this." /> : (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={activityHR} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="date" tick={{ fill: THEME.textMuted, fontSize: 9 }} axisLine={{ stroke: THEME.border }} tickLine={false} />
                <YAxis domain={["auto", "auto"]} tick={{ fill: THEME.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="avgHR" name="Avg HR" stroke={THEME.protein} strokeWidth={2.5} dot={{ r: 2.5, fill: THEME.protein }} />
                <Line type="monotone" dataKey="maxHR" name="Max HR" stroke={THEME.danger} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

export function StatsView({ weightLog, workoutLog, healthLog, profile, photos, onAddPhoto, onDeletePhoto, onDeleteWorkout }) {
  const [tab, setTab] = useState("weight");

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <TabPill active={tab === "weight"} onClick={() => setTab("weight")}>Weight</TabPill>
        <TabPill active={tab === "workouts"} onClick={() => setTab("workouts")}>Workouts</TabPill>
        <TabPill active={tab === "health"} onClick={() => setTab("health")}>Health</TabPill>
      </div>

      {tab === "weight" && <WeightStats weightLog={weightLog} profile={profile} photos={photos} onAddPhoto={onAddPhoto} onDeletePhoto={onDeletePhoto} />}
      {tab === "workouts" && <WorkoutStats workoutLog={workoutLog} onDeleteWorkout={onDeleteWorkout} weightUnit={profile.weightUnit} />}
      {tab === "health" && <HealthStats healthLog={healthLog} workoutLog={workoutLog} />}
    </div>
  );
}
