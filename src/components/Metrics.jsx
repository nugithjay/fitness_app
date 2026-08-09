import React from "react";
import { THEME, clamp, round0, round1 } from "../lib/core";
import { Card } from "./ui";

export function CalorieRing({ consumed, goal }) {
  const pct = goal > 0 ? clamp(consumed / goal, 0, 1) : 0;
  const r = 72;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const over = consumed > goal;
  const remaining = Math.max(goal - consumed, 0);
  const ticks = [0, 0.25, 0.5, 0.75];

  return (
    <div style={{ position: "relative", width: 190, height: 190, margin: "0 auto" }}>
      <svg width="190" height="190" viewBox="0 0 190 190">
        <circle cx="95" cy="95" r={r} fill="none" stroke={THEME.surfaceHigh} strokeWidth="14" />
        {ticks.map((t) => {
          const angle = -90 + t * 360;
          const rad = (angle * Math.PI) / 180;
          const x1 = 95 + (r - 11) * Math.cos(rad);
          const y1 = 95 + (r - 11) * Math.sin(rad);
          const x2 = 95 + (r + 11) * Math.cos(rad);
          const y2 = 95 + (r + 11) * Math.sin(rad);
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke={THEME.bg} strokeWidth="2" />;
        })}
        <circle
          cx="95" cy="95" r={r} fill="none"
          stroke={over ? THEME.danger : THEME.accent} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`} transform="rotate(-90 95 95)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: THEME.mono, fontSize: 34, fontWeight: 600, color: THEME.text, fontVariantNumeric: "tabular-nums" }}>
          {over ? `+${round0(consumed - goal)}` : round0(remaining)}
        </div>
        <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: THEME.textMuted, marginTop: 3 }}>
          {over ? "over goal" : "kcal left"}
        </div>
        <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 8, fontFamily: THEME.mono }}>
          {round0(consumed)} / {round0(goal)}
        </div>
      </div>
    </div>
  );
}

export function MacroBar({ label, consumed, goal, color, unit = "g" }) {
  const pct = goal > 0 ? clamp((consumed / goal) * 100, 0, 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: THEME.textMuted, marginBottom: 5 }}>
        <span style={{ color: THEME.text, fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: THEME.mono }}>{round1(consumed)}{unit} / {goal}{unit}</span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: THEME.surfaceHigh, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

export const StatCard = ({ label, value, sub }) => (
  <Card style={{ flex: 1, padding: 12 }}>
    <div style={{ fontSize: 10.5, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
    <div style={{ fontFamily: THEME.mono, fontSize: 19, fontWeight: 700, color: THEME.text, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 10.5, color: THEME.textMuted, marginTop: 2 }}>{sub}</div>}
  </Card>
);

export const chartTooltipStyle = { backgroundColor: THEME.surfaceHigh, border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 12, color: THEME.text };
