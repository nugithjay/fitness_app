import React, { useState, useMemo } from "react";
import { Dumbbell, Flame, Plus, Trash2, X, Check, Play, ChevronDown, ChevronUp } from "lucide-react";
import { THEME, uid, round0, round1, formatDateLabel, toKg, displayWeight, todayISO } from "../lib/core";
import { Card, SectionLabel, GhostButton, PrimaryButton, FieldInput, IconButton, EmptyState } from "../components/ui";
import { WorkoutSession } from "./WorkoutSession";
import { ExerciseDetail } from "../components/ExerciseDetail";

const blankExercise = () => ({ id: uid(), name: "", sets: [{ id: uid(), reps: "", weight: "" }] });
const blankWorkout = (date) => ({
  type: "strength", date, name: "", exercises: [blankExercise()],
  activityName: "", durationMin: "", distanceKm: "", caloriesBurned: "",
});

function WorkoutForm({ date, onSave, weightUnit }) {
  const [w, setW] = useState(blankWorkout(date));

  const updateExercise = (id, patch) => setW({ ...w, exercises: w.exercises.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)) });
  const updateSet = (exId, setId, patch) => setW({
    ...w,
    exercises: w.exercises.map((ex) => ex.id !== exId ? ex : { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }),
  });
  const addSet = (exId) => setW({ ...w, exercises: w.exercises.map((ex) => ex.id !== exId ? ex : { ...ex, sets: [...ex.sets, { id: uid(), reps: "", weight: "" }] }) });
  const removeSet = (exId, setId) => setW({ ...w, exercises: w.exercises.map((ex) => ex.id !== exId ? ex : { ...ex, sets: ex.sets.filter((s) => s.id !== setId) }) });
  const addExercise = () => setW({ ...w, exercises: [...w.exercises, blankExercise()] });
  const removeExercise = (id) => setW({ ...w, exercises: w.exercises.filter((ex) => ex.id !== id) });

  const canSaveStrength = w.exercises.some((ex) => ex.name.trim() && ex.sets.some((s) => s.reps && s.weight));
  const canSaveCardio = w.activityName.trim() && w.durationMin;

  const save = () => {
    if (w.type === "strength") {
      if (!canSaveStrength) return;
      const cleanExercises = w.exercises
        .filter((ex) => ex.name.trim())
        .map((ex) => ({
          name: ex.name.trim(),
          sets: ex.sets.filter((s) => s.reps && s.weight).map((s) => ({ reps: Number(s.reps), weightKg: toKg(s.weight, weightUnit) })),
        }))
        .filter((ex) => ex.sets.length > 0);
      onSave({ id: uid(), date: w.date, type: "strength", name: w.name.trim() || "Strength session", exercises: cleanExercises });
    } else {
      if (!canSaveCardio) return;
      onSave({
        id: uid(), date: w.date, type: "cardio", name: w.activityName.trim(),
        durationMin: Number(w.durationMin), distanceKm: w.distanceKm ? Number(w.distanceKm) : null,
        caloriesBurned: w.caloriesBurned ? Number(w.caloriesBurned) : null,
      });
    }
    setW(blankWorkout(date));
  };

  return (
    <Card>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <GhostButton active={w.type === "strength"} onClick={() => setW({ ...w, type: "strength" })} icon={Dumbbell} style={{ flex: 1 }}>Strength</GhostButton>
        <GhostButton active={w.type === "cardio"} onClick={() => setW({ ...w, type: "cardio" })} icon={Flame} style={{ flex: 1 }}>Cardio</GhostButton>
      </div>

      {w.type === "strength" ? (
        <div>
          <FieldInput label="Session name (optional)" value={w.name} onChange={(v) => setW({ ...w, name: v })} placeholder="Push day" />
          <div style={{ height: 14 }} />
          {w.exercises.map((ex) => (
            <div key={ex.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${THEME.border}` }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <FieldInput value={ex.name} onChange={(v) => updateExercise(ex.id, { name: v })} placeholder="Exercise name" />
                </div>
                <IconButton icon={Trash2} onClick={() => removeExercise(ex.id)} title="Remove exercise" />
              </div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {ex.sets.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: THEME.textMuted, width: 16 }}>{i + 1}</span>
                    <FieldInput value={s.reps} onChange={(v) => updateSet(ex.id, s.id, { reps: v })} type="number" inputMode="numeric" placeholder="reps" />
                    <FieldInput value={s.weight} onChange={(v) => updateSet(ex.id, s.id, { weight: v })} type="number" inputMode="decimal" placeholder="weight" unit={weightUnit} />
                    <IconButton icon={X} onClick={() => removeSet(ex.id, s.id)} />
                  </div>
                ))}
                <GhostButton icon={Plus} onClick={() => addSet(ex.id)} style={{ marginTop: 2 }}>Add set</GhostButton>
              </div>
            </div>
          ))}
          <GhostButton icon={Plus} onClick={addExercise} style={{ width: "100%" }}>Add exercise</GhostButton>
          <div style={{ marginTop: 14 }}>
            <PrimaryButton icon={Check} onClick={save} disabled={!canSaveStrength}>Save workout</PrimaryButton>
          </div>
        </div>
      ) : (
        <div>
          <FieldInput label="Activity" value={w.activityName} onChange={(v) => setW({ ...w, activityName: v })} placeholder="Run, cycle, swim..." />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <FieldInput label="Duration" value={w.durationMin} onChange={(v) => setW({ ...w, durationMin: v })} type="number" inputMode="decimal" unit="min" />
            <FieldInput label="Distance (optional)" value={w.distanceKm} onChange={(v) => setW({ ...w, distanceKm: v })} type="number" inputMode="decimal" unit="km" />
          </div>
          <div style={{ marginTop: 10 }}>
            <FieldInput label="Calories burned (optional)" value={w.caloriesBurned} onChange={(v) => setW({ ...w, caloriesBurned: v })} type="number" inputMode="decimal" unit="kcal" />
          </div>
          <div style={{ marginTop: 14 }}>
            <PrimaryButton icon={Check} onClick={save} disabled={!canSaveCardio}>Save workout</PrimaryButton>
          </div>
        </div>
      )}
    </Card>
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
              : `${workout.durationMin} min${workout.distanceKm ? ` · ${workout.distanceKm} km` : ""}${workout.caloriesBurned ? ` · ${workout.caloriesBurned} kcal` : ""}`}
          </div>
        </div>
        <IconButton icon={Trash2} onClick={(e) => { e.stopPropagation(); onDelete(workout.id); }} />
      </div>
      {expanded && workout.type === "strength" && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {workout.exercises.map((ex, i) => (
            <div key={i}>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenDetail(ex.name); }}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
              >
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

function TemplateCard({ template, onStart, onDelete }) {
  return (
    <Card style={{ minWidth: 180, marginRight: 10, flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text, marginBottom: 4 }}>{template.name}</div>
        <IconButton icon={Trash2} onClick={onDelete} />
      </div>
      <div style={{ fontSize: 11.5, color: THEME.textMuted, marginBottom: 12 }}>
        {template.exercises.length} exercise{template.exercises.length !== 1 ? "s" : ""}
      </div>
      <GhostButton icon={Play} onClick={onStart} style={{ width: "100%" }}>Start</GhostButton>
    </Card>
  );
}

export function WorkoutsView({
  date, workoutLog, templates, onAddWorkout, onDeleteWorkout, weightUnit,
  activeSession, onStartSession, onUpdateSession, onFinishSession, onCancelSession,
  onDeleteTemplate, exerciseLibrary, restSeconds,
}) {
  const [showManualForm, setShowManualForm] = useState(false);
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

  if (activeSession) {
    return (
      <WorkoutSession
        session={activeSession}
        onChange={onUpdateSession}
        onFinish={onFinishSession}
        onCancel={onCancelSession}
        weightUnit={weightUnit}
        exerciseLibrary={exerciseLibrary}
        workoutLog={workoutLog}
        restSeconds={restSeconds}
      />
    );
  }

  const startBlank = () => onStartSession({ name: "", date: todayISO(), startedAt: Date.now(), exercises: [] });

  const startFromTemplate = (template) => {
    const libByName = new Map(exerciseLibrary.map((e) => [e.name.toLowerCase(), e]));
    onStartSession({
      name: template.name,
      date: todayISO(),
      startedAt: Date.now(),
      exercises: template.exercises.map((te) => {
        const lib = libByName.get(te.name.toLowerCase());
        return {
          id: uid(),
          name: te.name,
          sets: Array.from({ length: Math.max(1, te.setCount || 3) }, () => ({
            id: uid(),
            reps: lib ? lib.lastReps || "" : "",
            weight: lib && lib.lastWeightKg ? displayWeight(lib.lastWeightKg, weightUnit) : "",
            done: false,
          })),
        };
      }),
    });
  };

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <SectionLabel>Start a workout</SectionLabel>
        {templates.length > 0 && (
          <div style={{ display: "flex", overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} onStart={() => startFromTemplate(t)} onDelete={() => onDeleteTemplate(t.id)} />
            ))}
          </div>
        )}
        <PrimaryButton icon={Play} onClick={startBlank}>Start blank workout</PrimaryButton>
      </div>

      <div>
        <button
          onClick={() => setShowManualForm(!showManualForm)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: THEME.textMuted, fontSize: 12, cursor: "pointer", padding: 0, marginBottom: showManualForm ? 10 : 0 }}
        >
          {showManualForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Log a past workout manually
        </button>
        {showManualForm && <WorkoutForm date={date} onSave={onAddWorkout} weightUnit={weightUnit} />}
      </div>

      <div>
        <SectionLabel>History</SectionLabel>
        {dates.length === 0 ? (
          <Card><EmptyState text="No workouts yet. Start one above." /></Card>
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
