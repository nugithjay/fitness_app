import React from "react";
import { Dumbbell, Activity, HeartPulse, Scale } from "lucide-react";
import { THEME } from "../lib/core";
import { Card, SectionLabel } from "../components/ui";

const ImportCard = ({ icon: Icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
      background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 14,
      padding: 16, cursor: "pointer", marginBottom: 10,
    }}
  >
    <div style={{
      width: 40, height: 40, borderRadius: 10, background: THEME.surfaceHigh,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={19} color={THEME.accent} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text }}>{title}</div>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>{description}</div>
    </div>
  </button>
);

export function ImportView({ onOpenImportStrong, onOpenImportGarmin, onOpenImportHealth, onOpenImportWeight }) {
  return (
    <div style={{ padding: 16 }}>
      <SectionLabel>Workouts</SectionLabel>
      <ImportCard
        icon={Dumbbell} title="From Strong" description="Settings → Export Data in the Strong app"
        onClick={onOpenImportStrong}
      />
      <ImportCard
        icon={Activity} title="From Garmin (activities)" description="connect.garmin.com → Activities → Export CSV"
        onClick={onOpenImportGarmin}
      />

      <div style={{ marginTop: 20 }}>
        <SectionLabel>Health</SectionLabel>
        <ImportCard
          icon={HeartPulse} title="From Garmin (steps, sleep, HR)" description="Apple Health app → Export All Health Data"
          onClick={onOpenImportHealth}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <SectionLabel>Weight</SectionLabel>
        <ImportCard
          icon={Scale} title="Weight history" description="Any CSV/XLSX with a date and weight column"
          onClick={onOpenImportWeight}
        />
      </div>
    </div>
  );
}
