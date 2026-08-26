import React, { useState } from "react";
import { X, FileUp, Upload, Check, ArrowLeft } from "lucide-react";
import { THEME, lbToKg } from "../lib/core";
import { Card, GhostButton, PrimaryButton, MapField, IconButton } from "../components/ui";
import { guessColumn, parseFlexibleDate, parseSpreadsheetFile } from "../lib/importHelpers";

// Weight/progress import — e.g. MyFitnessPal's "Your Progress.csv" export.
export function ImportModal({ onClose, onImportWeight }) {
  const [stage, setStage] = useState("pick");
  const [fileName, setFileName] = useState("");
  const [sheetHandle, setSheetHandle] = useState(null);
  const [sheetName, setSheetName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({ date: "", weight: "" });
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
      setError("Couldn't read that file. Make sure it's a .csv or .xlsx with a date and weight column.");
    }
  };

  const loadSheet = (handle, name) => {
    const { headers: h, rows: r } = handle.getSheet(name);
    setHeaders(h);
    setRows(r);
    setMapping({
      date: guessColumn(h, ["date"]),
      weight: guessColumn(h, ["weight"], ["bodyfat"]),
    });
    setStage("map");
  };

  const runImport = () => {
    if (!mapping.date) { setError("Pick which column holds the date."); return; }
    if (!mapping.weight) { setError("Pick the weight column."); return; }
    setError("");

    const entries = [];
    rows.forEach((row) => {
      const date = parseFlexibleDate(row[mapping.date]);
      const raw = parseFloat(row[mapping.weight]);
      if (!date || !raw) return;
      entries.push({ date, weightKg: weightUnitOfFile === "lb" ? lbToKg(raw) : raw });
    });
    onImportWeight(entries);
    setResultMsg(`Imported ${entries.length} weigh-in${entries.length === 1 ? "" : "s"}.`);
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
            <span style={{ fontSize: 15, fontWeight: 700, color: THEME.text }}>Import weight data</span>
          </div>
          <IconButton icon={X} onClick={onClose} />
        </div>

        {stage === "pick" && (
          <div>
            <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
              Upload a CSV or XLSX with weigh-in history — e.g. MyFitnessPal's "Your Progress" export.
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
            <MapField label="Date column" value={mapping.date} onChange={(v) => setMapping({ ...mapping, date: v })} headers={headers} />
            <MapField label="Weight column" value={mapping.weight} onChange={(v) => setMapping({ ...mapping, weight: v })} headers={headers} />
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
