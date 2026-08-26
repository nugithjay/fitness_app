import React from "react";
import { Settings } from "lucide-react";
import { THEME } from "../lib/core";
import { IconButton } from "./ui";

export function Header({ activeTab, onOpenSettings }) {
  const titles = { today: "PLATE", stats: "Stats", import: "Import" };
  return (
    <div style={{
      padding: "16px 18px 12px", background: THEME.bg, borderBottom: `1px solid ${THEME.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid ${THEME.accent}` }} />
        <span style={{ fontFamily: THEME.mono, fontSize: 17, fontWeight: 700, letterSpacing: 2, color: THEME.text }}>
          {titles[activeTab]}
        </span>
      </div>
      <IconButton icon={Settings} onClick={onOpenSettings} title="Settings" />
    </div>
  );
}
