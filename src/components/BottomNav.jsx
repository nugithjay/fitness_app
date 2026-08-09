import React from "react";
import { Home, Utensils, Dumbbell, BarChart3 } from "lucide-react";
import { THEME } from "../lib/core";

export function BottomNav({ activeTab, setActiveTab }) {
  const items = [
    { id: "today", label: "Today", icon: Home },
    { id: "food", label: "Food", icon: Utensils },
    { id: "workouts", label: "Workouts", icon: Dumbbell },
    { id: "progress", label: "Progress", icon: BarChart3 },
  ];
  return (
    <div style={{
      display: "flex", borderTop: `1px solid ${THEME.border}`, background: THEME.bg,
      paddingBottom: "env(safe-area-inset-bottom, 6px)", flexShrink: 0,
    }}>
      {items.map((item) => {
        const active = activeTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              flex: 1, background: "transparent", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "10px 0 8px", color: active ? THEME.accent : THEME.textMuted,
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
