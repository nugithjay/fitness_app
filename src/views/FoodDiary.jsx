import React, { useState } from "react";
import { Trash2, Plus, Utensils } from "lucide-react";
import { THEME, MEALS, round0, round1, guessMealFromTime } from "../lib/core";
import { Card, SectionLabel } from "../components/ui";
import { CalorieRing, MacroBar } from "../components/Metrics";
import { FoodEntrySheet, DirectEntryForm } from "../components/FoodEntrySheet";

function FoodEntryRow({ entry, onOpen, onDelete }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${THEME.border}` }}>
      <button onClick={() => onOpen(entry)} style={{ flex: 1, minWidth: 0, background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}>
        <div style={{ fontSize: 13.5, color: THEME.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {entry.name}
        </div>
        <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2, fontFamily: THEME.mono }}>
          P{round1(entry.protein)} C{round1(entry.carbs)} F{round1(entry.fat)}
        </div>
      </button>
      <div style={{ fontFamily: THEME.mono, fontSize: 14, fontWeight: 700, color: THEME.text, marginRight: 6 }}>
        {round0(entry.calories)}
      </div>
      <button onClick={() => onDelete(entry.id)} style={{ background: "none", border: "none", color: THEME.textMuted, cursor: "pointer", padding: 6 }}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function MealSection({ meal, entries, onOpenEntry, onDeleteFood, goToFoodLogging }) {
  const subtotal = entries.reduce((s, e) => s + Number(e.calories || 0), 0);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text }}>{meal}</span>
          {entries.length > 0 && (
            <span style={{ fontSize: 11.5, color: THEME.textMuted, fontFamily: THEME.mono }}>{round0(subtotal)} kcal</span>
          )}
        </div>
        <button
          onClick={() => goToFoodLogging(meal)}
          style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: "none", color: THEME.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 4 }}
        >
          <Plus size={13} /> Add
        </button>
      </div>
      <Card style={{ padding: entries.length ? "0 16px" : "10px 16px" }}>
        {entries.length === 0 ? (
          <div style={{ fontSize: 12, color: THEME.textMuted, padding: "6px 0" }}>Nothing logged yet</div>
        ) : (
          entries.map((e) => <FoodEntryRow key={e.id} entry={e} onOpen={onOpenEntry} onDelete={onDeleteFood} />)
        )}
      </Card>
    </div>
  );
}

export function FoodDiaryView({ date, foodLog, profile, onDeleteFood, onUpdateFood, goToFoodLogging }) {
  const [editingEntry, setEditingEntry] = useState(null);

  const entries = foodLog[date] || [];
  const totals = entries.reduce((acc, e) => ({
    calories: acc.calories + Number(e.calories || 0),
    protein: acc.protein + Number(e.protein || 0),
    carbs: acc.carbs + Number(e.carbs || 0),
    fat: acc.fat + Number(e.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const byMeal = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  entries.forEach((e) => {
    const meal = MEALS.includes(e.meal) ? e.meal : guessMealFromTime(e.time);
    byMeal[meal].push(e);
  });
  Object.keys(byMeal).forEach((m) => byMeal[m].sort((a, b) => (a.time < b.time ? -1 : 1)));

  const saveEdit = (updated) => {
    onUpdateFood(date, editingEntry.id, updated);
    setEditingEntry(null);
  };

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <button
        onClick={() => goToFoodLogging()}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
          background: THEME.accent, color: "#1A1408", border: "none", borderRadius: 14,
          padding: "14px 16px", fontSize: 15, fontWeight: 700, cursor: "pointer",
        }}
      >
        <Utensils size={17} /> Log food
      </button>

      <Card>
        <CalorieRing consumed={totals.calories} goal={profile.goalCalories} />
        <div style={{ marginTop: 20 }}>
          <MacroBar label="Protein" consumed={totals.protein} goal={profile.goalProtein} color={THEME.protein} />
          <MacroBar label="Carbs" consumed={totals.carbs} goal={profile.goalCarbs} color={THEME.carbs} />
          <MacroBar label="Fat" consumed={totals.fat} goal={profile.goalFat} color={THEME.fat} />
        </div>
      </Card>

      <div>
        <SectionLabel>Meals</SectionLabel>
        {MEALS.map((meal) => (
          <MealSection
            key={meal} meal={meal} entries={byMeal[meal]}
            onOpenEntry={setEditingEntry}
            onDeleteFood={(id) => onDeleteFood(date, id)}
            goToFoodLogging={goToFoodLogging}
          />
        ))}
      </div>

      {editingEntry && (
        editingEntry.per100 ? (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 60, display: "flex", alignItems: "flex-end" }} onClick={() => setEditingEntry(null)}>
            <div style={{ width: "100%", padding: 16 }} onClick={(e) => e.stopPropagation()}>
              <FoodEntrySheet
                name={editingEntry.name} brand={editingEntry.brand} per100={editingEntry.per100}
                servingGrams={editingEntry.servingGrams} initialQtyGrams={editingEntry.qtyGrams}
                submitLabel="save"
                onCancel={() => setEditingEntry(null)}
                onSubmit={(scaled, qtyGrams) => saveEdit({ ...scaled, qtyGrams })}
              />
            </div>
          </div>
        ) : (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 60, display: "flex", alignItems: "flex-end" }} onClick={() => setEditingEntry(null)}>
            <div style={{ width: "100%", padding: 16 }} onClick={(e) => e.stopPropagation()}>
              <DirectEntryForm initial={editingEntry} submitLabel="save" onSubmit={saveEdit} />
            </div>
          </div>
        )
      )}
    </div>
  );
}
