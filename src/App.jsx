import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { THEME, uid, todayISO, DEFAULT_PROFILE } from "./lib/core";
import { getUserData, setUserData } from "./lib/db";
import { supabase } from "./supabaseClient";
import { Auth } from "./views/Auth";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { HomeView } from "./views/Home";
import { StatsView } from "./views/Stats";
import { ImportView } from "./views/Import";
import { SettingsModal } from "./views/SettingsModal";
import { ImportModal } from "./views/ImportModal";
import { ImportWorkoutsModal } from "./views/ImportWorkoutsModal";
import { ImportGarminModal } from "./views/ImportGarminModal";
import { ImportHealthModal } from "./views/ImportHealthModal";

export default function App() {
  const [session, setSession] = useState(undefined);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [weightLog, setWeightLog] = useState([]);
  const [workoutLog, setWorkoutLog] = useState([]);
  const [healthLog, setHealthLog] = useState({});
  const [photos, setPhotos] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importWeightOpen, setImportWeightOpen] = useState(false);
  const [importStrongOpen, setImportStrongOpen] = useState(false);
  const [importGarminOpen, setImportGarminOpen] = useState(false);
  const [importHealthOpen, setImportHealthOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoaded(false);
    (async () => {
      const [p, w, wo, ph, hl] = await Promise.all([
        getUserData("profile"), getUserData("weight-log"),
        getUserData("workout-log"), getUserData("progress-photos"),
        getUserData("health-log"),
      ]);
      if (p) setProfile({ ...DEFAULT_PROFILE, ...p });
      if (w) setWeightLog(w);
      if (wo) setWorkoutLog(wo);
      if (ph) setPhotos(ph);
      if (hl) setHealthLog(hl);
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  useEffect(() => { if (loaded && session) setUserData("profile", profile); }, [profile, loaded, session]);
  useEffect(() => { if (loaded && session) setUserData("weight-log", weightLog); }, [weightLog, loaded, session]);
  useEffect(() => { if (loaded && session) setUserData("workout-log", workoutLog); }, [workoutLog, loaded, session]);
  useEffect(() => { if (loaded && session) setUserData("progress-photos", photos); }, [photos, loaded, session]);
  useEffect(() => { if (loaded && session) setUserData("health-log", healthLog); }, [healthLog, loaded, session]);

  const logWeight = (date, weightKg) => setWeightLog((prev) => [...prev.filter((w) => w.date !== date), { id: uid(), date, weightKg }]);
  const deleteWorkout = (id) => setWorkoutLog((prev) => prev.filter((w) => w.id !== id));
  const addPhoto = (photo) => setPhotos((prev) => [...prev, photo]);
  const deletePhoto = (id) => setPhotos((prev) => prev.filter((p) => p.id !== id));

  const mergeImportedWeight = (entries) => {
    setWeightLog((prev) => {
      const map = new Map(prev.map((w) => [w.date, w]));
      entries.forEach((e) => map.set(e.date, { id: uid(), date: e.date, weightKg: e.weightKg }));
      return Array.from(map.values());
    });
  };
  const mergeImportedWorkouts = (workouts) => {
    setWorkoutLog((prev) => {
      const isDup = (a, b) => a.date === b.date && a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
      const toAdd = workouts.filter((w) => !prev.some((e) => isDup(e, w)));
      return [...prev, ...toAdd];
    });
  };
  const mergeImportedHealth = (daily) => {
    setHealthLog((prev) => ({ ...prev, ...daily }));
  };

  if (session === undefined) {
    return (
      <div style={{ height: "100dvh", background: THEME.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={22} color={THEME.accent} className="spin" />
      </div>
    );
  }
  if (!session) return <Auth />;

  if (!loaded) {
    return (
      <div style={{ height: "100dvh", background: THEME.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={22} color={THEME.accent} className="spin" />
      </div>
    );
  }

  return (
    <div style={{
      height: "100dvh", width: "100%", maxWidth: 480, margin: "0 auto",
      background: THEME.bg, display: "flex", flexDirection: "column",
      fontFamily: THEME.sans, color: THEME.text, overflow: "hidden",
    }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        input:focus, select:focus { border-color: ${THEME.accent} !important; outline: none; }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      <Header activeTab={activeTab} onOpenSettings={() => setSettingsOpen(true)} />

      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeTab === "today" && (
          <HomeView
            weightLog={weightLog}
            workoutLog={workoutLog}
            profile={profile}
            onLogWeight={logWeight}
            goToWorkouts={() => setActiveTab("stats")}
          />
        )}
        {activeTab === "stats" && (
          <StatsView
            weightLog={weightLog} workoutLog={workoutLog} healthLog={healthLog} profile={profile}
            photos={photos} onAddPhoto={addPhoto} onDeletePhoto={deletePhoto}
            onDeleteWorkout={deleteWorkout}
          />
        )}
        {activeTab === "import" && (
          <ImportView
            onOpenImportStrong={() => setImportStrongOpen(true)}
            onOpenImportGarmin={() => setImportGarminOpen(true)}
            onOpenImportHealth={() => setImportHealthOpen(true)}
            onOpenImportWeight={() => setImportWeightOpen(true)}
          />
        )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {settingsOpen && (
        <SettingsModal
          profile={profile}
          onClose={() => setSettingsOpen(false)}
          onSave={(p) => { setProfile(p); setSettingsOpen(false); }}
        />
      )}

      {importWeightOpen && (
        <ImportModal onClose={() => setImportWeightOpen(false)} onImportWeight={mergeImportedWeight} />
      )}
      {importStrongOpen && (
        <ImportWorkoutsModal onClose={() => setImportStrongOpen(false)} onImportWorkouts={mergeImportedWorkouts} />
      )}
      {importGarminOpen && (
        <ImportGarminModal onClose={() => setImportGarminOpen(false)} onImportWorkouts={mergeImportedWorkouts} />
      )}
      {importHealthOpen && (
        <ImportHealthModal onClose={() => setImportHealthOpen(false)} onImportHealth={mergeImportedHealth} />
      )}
    </div>
  );
}
