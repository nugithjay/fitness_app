import React, { useState, useMemo } from "react";
import { X, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { THEME, round1, displayWeight, shortLabel } from "../lib/core";
import { getExerciseHistory, getExerciseRecords } from "../lib/exerciseLibrary";
import { GhostButton, IconButton, EmptyState } from "./ui";
import { chartTooltipStyle } from "./Metrics";

export function ExerciseDetail({ exerciseName, workoutLog, weightUnit, onClose }) {
  const [tab, setTab] = useState("history");
  const history = useMemo(() => getExerciseHistory(workoutLog, exerciseName), [workoutLog, exerciseName]);
  const records = useMemo(() => getExerciseRecords(workoutLog, exerciseName), [workoutLog, exerciseName]);

  const chartData = useMemo(() => (
    [...history].reverse().map((h) => ({
      date: shortLabel(h.date),
      e1rm: Math.round(displayWeight(Math.max(...h.sets.map((s) => s.weightKg * (1 + s.reps / 30))), weightUnit)),
    }))
  ), [history, weightUnit]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 80, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div
        style={{ background: THEME.bg, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxHeight: "85vh", overflowY: "auto", border: `1px solid ${THEME.border}`, borderBottom: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: THEME.text, paddingRight: 12 }}>{exerciseName}</span>
          <IconButton icon={X} onClick={onClose} />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <GhostButton active={tab === "history"} onClick={() => setTab("history")} style={{ flex: 1 }}>History</GhostButton>
          <GhostButton active={tab === "records"} onClick={() => setTab("records")} style={{ flex: 1 }}>Records</GhostButton>
        </div>

        {tab === "records" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 10, color: THEME.textMuted, textTransform: "uppercase" }}>Best weight</div>
                <div style={{ fontFamily: THEME.mono, fontSize: 18, fontWeight: 700, color: THEME.text, marginTop: 4 }}>
                  {records.bestWeightKg ? `${displayWeight(records.bestWeightKg, weightUnit)}${weightUnit}` : "—"}
                </div>
              </div>
              <div style={{ flex: 1, background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 10, color: THEME.textMuted, textTransform: "uppercase" }}>Est. 1RM</div>
                <div style={{ fontFamily: THEME.mono, fontSize: 18, fontWeight: 700, color: THEME.accent, marginTop: 4 }}>
                  {records.bestE1rm ? `${round1(displayWeight(records.bestE1rm, weightUnit))}${weightUnit}` : "—"}
                </div>
              </div>
              <div style={{ flex: 1, background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 10, color: THEME.textMuted, textTransform: "uppercase" }}>Best volume</div>
                <div style={{ fontFamily: THEME.mono, fontSize: 18, fontWeight: 700, color: THEME.text, marginTop: 4 }}>
                  {records.bestVolumeKg ? round1(displayWeight(records.bestVolumeKg, weightUnit)) : "—"}
                </div>
              </div>
            </div>

            {chartData.length >= 2 ? (
              <div style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: THEME.textMuted, marginBottom: 6 }}>
                  <TrendingUp size={13} /> Estimated 1RM over time
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                    <XAxis dataKey="date" tick={{ fill: THEME.textMuted, fontSize: 9 }} axisLine={{ stroke: THEME.border }} tickLine={false} />
                    <YAxis domain={["auto", "auto"]} tick={{ fill: THEME.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="e1rm" stroke={THEME.accent} strokeWidth={2.5} dot={{ r: 2.5, fill: THEME.accent }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text="Log this exercise a couple more times to see a progress chart." />
            )}
          </div>
        )}

        {tab === "history" && (
          history.length === 0 ? (
            <EmptyState text="No past sessions with this exercise yet." />
          ) : (
            <div>
              {history.map((h, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: i < history.length - 1 ? `1px solid ${THEME.border}` : "none" }}>
                  <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 4 }}>{h.date}</div>
                  <div style={{ fontSize: 13, color: THEME.text, fontFamily: THEME.mono }}>
                    {h.sets.map((s, j) => `${s.reps}×${round1(displayWeight(s.weightKg, weightUnit))}${weightUnit}`).join("  ·  ")}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
