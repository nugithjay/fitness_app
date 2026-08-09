import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { X, FileUp, Upload, Check, ArrowLeft } from "lucide-react";
import { THEME, uid, round0, round1, lbToKg } from "../lib/core";
import { Card, SectionLabel, GhostButton, PrimaryButton, MapField, IconButton } from "../components/ui";

const normHeader = (h) => String(h || "").toLowerCase().replace(/[^a-z]/g, "");
function guessColumn(headers, keywords, excludeKeywords = []) {
  for (const h of headers) {
    const n = normHeader(h);
    if (keywords.some((k) => n.includes(k)) && !excludeKeywords.some((k) => n.includes(k))) return h;
  }
  return "";
}
function parseFlexibleDate(str) {
  if (!str) return null;
  const d = new Date(String(str).trim());
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
const MEAL_TIME_GUESS = { breakfast: "08:00", lunch: "12:30", dinner: "19:00", snack: "15:30", snacks: "15:30" };

async function parseSpreadsheetFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "xlsx" || ext === "xls") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    return {
      sheetNames: wb.SheetNames,
      getSheet: (name) => {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
        const headers = rows.length ? Object.keys(rows[0]) : [];
        return { headers, rows };
      },
    };
  }
  const text = await file.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  const headers = parsed.meta.fields || [];
  return { sheetNames: null, getSheet: () => ({ headers, rows: parsed.data }) };
}

export function ImportModal({ onClose, onImportFood, onImportWeight }) {
  const [stage, setStage] = useState("pick");
  const [fileName, setFileName] = useState("");
  const [sheetHandle, setSheetHandle] = useState(null);
  const [sheetName, setSheetName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [kind, setKind] = useState("food");
  const [mapping, setMapping] = useState({ date: "", name: "", calories: "", protein: "", carbs: "", fat: "", meal: "", weight: "" });
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
      setError("Couldn't read that file. Make sure it's a .csv or .xlsx exported from MyFitnessPal.");
    }
  };

  const loadSheet = (handle, name) => {
    const { headers: h, rows: r } = handle.getSheet(name);
    setHeaders(h);
    setRows(r);
    const guessedKind = h.some((x) => normHeader(x).includes("weight")) ? "weight" : "food";
    setKind(guessedKind);
    setMapping({
      date: guessColumn(h, ["date"]),
      name: guessColumn(h, ["food", "item", "description", "name"]),
      calories: guessColumn(h, ["calorie", "kcal", "energy"]),
      protein: guessColumn(h, ["protein"]),
      carbs: guessColumn(h, ["carb"]),
      fat: guessColumn(h, ["fat"], ["saturated", "trans", "poly", "mono"]),
      meal: guessColumn(h, ["meal"]),
      weight: guessColumn(h, ["weight"], ["bodyfat"]),
    });
    setStage("map");
  };

  const runImport = () => {
    if (!mapping.date) { setError("Pick which column holds the date."); return; }
    if (kind === "food" && (!mapping.name || !mapping.calories)) { setError("Pick the food name and calories columns."); return; }
    if (kind === "weight" && !mapping.weight) { setError("Pick the weight column."); return; }
    setError("");

    if (kind === "food") {
      const byDate = {};
      let count = 0;
      rows.forEach((row) => {
        const date = parseFlexibleDate(row[mapping.date]);
        const cal = parseFloat(row[mapping.calories]);
        if (!date || !cal) return;
        const mealKey = mapping.meal ? String(row[mapping.meal] || "").toLowerCase().trim() : "";
        byDate[date] = byDate[date] || [];
        byDate[date].push({
          id: uid(),
          time: MEAL_TIME_GUESS[mealKey] || "12:00",
          name: row[mapping.name] || "Imported food",
          brand: "",
          calories: round0(cal),
          protein: mapping.protein ? round1(parseFloat(row[mapping.protein]) || 0) : 0,
          carbs: mapping.carbs ? round1(parseFloat(row[mapping.carbs]) || 0) : 0,
          fat: mapping.fat ? round1(parseFloat(row[mapping.fat]) || 0) : 0,
          source: "import",
        });
        count++;
      });
      onImportFood(byDate);
      setResultMsg(`Imported ${count} food entr${count === 1 ? "y" : "ies"} across ${Object.keys(byDate).length} day${Object.keys(byDate).length === 1 ? "" : "s"}.`);
    } else {
      const entries = [];
      rows.forEach((row) => {
        const date = parseFlexibleDate(row[mapping.date]);
        const raw = parseFloat(row[mapping.weight]);
        if (!date || !raw) return;
        entries.push({ date, weightKg: weightUnitOfFile === "lb" ? lbToKg(raw) : raw });
      });
      onImportWeight(entries);
      setResultMsg(`Imported ${entries.length} weigh-in${entries.length === 1 ? "" : "s"}.`);
    }
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
            <span style={{ fontSize: 15, fontWeight: 700, color: THEME.text }}>Import data</span>
          </div>
          <IconButton icon={X} onClick={onClose} />
        </div>

        {stage === "pick" && (
          <div>
            <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
              Upload a CSV or XLSX file from your MyFitnessPal export — "Your Nutrition" for meals, or "Your Progress" for weight. Import one file at a time.
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
            <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 12 }}>
              {fileName} has multiple sheets — pick the one to import.
            </div>
            <MapField label="Sheet" value={sheetName} onChange={setSheetName} headers={sheetHandle.sheetNames} />
            <PrimaryButton onClick={() => loadSheet(sheetHandle, sheetName)}>Continue</PrimaryButton>
          </div>
        )}

        {stage === "map" && (
          <div>
            <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12 }}>{fileName} · {rows.length} rows found</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <GhostButton active={kind === "food"} onClick={() => setKind("food")} style={{ flex: 1 }}>Food diary</GhostButton>
              <GhostButton active={kind === "weight"} onClick={() => setKind("weight")} style={{ flex: 1 }}>Weight / progress</GhostButton>
            </div>

            <MapField label="Date column" value={mapping.date} onChange={(v) => setMapping({ ...mapping, date: v })} headers={headers} />

            {kind === "food" ? (
              <>
                <MapField label="Food name column" value={mapping.name} onChange={(v) => setMapping({ ...mapping, name: v })} headers={headers} />
                <MapField label="Calories column" value={mapping.calories} onChange={(v) => setMapping({ ...mapping, calories: v })} headers={headers} />
                <MapField label="Protein column" value={mapping.protein} onChange={(v) => setMapping({ ...mapping, protein: v })} headers={headers} optional />
                <MapField label="Carbs column" value={mapping.carbs} onChange={(v) => setMapping({ ...mapping, carbs: v })} headers={headers} optional />
                <MapField label="Fat column" value={mapping.fat} onChange={(v) => setMapping({ ...mapping, fat: v })} headers={headers} optional />
                <MapField label="Meal column (for rough time-of-day)" value={mapping.meal} onChange={(v) => setMapping({ ...mapping, meal: v })} headers={headers} optional />
              </>
            ) : (
              <>
                <MapField label="Weight column" value={mapping.weight} onChange={(v) => setMapping({ ...mapping, weight: v })} headers={headers} />
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 5 }}>Weight values in this file are in</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <GhostButton active={weightUnitOfFile === "kg"} onClick={() => setWeightUnitOfFile("kg")} style={{ flex: 1 }}>kg</GhostButton>
                    <GhostButton active={weightUnitOfFile === "lb"} onClick={() => setWeightUnitOfFile("lb")} style={{ flex: 1 }}>lb</GhostButton>
                  </div>
                </div>
              </>
            )}

            {error && <div style={{ fontSize: 12, color: THEME.danger, marginBottom: 10 }}>{error}</div>}
            <PrimaryButton icon={Upload} onClick={runImport}>Import</PrimaryButton>
            <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 10, lineHeight: 1.5 }}>
              If dates come out wrong afterward, your file may use day/month order rather than month/day — let me know and I'll fix the parsing.
            </div>
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
            <div style={{ display: "flex", gap: 8 }}>
              <GhostButton onClick={() => { setStage("pick"); setFileName(""); setRows([]); setHeaders([]); setError(""); }} style={{ flex: 1 }}>Import another file</GhostButton>
              <PrimaryButton onClick={onClose} style={{ flex: 1 }}>Done</PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
