import React, { useState } from "react";
import { X, FileUp, Upload, Check, ArrowLeft } from "lucide-react";
import { THEME, uid, round1 } from "../lib/core";
import { Card, GhostButton, PrimaryButton, MapField, IconButton } from "../components/ui";
import { normHeader, guessColumn, parseFlexibleDate, parseSpreadsheetFile } from "../lib/importHelpers";

// Parses "12.3 mi", "5 km", "6,345 ft" etc. down to a plain number in the given unit's base.
function parseNumeric(raw) {
  if (raw == null) return null;
  const n = parseFloat(String(raw).replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return isNaN(n) ? null : n;
}
// Garmin duration is often "hh:mm:ss" — convert to minutes.
function parseDurationToMinutes(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s); // already a plain number of minutes
  const parts = s.split(":").map((p) => parseFloat(p));
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  return null;
}

export function ImportGarminModal({ onClose, onImportWorkouts }) {
  const [stage, setStage] = useState("pick");
  const [fileName, setFileName] = useState("");
  const [sheetHandle, setSheetHandle] = useState(null);
  const [sheetName, setSheetName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({ date: "", activityType: "", duration: "", distance: "", calories: "", avgHR: "", maxHR: "" });
  const [distanceUnit, setDistanceUnit] = useState("km");
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
      setError("Couldn't read that file. Make sure it's the CSV from Garmin Connect's Activities page (gear icon → Export CSV).");
    }
  };

  const loadSheet = (handle, name) => {
    const { headers: h, rows: r } = handle.getSheet(name);
    setHeaders(h);
    setRows(r);
    setMapping({
      date: guessColumn(h, ["date"]),
      activityType: guessColumn(h, ["activitytype", "type", "activity"]),
      duration: guessColumn(h, ["time", "duration"], ["movingtime", "elapsedtime"]),
      distance: guessColumn(h, ["distance"]),
      calories: guessColumn(h, ["calorie"]),
      avgHR: guessColumn(h, ["avghr", "averageheartrate", "avgheartrate"]),
      maxHR: guessColumn(h, ["maxhr", "maxheartrate"]),
    });
    setStage("map");
  };

  const runImport = () => {
    if (!mapping.date || !mapping.activityType) {
      setError("Date and Activity Type columns are required.");
      return;
    }
    setError("");

    const workouts = [];
    rows.forEach((row) => {
      const date = parseFlexibleDate(row[mapping.date]);
      const name = String(row[mapping.activityType] || "Activity").trim();
      if (!date || !name) return;

      const durationMin = mapping.duration ? parseDurationToMinutes(row[mapping.duration]) : null;
      let distanceKm = mapping.distance ? parseNumeric(row[mapping.distance]) : null;
      if (distanceKm != null && distanceUnit === "mi") distanceKm = round1(distanceKm * 1.60934);
      const caloriesBurned = mapping.calories ? parseNumeric(row[mapping.calories]) : null;
      const avgHR = mapping.avgHR ? parseNumeric(row[mapping.avgHR]) : null;
      const maxHR = mapping.maxHR ? parseNumeric(row[mapping.maxHR]) : null;

      workouts.push({
        id: uid(), date, type: "cardio", name,
        durationMin: durationMin != null ? round1(durationMin) : null,
        distanceKm: distanceKm != null ? round1(distanceKm) : null,
        caloriesBurned: caloriesBurned != null ? Math.round(caloriesBurned) : null,
        avgHR: avgHR != null ? Math.round(avgHR) : null,
        maxHR: maxHR != null ? Math.round(maxHR) : null,
        source: "garmin",
      });
    });

    onImportWorkouts(workouts);
    setResultMsg(`Imported ${workouts.length} activit${workouts.length === 1 ? "y" : "ies"} from Garmin.`);
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
            <span style={{ fontSize: 15, fontWeight: 700, color: THEME.text }}>Import from Garmin</span>
          </div>
          <IconButton icon={X} onClick={onClose} />
        </div>

        {stage === "pick" && (
          <div>
            <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
              On connect.garmin.com (web, not the app): go to <strong>Activities</strong>, then the gear icon top-right → <strong>Export CSV</strong>. Upload that file here.
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
            <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12 }}>{fileName} · {rows.length} rows found</div>
            <MapField label="Date column" value={mapping.date} onChange={(v) => setMapping({ ...mapping, date: v })} headers={headers} />
            <MapField label="Activity type column" value={mapping.activityType} onChange={(v) => setMapping({ ...mapping, activityType: v })} headers={headers} />
            <MapField label="Duration column" value={mapping.duration} onChange={(v) => setMapping({ ...mapping, duration: v })} headers={headers} optional />
            <MapField label="Distance column" value={mapping.distance} onChange={(v) => setMapping({ ...mapping, distance: v })} headers={headers} optional />
            {mapping.distance && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 5 }}>Distance values in this file are in</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <GhostButton active={distanceUnit === "km"} onClick={() => setDistanceUnit("km")} style={{ flex: 1 }}>km</GhostButton>
                  <GhostButton active={distanceUnit === "mi"} onClick={() => setDistanceUnit("mi")} style={{ flex: 1 }}>miles</GhostButton>
                </div>
              </div>
            )}
            <MapField label="Calories column" value={mapping.calories} onChange={(v) => setMapping({ ...mapping, calories: v })} headers={headers} optional />
            <MapField label="Avg heart rate column" value={mapping.avgHR} onChange={(v) => setMapping({ ...mapping, avgHR: v })} headers={headers} optional />
            <MapField label="Max heart rate column" value={mapping.maxHR} onChange={(v) => setMapping({ ...mapping, maxHR: v })} headers={headers} optional />
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
