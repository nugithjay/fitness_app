import React, { useState } from "react";
import { X, Check, LogOut } from "lucide-react";
import { THEME } from "../lib/core";
import { Card, SectionLabel, GhostButton, PrimaryButton, IconButton } from "../components/ui";
import { supabase } from "../supabaseClient";

export function SettingsModal({ profile, onSave, onClose }) {
  const [local, setLocal] = useState(profile);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div
        style={{ background: THEME.bg, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxHeight: "85vh", overflowY: "auto", border: `1px solid ${THEME.border}`, borderBottom: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: THEME.text }}>Settings</span>
          <IconButton icon={X} onClick={onClose} />
        </div>

        <SectionLabel>Weight unit</SectionLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <GhostButton active={local.weightUnit === "kg"} onClick={() => setLocal({ ...local, weightUnit: "kg" })} style={{ flex: 1 }}>kg</GhostButton>
          <GhostButton active={local.weightUnit === "lb"} onClick={() => setLocal({ ...local, weightUnit: "lb" })} style={{ flex: 1 }}>lb</GhostButton>
        </div>

        <PrimaryButton icon={Check} onClick={() => onSave({ weightUnit: local.weightUnit })}>
          Save
        </PrimaryButton>

        <div style={{ marginTop: 18 }}>
          <GhostButton icon={LogOut} onClick={() => supabase.auth.signOut()} style={{ width: "100%" }}>Sign out</GhostButton>
        </div>
      </div>
    </div>
  );
}
