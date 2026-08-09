import React, { useState } from "react";
import { X, Check, Upload, LogOut, Dumbbell } from "lucide-react";
import { THEME, round0 } from "../lib/core";
import { Card, SectionLabel, GhostButton, PrimaryButton, FieldInput, IconButton } from "../components/ui";
import { supabase } from "../supabaseClient";

export function SettingsModal({ profile, onSave, onClose, onOpenImport, onOpenImportWorkouts }) {
  const [local, setLocal] = useState(profile);
  const computedCalories = round0(Number(local.goalProtein) * 4 + Number(local.goalCarbs) * 4 + Number(local.goalFat) * 9);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div
        style={{ background: THEME.bg, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxHeight: "85vh", overflowY: "auto", border: `1px solid ${THEME.border}`, borderBottom: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: THEME.text }}>Goals & settings</span>
          <IconButton icon={X} onClick={onClose} />
        </div>

        <SectionLabel>Weight unit</SectionLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <GhostButton active={local.weightUnit === "kg"} onClick={() => setLocal({ ...local, weightUnit: "kg" })} style={{ flex: 1 }}>kg</GhostButton>
          <GhostButton active={local.weightUnit === "lb"} onClick={() => setLocal({ ...local, weightUnit: "lb" })} style={{ flex: 1 }}>lb</GhostButton>
        </div>

        <SectionLabel>Daily targets</SectionLabel>
        <FieldInput label="Calories" value={local.goalCalories} onChange={(v) => setLocal({ ...local, goalCalories: v })} type="number" inputMode="decimal" unit="kcal" />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <FieldInput label="Protein" value={local.goalProtein} onChange={(v) => setLocal({ ...local, goalProtein: v })} type="number" inputMode="decimal" unit="g" />
          <FieldInput label="Carbs" value={local.goalCarbs} onChange={(v) => setLocal({ ...local, goalCarbs: v })} type="number" inputMode="decimal" unit="g" />
          <FieldInput label="Fat" value={local.goalFat} onChange={(v) => setLocal({ ...local, goalFat: v })} type="number" inputMode="decimal" unit="g" />
        </div>
        <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 8 }}>
          Macros above compute to {computedCalories} kcal/day.
        </div>

        <div style={{ marginTop: 18 }}>
          <SectionLabel>Default rest timer</SectionLabel>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {[60, 90, 120, 180].map((s) => (
              <GhostButton key={s} active={Number(local.restSeconds) === s} onClick={() => setLocal({ ...local, restSeconds: s })} style={{ flex: 1, padding: "8px 4px", fontSize: 12 }}>
                {s < 60 ? `${s}s` : s % 60 === 0 ? `${s / 60}m` : `${Math.floor(s / 60)}m${s % 60}s`}
              </GhostButton>
            ))}
          </div>
          <FieldInput value={local.restSeconds} onChange={(v) => setLocal({ ...local, restSeconds: v })} type="number" inputMode="numeric" unit="sec" />
        </div>

        <div style={{ marginTop: 20 }}>
          <PrimaryButton icon={Check} onClick={() => onSave({
            weightUnit: local.weightUnit,
            goalCalories: round0(local.goalCalories),
            goalProtein: round0(local.goalProtein),
            goalCarbs: round0(local.goalCarbs),
            goalFat: round0(local.goalFat),
            restSeconds: Math.max(10, round0(local.restSeconds)),
          })}>
            Save
          </PrimaryButton>
        </div>

        <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${THEME.border}` }}>
          <SectionLabel>Bring in old data</SectionLabel>
          <GhostButton icon={Upload} onClick={onOpenImport} style={{ width: "100%", marginBottom: 8 }}>Import from MyFitnessPal</GhostButton>
          <GhostButton icon={Dumbbell} onClick={onOpenImportWorkouts} style={{ width: "100%" }}>Import from Strong</GhostButton>
        </div>

        <div style={{ marginTop: 18 }}>
          <GhostButton icon={LogOut} onClick={() => supabase.auth.signOut()} style={{ width: "100%" }}>Sign out</GhostButton>
        </div>
      </div>
    </div>
  );
}
