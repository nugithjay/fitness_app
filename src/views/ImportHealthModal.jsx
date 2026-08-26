import React, { useState } from "react";
import { X, FileUp, Check, Loader2 } from "lucide-react";
import { THEME } from "../lib/core";
import { PrimaryButton, IconButton } from "../components/ui";
import { parseAppleHealthExport } from "../lib/appleHealth";

export function ImportHealthModal({ onClose, onImportHealth }) {
  const [stage, setStage] = useState("pick"); // pick | loading | done | error
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [resultMsg, setResultMsg] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setStage("loading");
    setError("");
    // let the loading state paint before the heavy synchronous scan runs
    await new Promise((r) => setTimeout(r, 30));
    try {
      const { daily, garminRecordsUsed, daysFound } = await parseAppleHealthExport(file);
      if (daysFound === 0) {
        setError("No Garmin-sourced records found in this file. Make sure you exported from the Health app (profile icon → Export All Health Data) and that Garmin Connect is syncing into Apple Health (Health app → Browse → check under each metric's Data Sources).");
        setStage("pick");
        return;
      }
      onImportHealth(daily);
      setResultMsg(`Imported ${garminRecordsUsed} Garmin records across ${daysFound} day${daysFound === 1 ? "" : "s"}.`);
      setStage("done");
    } catch (err) {
      console.error(err);
      setError("Couldn't read that file — make sure it's the export.xml from your Apple Health export (unzipped).");
      setStage("pick");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 60, display: "flex", alignItems: "flex-end" }} onClick={stage === "loading" ? undefined : onClose}>
      <div
        style={{ background: THEME.bg, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxHeight: "88vh", overflowY: "auto", border: `1px solid ${THEME.border}`, borderBottom: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: THEME.text }}>Import Garmin health data</span>
          {stage !== "loading" && <IconButton icon={X} onClick={onClose} />}
        </div>

        {stage === "pick" && (
          <div>
            <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 14, lineHeight: 1.6 }}>
              On your iPhone: <strong>Health app → tap your profile picture (top right) → Export All Health Data</strong>.
              That downloads a zip — unzip it (Files app: tap the zip to extract), then upload the <strong>export.xml</strong> file here.
              <br /><br />
              This pulls steps, resting heart rate, sleep, SpO2, and heart rate variability — only the records Garmin Connect wrote in. Body Battery and Stress score aren't in Apple Health, so those won't come through.
            </div>
            <label style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: THEME.surfaceHigh, border: `1.5px dashed ${THEME.border}`, borderRadius: 12,
              padding: "28px 16px", cursor: "pointer", color: THEME.textMuted, fontSize: 13, fontWeight: 600,
            }}>
              <input type="file" accept=".xml" style={{ display: "none" }} onChange={handleFile} />
              <FileUp size={18} />
              Choose export.xml
            </label>
            {error && <div style={{ fontSize: 12, color: THEME.danger, marginTop: 10, lineHeight: 1.5 }}>{error}</div>}
          </div>
        )}

        {stage === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 0", gap: 12 }}>
            <Loader2 size={26} color={THEME.accent} className="spin" />
            <div style={{ fontSize: 13, color: THEME.textMuted, textAlign: "center" }}>
              Scanning {fileName || "your export"}… large files can take a minute.
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
            <PrimaryButton onClick={onClose}>Done</PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}
