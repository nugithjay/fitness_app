import React from "react";
import { Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { THEME, formatDateLabel } from "../lib/core";
import { IconButton } from "./ui";

export function Header({ activeTab, selectedDate, onNavDate, onOpenSettings }) {
  const titles = { today: "PLATE", food: "Add food", workouts: "Workouts", progress: "Progress" };
  return (
    <div style={{
      padding: "16px 18px 12px", background: THEME.bg, borderBottom: `1px solid ${THEME.border}`,
      display: "flex", flexDirection: "column", gap: 10, flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid ${THEME.accent}` }} />
          <span style={{ fontFamily: THEME.mono, fontSize: 17, fontWeight: 700, letterSpacing: 2, color: THEME.text }}>
            {titles[activeTab]}
          </span>
        </div>
        <IconButton icon={Settings} onClick={onOpenSettings} title="Goals & settings" />
      </div>
      {activeTab === "today" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <IconButton icon={ChevronLeft} onClick={() => onNavDate(-1)} title="Previous day" />
          <div style={{ fontSize: 14, fontWeight: 600, color: THEME.text }}>{formatDateLabel(selectedDate)}</div>
          <IconButton icon={ChevronRight} onClick={() => onNavDate(1)} title="Next day" />
        </div>
      )}
    </div>
  );
}
