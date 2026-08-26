import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { THEME } from "../lib/core";
import { PrimaryButton, GhostButton, FieldInput } from "../components/ui";
import { supabase } from "../supabaseClient";

export function Auth() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
        if (err) throw err;
        setMessage("Account created. Check your email if confirmation is required, then sign in.");
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: "100dvh", width: "100%", maxWidth: 420, margin: "0 auto",
      background: THEME.bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24,
      fontFamily: THEME.sans, color: THEME.text, boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", border: `2.5px solid ${THEME.accent}` }} />
        <span style={{ fontFamily: THEME.mono, fontSize: 22, fontWeight: 700, letterSpacing: 3 }}>PLATE</span>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <FieldInput label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
        <FieldInput label="Password" value={password} onChange={setPassword} type="password" placeholder={mode === "signup" ? "At least 6 characters" : "Your password"} />

        {error && <div style={{ fontSize: 12.5, color: THEME.danger }}>{error}</div>}
        {message && <div style={{ fontSize: 12.5, color: THEME.success }}>{message}</div>}

        <div style={{ marginTop: 6 }}>
          <PrimaryButton onClick={submit} disabled={loading || !email.trim() || !password}>
            {loading ? <Loader2 size={16} className="spin" /> : mode === "signin" ? "Sign in" : "Create account"}
          </PrimaryButton>
        </div>

        <GhostButton
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }}
          style={{ marginTop: 4 }}
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </GhostButton>
      </div>
    </div>
  );
}
