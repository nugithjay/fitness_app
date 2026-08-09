import React, { useState } from "react";
import { Scale, Pencil, Check, Trash2, Plus } from "lucide-react";
import { THEME, round0, round1, formatDateLabel, toKg, displayWeight } from "../lib/core";
import { Card, SectionLabel, GhostButton, FieldInput, IconButton, EmptyState } from "../components/ui";
import { CalorieRing, MacroBar } from "../components/Metrics";

function FoodEntryRow({ entry, onDelete }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${THEME.border}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: THEME.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {entry.name}
        </div>
        <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2, fontFamily: THEME.mono }}>
          {entry.time} · P{round1(entry.protein)} C{round1(entry.carbs)} F{round1(entry.fat)}
        </div>
      </div>
      <div style={{ fontFamily: THEME.mono, fontSize: 14, fontWeight: 700, color: THEME.text, marginRight: 6 }}>
        {round0(entry.calories)}
      </div>
      <IconButton icon={Trash2} color={THEME.textMuted} onClick={() => onDelete(entry.id)} title="Remove" />
    </div>
  );
}

export function TodayView({ date, foodLog, weightLog, profile, onDeleteFood, onLogWeight, goToFood }) {
  const entries = foodLog[date] || [];
  const totals = entries.reduce((acc, e) => ({
    calories: acc.calories + Number(e.calories || 0),
    protein: acc.protein + Number(e.protein || 0),
    carbs: acc.carbs + Number(e.carbs || 0),
    fat: acc.fat + Number(e.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const todayWeightEntry = weightLog.find((w) => w.date === date);
  const latestWeight = [...weightLog].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const [weightInput, setWeightInput] = useState("");
  const [editingWeight, setEditingWeight] = useState(false);

  const submitWeight = () => {
    const v = parseFloat(weightInput);
    if (!v || v <= 0) return;
    onLogWeight(date, toKg(v, profile.weightUnit));
    setWeightInput("");
    setEditingWeight(false);
  };

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CalorieRing consumed={totals.calories} goal={profile.goalCalories} />
        <div style={{ marginTop: 20 }}>
          <MacroBar label="Protein" consumed={totals.protein} goal={profile.goalProtein} color={THEME.protein} />
          <MacroBar label="Carbs" consumed={totals.carbs} goal={profile.goalCarbs} color={THEME.carbs} />
          <MacroBar label="Fat" consumed={totals.fat} goal={profile.goalFat} color={THEME.fat} />
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Scale size={16} color={THEME.textMuted} />
            <span style={{ fontSize: 13, color: THEME.textMuted }}>
              {todayWeightEntry ? "Today's weigh-in" : latestWeight ? `Last: ${formatDateLabel(latestWeight.date)}` : "No weigh-ins yet"}
            </span>
          </div>
          {!editingWeight && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {(todayWeightEntry || latestWeight) && (
                <span style={{ fontFamily: THEME.mono, fontSize: 16, fontWeight: 700, color: THEME.text }}>
                  {displayWeight((todayWeightEntry || latestWeight).weightKg, profile.weightUnit)} {profile.weightUnit}
                </span>
              )}
              <IconButton icon={Pencil} onClick={() => setEditingWeight(true)} title="Log weight" />
            </div>
          )}
        </div>
        {editingWeight && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <FieldInput
              value={weightInput}
              onChange={setWeightInput}
              type="number"
              inputMode="decimal"
              placeholder={`Weight in ${profile.weightUnit}`}
              unit={profile.weightUnit}
            />
            <button onClick={submitWeight} style={{ background: THEME.accent, border: "none", borderRadius: 10, padding: "0 16px", color: "#1A1408", cursor: "pointer" }}>
              <Check size={18} />
            </button>
          </div>
        )}
      </Card>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <SectionLabel>Meals logged</SectionLabel>
          <GhostButton icon={Plus} onClick={goToFood}>Add food</GhostButton>
        </div>
        <Card style={{ padding: entries.length ? "0 16px" : 16 }}>
          {entries.length === 0 ? (
            <EmptyState text="Nothing logged for this day yet. Scan a barcode, search, or add a meal manually from the Food tab." />
          ) : (
            entries
              .slice()
              .sort((a, b) => (a.time < b.time ? -1 : 1))
              .map((e) => <FoodEntryRow key={e.id} entry={e} onDelete={(id) => onDeleteFood(date, id)} />)
          )}
        </Card>
      </div>
    </div>
  );
}
