import React, { useState } from "react";
import { X, Plus, Check } from "lucide-react";
import { THEME, round0, round1 } from "../lib/core";
import { Card, GhostButton, FieldInput, IconButton } from "./ui";

// per100 + servingGrams known → real rescaling (barcode/database items).
// Used both when adding a new item and when editing an already-logged one.
export function FoodEntrySheet({ name, brand, per100, servingGrams, initialQtyGrams, onSubmit, onCancel, submitLabel }) {
  const hasServing = !!servingGrams;
  const [unit, setUnit] = useState(hasServing && !initialQtyGrams ? "serving" : "grams");
  const [amount, setAmount] = useState(() => {
    if (initialQtyGrams) return hasServing ? String(round1(initialQtyGrams / servingGrams)) : String(initialQtyGrams);
    return hasServing ? "1" : "100";
  });

  const qtyGrams = unit === "serving" ? (parseFloat(amount) || 0) * servingGrams : (parseFloat(amount) || 0);
  const scale = qtyGrams / 100;
  const scaled = {
    calories: round0(per100.calories * scale),
    protein: round1(per100.protein * scale),
    carbs: round1(per100.carbs * scale),
    fat: round1(per100.fat * scale),
  };

  return (
    <Card style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: THEME.text }}>{name}</div>
          {brand && <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>{brand}</div>}
        </div>
        <IconButton icon={X} onClick={onCancel} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {hasServing && (
          <GhostButton active={unit === "serving"} onClick={() => setUnit("serving")} style={{ flex: 1 }}>Servings</GhostButton>
        )}
        <GhostButton active={unit === "grams"} onClick={() => setUnit("grams")} style={{ flex: 1 }}>Grams</GhostButton>
      </div>

      <div style={{ marginTop: 10 }}>
        <FieldInput
          label={unit === "serving" ? "Number of servings" : "Amount"}
          value={amount}
          onChange={setAmount}
          type="number"
          inputMode="decimal"
          unit={unit === "serving" ? `× ${servingGrams}g` : "g"}
        />
        {unit === "serving" && (
          <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 5 }}>{round0(qtyGrams)}g total</div>
        )}
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 14, fontFamily: THEME.mono, fontSize: 12, color: THEME.textMuted }}>
        <span style={{ color: THEME.text, fontWeight: 700, fontSize: 15 }}>{scaled.calories} kcal</span>
        <span>P {scaled.protein}g</span>
        <span>C {scaled.carbs}g</span>
        <span>F {scaled.fat}g</span>
      </div>

      <div style={{ marginTop: 14 }}>
        <button
          onClick={() => onSubmit(scaled, round0(qtyGrams))}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
            background: THEME.accent, color: "#1A1408", border: "none", borderRadius: 12,
            padding: "12px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}
        >
          {submitLabel === "save" ? <Check size={16} /> : <Plus size={16} />}
          {submitLabel === "save" ? "Save changes" : "Add to log"}
        </button>
      </div>
    </Card>
  );
}

// No per100 baseline available (manual entries, quick-readds from history, imports) —
// direct editing of the four numbers instead of unit-based rescaling.
export function DirectEntryForm({ initial, onSubmit, submitLabel }) {
  const [values, setValues] = useState({
    name: initial?.name || "", calories: initial?.calories ?? "", protein: initial?.protein ?? "",
    carbs: initial?.carbs ?? "", fat: initial?.fat ?? "",
  });
  const canSubmit = values.name.trim() && values.calories !== "";

  return (
    <Card style={{ marginTop: 12 }}>
      <FieldInput label="Food name" value={values.name} onChange={(v) => setValues({ ...values, name: v })} placeholder="Chicken & rice bowl" />
      <div style={{ height: 10 }} />
      <FieldInput label="Calories" value={values.calories} onChange={(v) => setValues({ ...values, calories: v })} type="number" inputMode="decimal" unit="kcal" />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <FieldInput label="Protein" value={values.protein} onChange={(v) => setValues({ ...values, protein: v })} type="number" inputMode="decimal" unit="g" />
        <FieldInput label="Carbs" value={values.carbs} onChange={(v) => setValues({ ...values, carbs: v })} type="number" inputMode="decimal" unit="g" />
        <FieldInput label="Fat" value={values.fat} onChange={(v) => setValues({ ...values, fat: v })} type="number" inputMode="decimal" unit="g" />
      </div>
      <div style={{ marginTop: 14 }}>
        <button
          onClick={() => canSubmit && onSubmit({
            name: values.name.trim(), calories: round0(values.calories), protein: round1(values.protein),
            carbs: round1(values.carbs), fat: round1(values.fat),
          })}
          disabled={!canSubmit}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
            background: canSubmit ? THEME.accent : THEME.surfaceHigh, color: canSubmit ? "#1A1408" : THEME.textMuted,
            border: "none", borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 700,
            cursor: canSubmit ? "pointer" : "default",
          }}
        >
          {submitLabel === "save" ? <Check size={16} /> : <Plus size={16} />}
          {submitLabel === "save" ? "Save changes" : "Add to log"}
        </button>
      </div>
    </Card>
  );
}
