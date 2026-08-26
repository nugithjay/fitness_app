import React, { useState, useMemo } from "react";
import { Scale, Dumbbell, Flame, Trophy, Check } from "lucide-react";
import { THEME, round1, toKg, displayWeight, todayISO } from "../lib/core";
import { computeStreak, computeWeeklyRollup, computeRecentPR } from "../lib/stats";
import { Card, SectionLabel, FieldInput } from "../components/ui";

const QuickAction = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 14,
      padding: "14px 8px", cursor: "pointer",
    }}
  >
    <Icon size={19} color={THEME.accent} />
    <span style={{ fontSize: 11.5, fontWeight: 600, color: THEME.text }}>{label}</span>
  </button>
);

export function HomeView({ weightLog, workoutLog, profile, onLogWeight, goToWorkouts }) {
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState("");

  const streak = useMemo(() => computeStreak(weightLog), [weightLog]);
  const rollup = useMemo(() => computeWeeklyRollup(weightLog, workoutLog), [weightLog, workoutLog]);
  const recentPR = useMemo(() => computeRecentPR(workoutLog), [workoutLog]);

  const sortedWeights = [...weightLog].sort((a, b) => (a.date < b.date ? 1 : -1));
  const latestWeight = sortedWeights[0];
  const weightChange = rollup.weightChangeKg;

  const submitWeight = () => {
    const v = parseFloat(weightInput);
    if (!v || v <= 0) return;
    onLogWeight(todayISO(), toKg(v, profile.weightUnit));
    setWeightInput("");
    setEditingWeight(false);
  };

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <QuickAction icon={Scale} label="Log weight" onClick={() => setEditingWeight(true)} />
        <QuickAction icon={Dumbbell} label="Workouts" onClick={goToWorkouts} />
      </div>

      {editingWeight && (
        <Card>
          <div style={{ display: "flex", gap: 8 }}>
            <FieldInput value={weightInput} onChange={setWeightInput} type="number" inputMode="decimal" placeholder={`Weight in ${profile.weightUnit}`} unit={profile.weightUnit} />
            <button onClick={submitWeight} style={{ background: THEME.accent, border: "none", borderRadius: 10, padding: "0 16px", color: "#1A1408", cursor: "pointer" }}>
              <Check size={18} />
            </button>
          </div>
        </Card>
      )}

      {streak > 0 && (
        <Card style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Flame size={20} color={THEME.accent} />
          <div>
            <div style={{ fontFamily: THEME.mono, fontSize: 18, fontWeight: 700, color: THEME.text }}>{streak} day{streak !== 1 ? "s" : ""}</div>
            <div style={{ fontSize: 11.5, color: THEME.textMuted }}>Weigh-in streak</div>
          </div>
        </Card>
      )}

      {recentPR && (
        <Card style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${THEME.accent}` }}>
          <Trophy size={20} color={THEME.accent} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text }}>New PR: {recentPR.name}</div>
            <div style={{ fontSize: 11.5, color: THEME.textMuted, fontFamily: THEME.mono }}>
              {recentPR.reps}×{round1(displayWeight(recentPR.weightKg, profile.weightUnit))}{profile.weightUnit} · est. 1RM {round1(displayWeight(recentPR.e1rm, profile.weightUnit))}{profile.weightUnit}
            </div>
          </div>
        </Card>
      )}

      <div>
        <SectionLabel>This week</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <Card style={{ flex: 1, padding: 12 }}>
            <div style={{ fontSize: 10, color: THEME.textMuted, textTransform: "uppercase" }}>Weight change</div>
            <div style={{ fontFamily: THEME.mono, fontSize: 17, fontWeight: 700, color: THEME.text, marginTop: 4 }}>
              {weightChange != null ? `${weightChange > 0 ? "+" : ""}${round1(displayWeight(weightChange, profile.weightUnit))}` : "—"}
            </div>
          </Card>
          <Card style={{ flex: 1, padding: 12 }}>
            <div style={{ fontSize: 10, color: THEME.textMuted, textTransform: "uppercase" }}>Workouts</div>
            <div style={{ fontFamily: THEME.mono, fontSize: 17, fontWeight: 700, color: THEME.text, marginTop: 4 }}>{rollup.workoutsThisWeek}</div>
          </Card>
        </div>
      </div>

      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Scale size={16} color={THEME.textMuted} />
            <span style={{ fontSize: 13, color: THEME.textMuted }}>Current weight</span>
          </div>
          <span style={{ fontFamily: THEME.mono, fontSize: 16, fontWeight: 700, color: THEME.text }}>
            {latestWeight ? `${displayWeight(latestWeight.weightKg, profile.weightUnit)} ${profile.weightUnit}` : "—"}
          </span>
        </div>
      </Card>
    </div>
  );
}
