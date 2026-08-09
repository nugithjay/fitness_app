import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Camera, Trash2, X, Loader2, Plus } from "lucide-react";
import {
  THEME, uid, round0, todayISO, addDaysISO, shortLabel, isoWeekStart, displayWeight,
} from "../lib/core";
import { Card, SectionLabel, GhostButton, EmptyState } from "../components/ui";
import { StatCard, chartTooltipStyle } from "../components/Metrics";
import { uploadProgressPhoto, getPhotoSignedUrl, deleteProgressPhotoFile } from "../lib/db";

function ProgressPhotos({ photos, onAdd, onDelete }) {
  const [urls, setUrls] = useState({});
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = photos.filter((p) => !urls[p.id]);
      if (missing.length === 0) return;
      const entries = await Promise.all(missing.map(async (p) => [p.id, await getPhotoSignedUrl(p.path)]));
      if (!cancelled) setUrls((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const id = uid();
      const path = await uploadProgressPhoto(file, todayISO(), id);
      onAdd({ id, date: todayISO(), path });
    } catch (err) {
      console.error("Photo upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const sorted = [...photos].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div>
      <SectionLabel>Progress photos</SectionLabel>
      <Card style={{ padding: 12 }}>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 2 }}>
          <label style={{
            flexShrink: 0, width: 84, height: 84, borderRadius: 12, border: `1.5px dashed ${THEME.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: THEME.textMuted,
          }}>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFile} />
            {uploading ? <Loader2 size={20} className="spin" /> : <Plus size={22} />}
          </label>
          {sorted.map((p) => (
            <button
              key={p.id}
              onClick={() => setViewing(p)}
              style={{
                flexShrink: 0, width: 84, height: 84, borderRadius: 12, overflow: "hidden",
                border: `1px solid ${THEME.border}`, padding: 0, cursor: "pointer", background: THEME.surfaceHigh,
                backgroundImage: urls[p.id] ? `url(${urls[p.id]})` : "none",
                backgroundSize: "cover", backgroundPosition: "center",
              }}
            />
          ))}
        </div>
        {sorted.length === 0 && (
          <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 10 }}>
            Add a photo each week or so to build a visual timeline alongside your weight trend.
          </div>
        )}
      </Card>

      {viewing && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 70, display: "flex", flexDirection: "column" }}
          onClick={() => setViewing(null)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", padding: 16 }}>
            <span style={{ color: THEME.text, fontSize: 13, fontFamily: THEME.mono }}>{viewing.date}</span>
            <div style={{ display: "flex", gap: 14 }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { deleteProgressPhotoFile(viewing.path); onDelete(viewing.id); setViewing(null); }}
                style={{ background: "none", border: "none", color: THEME.danger, cursor: "pointer" }}
              >
                <Trash2 size={20} />
              </button>
              <button onClick={() => setViewing(null)} style={{ background: "none", border: "none", color: THEME.text, cursor: "pointer" }}>
                <X size={22} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            {urls[viewing.id] ? (
              <img src={urls[viewing.id]} alt={viewing.date} style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }} onClick={(e) => e.stopPropagation()} />
            ) : (
              <Loader2 size={24} color={THEME.text} className="spin" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProgressView({ foodLog, weightLog, workoutLog, profile, photos, onAddPhoto, onDeletePhoto }) {
  const [rangeDays, setRangeDays] = useState(30);

  const sortedWeights = useMemo(() => [...weightLog].sort((a, b) => (a.date < b.date ? -1 : 1)), [weightLog]);
  const rangeStart = rangeDays === Infinity ? null : addDaysISO(todayISO(), -rangeDays);
  const weightInRange = sortedWeights.filter((w) => !rangeStart || w.date >= rangeStart);
  const weightChartData = weightInRange.map((w) => ({ date: shortLabel(w.date), weight: displayWeight(w.weightKg, profile.weightUnit) }));

  const last14 = Array.from({ length: 14 }, (_, i) => addDaysISO(todayISO(), -(13 - i)));
  const caloriesChartData = last14.map((d) => ({
    date: shortLabel(d),
    calories: (foodLog[d] || []).reduce((s, e) => s + Number(e.calories || 0), 0),
  }));

  const last7 = Array.from({ length: 7 }, (_, i) => addDaysISO(todayISO(), -i));
  const macroTotals = last7.reduce((acc, d) => {
    (foodLog[d] || []).forEach((e) => {
      acc.protein += Number(e.protein || 0);
      acc.carbs += Number(e.carbs || 0);
      acc.fat += Number(e.fat || 0);
    });
    return acc;
  }, { protein: 0, carbs: 0, fat: 0 });
  const macroDonutData = [
    { name: "Protein", value: round0(macroTotals.protein / 7), color: THEME.protein },
    { name: "Carbs", value: round0(macroTotals.carbs / 7), color: THEME.carbs },
    { name: "Fat", value: round0(macroTotals.fat / 7), color: THEME.fat },
  ];
  const macroDonutHasData = macroDonutData.some((m) => m.value > 0);

  const weeklyVolume = useMemo(() => {
    const map = {};
    workoutLog.filter((w) => w.type === "strength").forEach((w) => {
      const wk = isoWeekStart(w.date);
      const vol = w.exercises.reduce((sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps * set.weightKg, 0), 0);
      map[wk] = (map[wk] || 0) + vol;
    });
    const weeks = Array.from({ length: 8 }, (_, i) => isoWeekStart(addDaysISO(todayISO(), -7 * (7 - i))));
    return weeks.map((wk) => ({ date: shortLabel(wk), volume: round0(displayWeight(map[wk] || 0, profile.weightUnit)) }));
  }, [workoutLog, profile.weightUnit]);

  const currentWeight = sortedWeights.length ? sortedWeights[sortedWeights.length - 1] : null;
  const weightChangeInRange = weightInRange.length >= 2
    ? displayWeight(weightInRange[weightInRange.length - 1].weightKg - weightInRange[0].weightKg, profile.weightUnit)
    : null;
  const avgCalories7d = round0(last7.reduce((s, d) => s + (foodLog[d] || []).reduce((s2, e) => s2 + Number(e.calories || 0), 0), 0) / 7);
  const thisWeekStart = isoWeekStart(todayISO());
  const workoutsThisWeek = workoutLog.filter((w) => w.date >= thisWeekStart).length;

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <StatCard label="Weight" value={currentWeight ? `${displayWeight(currentWeight.weightKg, profile.weightUnit)}` : "—"} sub={profile.weightUnit} />
        <StatCard label="Change" value={weightChangeInRange != null ? `${weightChangeInRange > 0 ? "+" : ""}${weightChangeInRange}` : "—"} sub={`${rangeDays === Infinity ? "all time" : rangeDays + "d"}`} />
        <StatCard label="Avg kcal" value={avgCalories7d || "—"} sub="7 days" />
        <StatCard label="Workouts" value={workoutsThisWeek} sub="this week" />
      </div>

      <ProgressPhotos photos={photos} onAdd={onAddPhoto} onDelete={onDeletePhoto} />

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <SectionLabel>Weight trend</SectionLabel>
          <div style={{ display: "flex", gap: 6 }}>
            {[[7, "7D"], [30, "30D"], [90, "90D"], [Infinity, "All"]].map(([d, l]) => (
              <GhostButton key={l} active={rangeDays === d} onClick={() => setRangeDays(d)} style={{ padding: "5px 9px", fontSize: 11 }}>{l}</GhostButton>
            ))}
          </div>
        </div>
        <Card>
          {weightChartData.length < 2 ? (
            <EmptyState text="Log your weight a few times to see a trend line here." />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weightChartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="date" tick={{ fill: THEME.textMuted, fontSize: 10 }} axisLine={{ stroke: THEME.border }} tickLine={false} />
                <YAxis domain={["auto", "auto"]} tick={{ fill: THEME.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="weight" stroke={THEME.accent} strokeWidth={2.5} dot={{ r: 2.5, fill: THEME.accent }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div>
        <SectionLabel>Calories — last 14 days</SectionLabel>
        <Card>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={caloriesChartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
              <XAxis dataKey="date" tick={{ fill: THEME.textMuted, fontSize: 9 }} axisLine={{ stroke: THEME.border }} tickLine={false} interval={1} />
              <YAxis tick={{ fill: THEME.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <ReferenceLine y={profile.goalCalories} stroke={THEME.textMuted} strokeDasharray="4 4" />
              <Bar dataKey="calories" fill={THEME.accent} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div>
        <SectionLabel>Avg macros / day — last 7 days</SectionLabel>
        <Card>
          {!macroDonutHasData ? (
            <EmptyState text="Log a few meals to see your macro breakdown." />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={macroDonutData} dataKey="value" innerRadius={34} outerRadius={56} paddingAngle={3} stroke="none">
                    {macroDonutData.map((m, i) => <Cell key={i} fill={m.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {macroDonutData.map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
                      <span style={{ fontSize: 12, color: THEME.text }}>{m.name}</span>
                    </div>
                    <span style={{ fontFamily: THEME.mono, fontSize: 12, color: THEME.textMuted }}>{m.value}g</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div>
        <SectionLabel>Weekly strength volume</SectionLabel>
        <Card>
          {weeklyVolume.every((w) => w.volume === 0) ? (
            <EmptyState text="Log strength workouts to track your weekly volume." />
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={weeklyVolume} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
                <XAxis dataKey="date" tick={{ fill: THEME.textMuted, fontSize: 9 }} axisLine={{ stroke: THEME.border }} tickLine={false} />
                <YAxis tick={{ fill: THEME.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="volume" fill={THEME.protein} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
