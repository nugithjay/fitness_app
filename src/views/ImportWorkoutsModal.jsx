import React, { useState } from "react";
import { X, FileUp, Upload, Check, ArrowLeft } from "lucide-react";
import { THEME, uid, round1, toKg } from "../lib/core";
import { Card, GhostButton, PrimaryButton, MapField, IconButton } from "../components/ui";
import { normHeader, guessColumn, parseFlexibleDate, parseSpreadsheetFile } from "../lib/importHelpers";

export function ImportWorkoutsModal({ onClose, onImportWorkouts, onImportTemplates }) {
  const [stage, setStage] = useState("pick");
  const [fileName, setFileName] = useState("");
  const [sheetHandle, setSheetHandle] = useState(null);
  const [sheetName, setSheetName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({ date: "", workout: "", exercise: "", weight: "", reps: "" });
  const [weightUnitOfFile, setWeightUnitOfFile] = useState("kg");
  const [error, setError] = useState("");
  const [resultMsg, setResultMsg] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setFileName(file.name);
    try {
      const handle = await parseSpreadsheetFile(file);
      setSheetHandle(handle);
      if (handle.sheetNames && handle.sheetNames.length > 1) {
        setSheetName(handle.sheetNames[0]);
        setStage("sheet");
      } else {
        loadSheet(handle, handle.sheetNames ? handle.sheetNames[0] : null);
      }
    } catch (err) {
      setError("Couldn't read that file. Make sure it's the CSV exported from Strong's Settings > Export Data.");
    }
  };

  const loadSheet = (handle, name) => {
    const { headers: h, rows: r } = handle.getSheet(name);
    setHeaders(h);
    setRows(r);
    setMapping({
      date: guessColumn(h, ["date"]),
      workout: guessColumn(h, ["workoutname", "workout"]),
      exercise: guessColumn(h, ["exercisename", "exercise"]),
      weight: guessColumn(h, ["weight"], ["unit"]),
      reps: guessColumn(h, ["reps", "rep"]),
    });
    // guess the file's weight unit from a "Weight Unit" column if one exists
    const unitCol = guessColumn(h, ["weightunit", "unit"]);
    if (unitCol && r.length) {
      const sample = String(r[0][unitCol] || "").toLowerCase();
      if (sample.includes("lb")) setWeightUnitOfFile("lb");
    }
    setStage("map");
  };

  const runImport = () => {
    if (!mapping.date || !mapping.workout || !mapping.exercise || !mapping.weight || !mapping.reps) {
      setError("Every field needs a column selected.");
      return;
    }
    setError("");

    // Group rows into sessions (date + workout name), preserving set order,
    // and within each session group consecutive/all sets by exercise name.
    const sessions = new Map(); // key: date|workoutName -> { date, name, exerciseOrder: [], exercises: Map(name -> sets[]) }
    rows.forEach((row) => {
      const date = parseFlexibleDate(row[mapping.date]);
      const workoutName = String(row[mapping.workout] || "Workout").trim();
      const exerciseName = String(row[mapping.exercise] || "").trim();
      const reps = parseInt(row[mapping.reps], 10);
      const weightRaw = parseFloat(row[mapping.weight]);
      if (!date || !exerciseName || !reps) return;
      const key = `${date}|||${workoutName}`;
      if (!sessions.has(key)) sessions.set(key, { date, name: workoutName, exerciseOrder: [], exercises: new Map() });
      const session = sessions.get(key);
      if (!session.exercises.has(exerciseName)) {
        session.exercises.set(exerciseName, []);
        session.exerciseOrder.push(exerciseName);
      }
      const weightKg = isNaN(weightRaw) ? 0 : toKg(weightRaw, weightUnitOfFile);
      session.exercises.get(exerciseName).push({ reps, weightKg: round1(weightKg) });
    });

    const workouts = Array.from(sessions.values()).map((s) => ({
      id: uid(),
      date: s.date,
      type: "strength",
      name: s.name,
      exercises: s.exerciseOrder.map((name) => ({ name, sets: s.exercises.get(name) })),
    }));

    // Derive templates: one per distinct workout name, using its most recent session's exercise list.
    const byName = new Map();
    workouts.forEach((w) => {
      const existing = byName.get(w.name);
      if (!existing || w.date > existing.date) byName.set(w.name, w);
    });
    const templates = Array.from(byName.values()).map((w) => ({
      id: uid(),
      name: w.name,
      exercises: w.exercises.map((ex) => ({ name: ex.name, setCount: ex.sets.length })),
    }));

    onImportWorkouts(workouts);
    onImportTemplates(templates);
    setResultMsg(`Imported ${workouts.length} workout${workouts.length === 1 ? "" : "s"} and created ${templates.length} template${templates.length === 1 ? "" : "s"} you can start from.`);
    setStage("done");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 60, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div
        style={{ background: THEME.bg, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxHeight: "88vh", overflowY: "auto", border: `1px solid ${THEME.border}`, borderBottom: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {stage !== "pick" && stage !== "done" && (
              <IconButton icon={ArrowLeft} onClick={() => setStage(sheetHandle && sheetHandle.sheetNames && sheetHandle.sheetNames.length > 1 ? "sheet" : "pick")} />
            )}
            <span style={{ fontSize: 15, fontWeight: 700, color: THEME.text }}>Import from Strong</span>
          </div>
          <IconButton icon={X} onClick={onClose} />
        </div>

        {stage === "pick" && (
          <div>
            <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
              In Strong: Settings → Export Data. Upload the CSV it gives you — it's one row per set, so this may take a moment to process.
            </div>
            <label style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: THEME.surfaceHigh, border: `1.5px dashed ${THEME.border}`, borderRadius: 12,
              padding: "28px 16px", cursor: "pointer", color: THEME.textMuted, fontSize: 13, fontWeight: 600,
            }}>
              <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={handleFile} />
              <FileUp size={18} />
              Choose file
            </label>
            {error && <div style={{ fontSize: 12, color: THEME.danger, marginTop: 10 }}>{error}</div>}
          </div>
        )}

        {stage === "sheet" && sheetHandle && (
          <div>
            <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 12 }}>{fileName} has multiple sheets — pick the one to import.</div>
            <MapField label="Sheet" value={sheetName} onChange={setSheetName} headers={sheetHandle.sheetNames} />
            <PrimaryButton onClick={() => loadSheet(sheetHandle, sheetName)}>Continue</PrimaryButton>
          </div>
        )}

        {stage === "map" && (
          <div>
            <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12 }}>{fileName} · {rows.length} set rows found</div>
            <MapField label="Date column" value={mapping.date} onChange={(v) => setMapping({ ...mapping, date: v })} headers={headers} />
            <MapField label="Workout name column" value={mapping.workout} onChange={(v) => setMapping({ ...mapping, workout: v })} headers={headers} />
            <MapField label="Exercise name column" value={mapping.exercise} onChange={(v) => setMapping({ ...mapping, exercise: v })} headers={headers} />
            <MapField label="Weight column" value={mapping.weight} onChange={(v) => setMapping({ ...mapping, weight: v })} headers={headers} />
            <MapField label="Reps column" value={mapping.reps} onChange={(v) => setMapping({ ...mapping, reps: v })} headers={headers} />
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 5 }}>Weight values in this file are in</div>
              <div style={{ display: "flex", gap: 8 }}>
                <GhostButton active={weightUnitOfFile === "kg"} onClick={() => setWeightUnitOfFile("kg")} style={{ flex: 1 }}>kg</GhostButton>
                <GhostButton active={weightUnitOfFile === "lb"} onClick={() => setWeightUnitOfFile("lb")} style={{ flex: 1 }}>lb</GhostButton>
              </div>
            </div>
            {error && <div style={{ fontSize: 12, color: THEME.danger, marginBottom: 10 }}>{error}</div>}
            <PrimaryButton icon={Upload} onClick={runImport}>Import</PrimaryButton>
          </div>
        )}

        {stage === "done" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: THEME.surfaceHigh, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Check size={22} color={THEME.success} />
              </div>
              <div style={{ fontSize: 14, color: THEME.text, textAlign: "center" }}>{resultMsg}</div>
            </div>
            <PrimaryButton onClick={onClose}>Done</PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}
