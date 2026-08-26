export const THEME = {
  bg: "#14161A",
  surface: "#1D2023",
  surfaceHigh: "#262A2E",
  border: "#303539",
  text: "#EDEEEC",
  textMuted: "#8B9096",
  accent: "#C68B3C",
  accentLight: "#DDAE66",
  protein: "#5C87A8",
  carbs: "#7FA37F",
  fat: "#B5735C",
  danger: "#C1615B",
  success: "#6FA88A",
  mono: "ui-monospace, 'SF Mono', 'JetBrains Mono', 'Roboto Mono', Menlo, monospace",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif",
};

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
export const round0 = (n) => Math.round(Number(n) || 0);
export const round1 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 10) / 10;
export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const addDaysISO = (iso, delta) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
};
export const formatDateLabel = (iso) => {
  const today = todayISO();
  if (iso === today) return "Today";
  if (iso === addDaysISO(today, -1)) return "Yesterday";
  if (iso === addDaysISO(today, 1)) return "Tomorrow";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};
export const shortLabel = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
export const isoWeekStart = (iso) => {
  const d = new Date(iso + "T00:00:00");
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
};

export const kgToLb = (kg) => kg * 2.20462;
export const lbToKg = (lb) => lb / 2.20462;
export const displayWeight = (kg, unit) => (unit === "lb" ? round1(kgToLb(kg)) : round1(kg));
export const toKg = (value, unit) => (unit === "lb" ? lbToKg(Number(value)) : Number(value));

export const DEFAULT_PROFILE = {
  weightUnit: "kg",
};

export const estimate1RM = (weightKg, reps) => weightKg * (1 + reps / 30);
