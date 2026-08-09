import React from "react";
import { THEME } from "../lib/core";

export const Card = ({ children, style }) => (
  <div style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 16, padding: 16, ...style }}>
    {children}
  </div>
);

export const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: THEME.textMuted, fontWeight: 600, marginBottom: 10 }}>
    {children}
  </div>
);

export const PrimaryButton = ({ children, onClick, disabled, style, icon: Icon }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      background: disabled ? THEME.surfaceHigh : THEME.accent,
      color: disabled ? THEME.textMuted : "#1A1408",
      border: "none", borderRadius: 12, padding: "12px 16px",
      fontSize: 14, fontWeight: 700, fontFamily: THEME.sans,
      opacity: disabled ? 0.6 : 1, cursor: disabled ? "default" : "pointer",
      width: "100%", ...style,
    }}
  >
    {Icon && <Icon size={16} />}
    {children}
  </button>
);

export const GhostButton = ({ children, onClick, style, icon: Icon, active }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      background: active ? THEME.surfaceHigh : "transparent",
      color: active ? THEME.text : THEME.textMuted,
      border: `1px solid ${active ? THEME.accent : THEME.border}`,
      borderRadius: 10, padding: "9px 12px", fontSize: 13, fontWeight: 600,
      fontFamily: THEME.sans, cursor: "pointer", ...style,
    }}
  >
    {Icon && <Icon size={14} />}
    {children}
  </button>
);

export const FieldInput = ({ label, value, onChange, type = "text", placeholder, inputMode, unit }) => (
  <div style={{ flex: 1 }}>
    {label && <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 5 }}>{label}</div>}
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        style={{
          width: "100%", background: THEME.surfaceHigh, border: `1px solid ${THEME.border}`,
          borderRadius: 10, padding: "10px 12px", color: THEME.text, fontSize: 14,
          fontFamily: THEME.mono, boxSizing: "border-box", outline: "none",
        }}
      />
      {unit && (
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: THEME.textMuted }}>
          {unit}
        </span>
      )}
    </div>
  </div>
);

export const MapField = ({ label, value, onChange, headers, optional }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 5 }}>{label}{optional ? " (optional)" : ""}</div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", background: THEME.surfaceHigh, border: `1px solid ${THEME.border}`,
        borderRadius: 10, padding: "10px 12px", color: THEME.text, fontSize: 13, fontFamily: THEME.sans,
      }}
    >
      {optional && <option value="">— none —</option>}
      {!optional && <option value="">— choose column —</option>}
      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
    </select>
  </div>
);

export const IconButton = ({ onClick, icon: Icon, color, title }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "transparent", border: "none", color: color || THEME.textMuted,
      cursor: "pointer", padding: 6, borderRadius: 8,
    }}
  >
    <Icon size={16} />
  </button>
);

export const EmptyState = ({ text }) => (
  <div style={{ padding: "28px 12px", textAlign: "center", color: THEME.textMuted, fontSize: 13, lineHeight: 1.5 }}>
    {text}
  </div>
);
