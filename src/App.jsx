import React, { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { THEME, uid, todayISO, addDaysISO, DEFAULT_PROFILE, round0 } from "./lib/core";
import { getUserData, setUserData, deleteUserData } from "./lib/db";
import { buildExerciseLibrary } from "./lib/exerciseLibrary";
import { supabase } from "./supabaseClient";
import { Auth } from "./views/Auth";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { HomeView } from "./views/Home";
import { FoodDiaryView } from "./views/FoodDiary";
import { FoodView } from "./views/Food";
import { WorkoutsView } from "./views/Workouts";
import { ProgressView } from "./views/Progress";
import { SettingsModal } from "./views/SettingsModal";
import { ImportModal } from "./views/ImportModal";
import { ImportWorkoutsModal } from "./views/ImportWorkoutsModal";

export default function App() {
  const [session, setSession] = useState(undefined);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [foodTabMeal, setFoodTabMeal] = useState(null);
  const [foodSubview, setFoodSubview] = useState("diary");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [foodLog, setFoodLog] = useState({});
  const [weightLog, setWeightLog] = useState([]);
  const [workoutLog, setWorkoutLog] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importWorkoutsOpen, setImportWorkoutsOpen] = useState(false);

  const changeTab = (tab) => {
    if (tab === "food") setFoodSubview("diary");
    setActiveTab(tab);
  };
  const goToFoodLogging = (meal) => { setFoodTabMeal(meal || null); setFoodSubview("logging"); setActiveTab("food"); };
  const goToFoodDiary = () => { setFoodSubview("diary"); setActiveTab("food"); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoaded(false);
    (async () => {
      const [p, f, w, wo, ph, tpl, sess] = await Promise.all([
        getUserData("profile"), getUserData("food-log"), getUserData("weight-log"),
        getUserData("workout-log"), getUserData("progress-photos"),
        getUserData("workout-templates"), getUserData("active-session"),
      ]);
      if (p) setProfile({ ...DEFAULT_PROFILE, ...p });
      if (f) setFoodLog(f);
      if (w) setWeightLog(w);
      if (wo) setWorkoutLog(wo);
      if (ph) setPhotos(ph);
      if (tpl) setTemplates(tpl);
      setActiveSession(sess || null);
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  useEffect(() => { if (loaded && session) setUserData("profile", profile); }, [profile, loaded, session]);
  useEffect(() => { if (loaded && session) setUserData("food-log", foodLog); }, [foodLog, loaded, session]);
  useEffect(() => { if (loaded && session) setUserData("weight-log", weightLog); }, [weightLog, loaded, session]);
  useEffect(() => { if (loaded && session) setUserData("workout-log", workoutLog); }, [workoutLog, loaded, session]);
  useEffect(() => { if (loaded && session) setUserData("progress-photos", photos); }, [photos, loaded, session]);
  useEffect(() => { if (loaded && session) setUserData("workout-templates", templates); }, [templates, loaded, session]);
  useEffect(() => { if (loaded && session) setUserData("active-session", activeSession); }, [activeSession, loaded, session]);

  const exerciseLibrary = useMemo(() => buildExerciseLibrary(workoutLog), [workoutLog]);

  const addFoodEntry = (date, entry) => setFoodLog((prev) => ({ ...prev, [date]: [...(prev[date] || []), entry] }));
  const deleteFoodEntry = (date, id) => setFoodLog((prev) => ({ ...prev, [date]: (prev[date] || []).filter((e) => e.id !== id) }));
  const updateFoodEntry = (date, id, patch) => setFoodLog((prev) => ({
    ...prev,
    [date]: (prev[date] || []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
  }));
  const logWeight = (date, weightKg) => setWeightLog((prev) => [...prev.filter((w) => w.date !== date), { id: uid(), date, weightKg }]);

  const addWorkout = (workout) => setWorkoutLog((prev) => [...prev, workout]);
  const deleteWorkout = (id) => setWorkoutLog((prev) => prev.filter((w) => w.id !== id));
  const addPhoto = (photo) => setPhotos((prev) => [...prev, photo]);
  const deletePhoto = (id) => setPhotos((prev) => prev.filter((p) => p.id !== id));

  const deleteTemplate = (id) => setTemplates((prev) => prev.filter((t) => t.id !== id));
  const startSession = (session) => setActiveSession(session);
  const updateSession = (session) => setActiveSession(session);
  const cancelSession = () => {
    setActiveSession(null);
    deleteUserData("active-session");
  };
  const finishSession = (workout) => {
    setWorkoutLog((prev) => [...prev, workout]);
    setActiveSession(null);
    deleteUserData("active-session");
  };

  const mergeImportedFood = (byDate) => {
    setFoodLog((prev) => {
      const next = { ...prev };
      Object.keys(byDate).forEach((date) => {
        const existing = next[date] || [];
        const isDup = (a, b) => a.name.trim().toLowerCase() === b.name.trim().toLowerCase() && round0(a.calories) === round0(b.calories);
        const toAdd = byDate[date].filter((entry) => !existing.some((e) => isDup(e, entry)));
        next[date] = [...existing, ...toAdd];
      });
      return next;
    });
  };
  const mergeImportedWeight = (entries) => {
    setWeightLog((prev) => {
      const map = new Map(prev.map((w) => [w.date, w]));
      entries.forEach((e) => map.set(e.date, { id: uid(), date: e.date, weightKg: e.weightKg }));
      return Array.from(map.values());
    });
  };
  const mergeImportedWorkouts = (workouts) => {
    setWorkoutLog((prev) => {
      const isDup = (a, b) => a.date === b.date && a.name.trim().toLowerCase() === b.name.trim().toLowerCase() && a.exercises.length === b.exercises.length;
      const toAdd = workouts.filter((w) => !prev.some((e) => isDup(e, w)));
      return [...prev, ...toAdd];
    });
  };
  const mergeImportedTemplates = (newTemplates) => {
    setTemplates((prev) => {
      const byName = new Map(prev.map((t) => [t.name.toLowerCase(), t]));
      newTemplates.forEach((t) => byName.set(t.name.toLowerCase(), t));
      return Array.from(byName.values());
    });
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

      <Header
        activeTab={activeTab}
        foodSubview={foodSubview}
        selectedDate={selectedDate}
        onNavDate={(d) => setSelectedDate((prev) => addDaysISO(prev, d))}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeTab === "today" && (
          <HomeView
            foodLog={foodLog}
            weightLog={weightLog}
            workoutLog={workoutLog}
            profile={profile}
            onLogWeight={logWeight}
            goToFoodLogging={() => goToFoodLogging()}
            goToFoodDiary={goToFoodDiary}
            goToWorkouts={() => changeTab("workouts")}
          />
        )}
        {activeTab === "food" && foodSubview === "diary" && (
          <FoodDiaryView
            date={selectedDate}
            foodLog={foodLog}
            profile={profile}
            onDeleteFood={deleteFoodEntry}
            onUpdateFood={updateFoodEntry}
            goToFoodLogging={goToFoodLogging}
          />
        )}
        {activeTab === "food" && foodSubview === "logging" && (
          <FoodView date={selectedDate} foodLog={foodLog} initialMeal={foodTabMeal} onAddEntry={addFoodEntry} onBack={goToFoodDiary} />
        )}
        {activeTab === "workouts" && (
          <WorkoutsView
            date={selectedDate} workoutLog={workoutLog} templates={templates}
            onAddWorkout={addWorkout} onDeleteWorkout={deleteWorkout} weightUnit={profile.weightUnit}
            activeSession={activeSession} onStartSession={startSession} onUpdateSession={updateSession}
            onFinishSession={finishSession} onCancelSession={cancelSession}
            onDeleteTemplate={deleteTemplate} exerciseLibrary={exerciseLibrary} restSeconds={profile.restSeconds}
          />
        )}
        {activeTab === "progress" && (
          <ProgressView
            foodLog={foodLog} weightLog={weightLog} workoutLog={workoutLog} profile={profile}
            photos={photos} onAddPhoto={addPhoto} onDeletePhoto={deletePhoto}
          />
        )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={changeTab} />

      {settingsOpen && (
        <SettingsModal
          profile={profile}
          onClose={() => setSettingsOpen(false)}
          onSave={(p) => { setProfile(p); setSettingsOpen(false); }}
          onOpenImport={() => { setSettingsOpen(false); setImportOpen(true); }}
          onOpenImportWorkouts={() => { setSettingsOpen(false); setImportWorkoutsOpen(true); }}
          hasActiveSession={!!activeSession}
          onClearStuckSession={() => { cancelSession(); setSettingsOpen(false); }}
        />
      )}

      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onImportFood={mergeImportedFood}
          onImportWeight={mergeImportedWeight}
        />
      )}

      {importWorkoutsOpen && (
        <ImportWorkoutsModal
          onClose={() => setImportWorkoutsOpen(false)}
          onImportWorkouts={mergeImportedWorkouts}
          onImportTemplates={mergeImportedTemplates}
        />
      )}
    </div>
  );
}
