import React, { useState, useEffect, useRef } from "react";
import { X, Check, Plus, Trash2, ChevronLeft } from "lucide-react";
import { THEME, uid, round1, toKg, displayWeight } from "../lib/core";
import { Card, GhostButton, FieldInput, IconButton } from "../components/ui";
import { useRestTimer } from "../hooks/useRestTimer";
import { ExerciseDetail } from "../components/ExerciseDetail";

function formatElapsed(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${mm}:${ss}`;
}
function formatRest(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ExercisePicker({ library, onPick, onClose }) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? library.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))
    : library;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 70, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div
        style={{ background: THEME.bg, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxHeight: "80vh", display: "flex", flexDirection: "column", border: `1px solid ${THEME.border}`, borderBottom: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: THEME.text }}>Add exercise</span>
          <IconButton icon={X} onClick={onClose} />
        </div>
        <FieldInput value={query} onChange={setQuery} placeholder="Search exercises" />
        <div style={{ overflowY: "auto", marginTop: 12, flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>No matches — try a different search.</div>
          ) : (
            filtered.slice(0, 80).map((ex, i) => (
              <button
                key={ex.name + i}
                onClick={() => onPick(ex)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
                  background: "transparent", border: "none", borderBottom: `1px solid ${THEME.border}`,
                  padding: "12px 2px", cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontSize: 13.5, color: THEME.text, fontWeight: 600 }}>{ex.name}</span>
                {ex.count > 0 && <span style={{ fontSize: 11, color: THEME.textMuted, fontFamily: THEME.mono }}>{ex.count}x logged</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SwipeSetRow({ children, onDelete }) {
  const [dx, setDx] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; dragging.current = true; };
  const onTouchMove = (e) => {
    if (!dragging.current) return;
    const delta = e.touches[0].clientX - startX.current;
    if (delta < 0) setDx(Math.max(delta, -72));
  };
  const onTouchEnd = () => {
    dragging.current = false;
    if (dx < -44) onDelete();
    setDx(0);
  };

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 8 }}>
      <div style={{
        position: "absolute", inset: 0, background: THEME.danger, borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 14,
      }}>
        <Trash2 size={15} color="#fff" />
      </div>
      <div
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${dx}px)`, transition: dragging.current ? "none" : "transform 0.2s ease", background: THEME.surfaceHigh, borderRadius: 8 }}
      >
        {children}
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, weightUnit, onUpdate, onRemove, onSetLogged, onOpenDetail }) {
  const updateSet = (setId, patch) => onUpdate({ ...exercise, sets: exercise.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) });
  const removeSet = (setId) => onUpdate({ ...exercise, sets: exercise.sets.filter((s) => s.id !== setId) });
  const addSet = () => {
    const last = exercise.sets[exercise.sets.length - 1];
    onUpdate({ ...exercise, sets: [...exercise.sets, { id: uid(), reps: last ? last.reps : "", weight: last ? last.weight : "", done: false }] });
  };
  const toggleDone = (set) => {
    const nowDone = !set.done;
    const idx = exercise.sets.findIndex((s) => s.id === set.id);
    let newSets = exercise.sets.map((s) => (s.id === set.id ? { ...s, done: nowDone } : s));
    if (nowDone) {
      const next = newSets[idx + 1];
      if (next && !next.done && !next.reps && !next.weight) {
        newSets = newSets.map((s) => (s.id === next.id ? { ...s, reps: set.reps, weight: set.weight } : s));
      }
    }
    onUpdate({ ...exercise, sets: newSets });
    if (nowDone) onSetLogged();
  };

  return (
    <Card style={{ marginBottom: 12, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button onClick={onOpenDetail} style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: THEME.text, textDecoration: "underline", textDecorationColor: THEME.border, textDecorationThickness: 1, textUnderlineOffset: 3 }}>
            {exercise.name}
          </span>
        </button>
        <IconButton icon={Trash2} onClick={onRemove} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", gap: 6, fontSize: 10, color: THEME.textMuted, padding: "0 8px" }}>
          <span style={{ width: 18 }}>#</span>
          <span style={{ flex: 1 }}>Reps</span>
          <span style={{ flex: 1 }}>Weight ({weightUnit})</span>
          <span style={{ width: 30 }} />
        </div>
        {exercise.sets.map((s, i) => (
          <SwipeSetRow key={s.id} onDelete={() => removeSet(s.id)}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "5px 8px" }}>
              <span style={{ width: 18, fontSize: 12, color: THEME.textMuted, fontFamily: THEME.mono }}>{i + 1}</span>
              <input
                value={s.reps}
                onChange={(e) => updateSet(s.id, { reps: e.target.value })}
                type="number" inputMode="numeric" placeholder="0"
                style={{ flex: 1, background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 7, padding: "8px 6px", color: THEME.text, fontFamily: THEME.mono, fontSize: 14, textAlign: "center" }}
              />
              <input
                value={s.weight}
                onChange={(e) => updateSet(s.id, { weight: e.target.value })}
                type="number" inputMode="decimal" placeholder="0"
                style={{ flex: 1, background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 7, padding: "8px 6px", color: THEME.text, fontFamily: THEME.mono, fontSize: 14, textAlign: "center" }}
              />
              <button
                onClick={() => toggleDone(s)}
                style={{
                  width: 30, height: 30, borderRadius: 7, flexShrink: 0, cursor: "pointer",
                  border: `1px solid ${s.done ? THEME.success : THEME.border}`,
                  background: s.done ? THEME.success : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Check size={15} color={s.done ? "#12241B" : THEME.textMuted} />
              </button>
            </div>
          </SwipeSetRow>
        ))}
        <GhostButton icon={Plus} onClick={addSet} style={{ marginTop: 2 }}>Add set</GhostButton>
      </div>
      <div style={{ fontSize: 10, color: THEME.textMuted, marginTop: 8, textAlign: "center" }}>Swipe a set left to delete</div>
    </Card>
  );
}

export function WorkoutSession({ session, onChange, onFinish, onCancel, weightUnit, exerciseLibrary, workoutLog, restSeconds }) {
  const [elapsedMs, setElapsedMs] = useState(Date.now() - session.startedAt);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detailExercise, setDetailExercise] = useState(null);
  const rest = useRestTimer();

  useEffect(() => {
    const t = setInterval(() => setElapsedMs(Date.now() - session.startedAt), 1000);
    return () => clearInterval(t);
  }, [session.startedAt]);

  const updateExercise = (id, patch) => onChange({ ...session, exercises: session.exercises.map((ex) => (ex.id === id ? patch : ex)) });
  const removeExercise = (id) => onChange({ ...session, exercises: session.exercises.filter((ex) => ex.id !== id) });

  const addExerciseFromLibrary = (libEx) => {
    const newEx = {
      id: uid(),
      name: libEx.name,
      sets: [{ id: uid(), reps: libEx.lastReps || "", weight: libEx.lastWeightKg ? displayWeight(libEx.lastWeightKg, weightUnit) : "", done: false }],
    };
    onChange({ ...session, exercises: [...session.exercises, newEx] });
    setPickerOpen(false);
  };

  const canFinish = session.exercises.some((ex) => ex.sets.some((s) => s.done));

  const finish = () => {
    const cleanExercises = session.exercises
      .map((ex) => ({
        name: ex.name,
        sets: ex.sets.filter((s) => s.done && s.reps && s.weight !== "").map((s) => ({ reps: Number(s.reps), weightKg: round1(toKg(s.weight, weightUnit)) })),
      }))
      .filter((ex) => ex.sets.length > 0);
    onFinish({
      id: uid(), date: session.date, type: "strength",
      name: session.name.trim() || "Strength session",
      exercises: cleanExercises,
    });
  };

  return (
    <div style={{ padding: 16, paddingBottom: 100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <IconButton icon={ChevronLeft} onClick={onCancel} title="Cancel workout" />
        <div style={{ fontFamily: THEME.mono, fontSize: 15, color: THEME.textMuted }}>{formatElapsed(elapsedMs)}</div>
        <button
          onClick={finish}
          disabled={!canFinish}
          style={{
            display: "flex", alignItems: "center", gap: 4, background: canFinish ? THEME.accent : THEME.surfaceHigh,
            color: canFinish ? "#1A1408" : THEME.textMuted, border: "none", borderRadius: 10, padding: "8px 14px",
            fontSize: 13, fontWeight: 700, cursor: canFinish ? "pointer" : "default",
          }}
        >
          <Check size={15} /> Finish
        </button>
      </div>

      <input
        value={session.name}
        onChange={(e) => onChange({ ...session, name: e.target.value })}
        placeholder="Workout name"
        style={{
          width: "100%", background: "transparent", border: "none", color: THEME.text,
          fontSize: 20, fontWeight: 700, padding: "10px 0 16px", outline: "none",
        }}
      />

      {rest.active && (
        <Card style={{ marginBottom: 14, background: THEME.surfaceHigh, border: `1px solid ${THEME.accent}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10.5, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: 0.6 }}>Resting</div>
              <div style={{ fontFamily: THEME.mono, fontSize: 28, fontWeight: 700, color: THEME.accent }}>{formatRest(rest.secondsLeft)}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <GhostButton onClick={() => rest.adjust(-15)} style={{ padding: "8px 10px" }}>-15s</GhostButton>
              <GhostButton onClick={() => rest.adjust(15)} style={{ padding: "8px 10px" }}>+15s</GhostButton>
              <GhostButton onClick={rest.stop} style={{ padding: "8px 10px" }}>Skip</GhostButton>
            </div>
          </div>
        </Card>
      )}

      {session.exercises.length === 0 ? (
        <Card><div style={{ textAlign: "center", color: THEME.textMuted, fontSize: 13, padding: "16px 8px" }}>Add your first exercise to get started.</div></Card>
      ) : (
        session.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            weightUnit={weightUnit}
            onUpdate={(patch) => updateExercise(ex.id, patch)}
            onRemove={() => removeExercise(ex.id)}
            onSetLogged={() => rest.start(restSeconds)}
            onOpenDetail={() => setDetailExercise(ex.name)}
          />
        ))
      )}

      <GhostButton icon={Plus} onClick={() => setPickerOpen(true)} style={{ width: "100%" }}>Add exercise</GhostButton>

      {pickerOpen && <ExercisePicker library={exerciseLibrary} onPick={addExerciseFromLibrary} onClose={() => setPickerOpen(false)} />}
      {detailExercise && (
        <ExerciseDetail exerciseName={detailExercise} workoutLog={workoutLog} weightUnit={weightUnit} onClose={() => setDetailExercise(null)} />
      )}
    </div>
  );
}
