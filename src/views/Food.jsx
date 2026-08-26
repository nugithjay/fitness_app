import React, { useState, useEffect, useMemo, useRef } from "react";
import { Camera, X, Loader2, Search, ChevronDown, ChevronUp, ChevronLeft } from "lucide-react";
import { THEME, MEALS, uid, round0, currentTimeHHMM, guessMealFromTime } from "../lib/core";
import { Card, GhostButton } from "../components/ui";
import { FoodEntrySheet, DirectEntryForm } from "../components/FoodEntrySheet";
import { lookupBarcode, searchFoods } from "../lib/openFoodFacts";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";

function ResultRow({ name, brand, kcalLabel, tag, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
        background: "transparent", border: "none", borderBottom: `1px solid ${THEME.border}`,
        padding: "10px 0", cursor: "pointer", textAlign: "left",
      }}
    >
      <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
        {tag && <span style={{ fontSize: 9.5, color: THEME.accent, border: `1px solid ${THEME.accent}`, borderRadius: 4, padding: "1px 4px", flexShrink: 0, fontWeight: 700 }}>{tag}</span>}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: THEME.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
          {brand && <div style={{ fontSize: 11, color: THEME.textMuted }}>{brand}</div>}
        </div>
      </div>
      <div style={{ fontFamily: THEME.mono, fontSize: 12, color: THEME.textMuted, flexShrink: 0, marginLeft: 8 }}>{kcalLabel}</div>
    </button>
  );
}

export function FoodView({ date, foodLog, initialMeal, onAddEntry, onBack }) {
  const [meal, setMeal] = useState(initialMeal || guessMealFromTime(currentTimeHHMM()));
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState(null); // { name, brand, per100, servingGrams } when a db/barcode item is selected
  const [manualOpen, setManualOpen] = useState(false);

  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState("");
  const [dbResults, setDbResults] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState("");

  const inputRef = useRef(null);
  useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  const scanner = useBarcodeScanner((code) => {
    setQuery(code);
    runBarcodeLookup(code);
  });

  const runBarcodeLookup = async (code) => {
    setBarcodeLoading(true);
    setBarcodeError("");
    setProduct(null);
    try {
      const p = await lookupBarcode(code);
      setProduct(p);
    } catch (e) {
      setBarcodeError("Couldn't find that barcode. Try a text search, or add it manually below.");
    } finally {
      setBarcodeLoading(false);
    }
  };

  const isBarcodeQuery = /^\d{6,}$/.test(query.trim());

  useEffect(() => {
    setProduct(null);
    setBarcodeError("");
    if (isBarcodeQuery) {
      const t = setTimeout(() => runBarcodeLookup(query.trim()), 350);
      return () => clearTimeout(t);
    }
    if (query.trim().length < 2) {
      setDbResults([]);
      setDbError("");
      return undefined;
    }
    setDbLoading(true);
    setDbError("");
    const t = setTimeout(async () => {
      try {
        const results = await searchFoods(query.trim());
        setDbResults(results);
        if (results.length === 0) setDbError("No database matches.");
      } catch (e) {
        setDbError("Search failed — check your connection.");
      } finally {
        setDbLoading(false);
      }
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const yourFoods = useMemo(() => {
    const map = new Map();
    Object.values(foodLog).flat().forEach((e) => {
      const key = e.name.trim().toLowerCase();
      const existing = map.get(key);
      map.set(key, { ...e, count: (existing ? existing.count : 0) + 1 });
    });
    return Array.from(map.values()).sort((a, b) => (b.count || 0) - (a.count || 0));
  }, [foodLog]);

  const yourFoodsFiltered = query.trim() && !isBarcodeQuery
    ? yourFoods.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()))
    : query.trim() === "" ? yourFoods : [];

  const commitEntry = (data) => {
    onAddEntry(date, {
      id: uid(),
      time: currentTimeHHMM(),
      meal,
      name: data.name,
      brand: data.brand || "",
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      source: data.source || "search",
      // keep the baseline so this entry can be rescaled later if edited
      per100: data.per100 || null,
      servingGrams: data.servingGrams || null,
      qtyGrams: data.qtyGrams || null,
    });
    setProduct(null);
    setQuery("");
  };

  const addYourFoodDirect = (f) => commitEntry({
    name: f.name, brand: f.brand, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat,
    source: "myfoods", per100: f.per100 || null, servingGrams: f.servingGrams || null, qtyGrams: f.qtyGrams || null,
  });

  return (
    <div style={{ padding: 16 }}>
      {onBack && (
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: THEME.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "0 0 12px" }}>
          <ChevronLeft size={16} /> Back to diary
        </button>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {MEALS.map((m) => (
          <GhostButton key={m} active={meal === m} onClick={() => setMeal(m)} style={{ flex: 1, padding: "8px 4px", fontSize: 12 }}>{m}</GhostButton>
        ))}
      </div>

      <Card style={{ padding: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Search size={16} color={THEME.textMuted} style={{ flexShrink: 0, marginLeft: 4 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search food or type a barcode number"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: THEME.text, fontSize: 14, padding: "6px 0" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: THEME.textMuted, cursor: "pointer", padding: 4 }}>
              <X size={15} />
            </button>
          )}
          <button
            onClick={scanner.scanning ? scanner.stop : scanner.start}
            style={{
              flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: `1px solid ${scanner.scanning ? THEME.accent : THEME.border}`,
              background: scanner.scanning ? THEME.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <Camera size={15} color={scanner.scanning ? "#1A1408" : THEME.textMuted} />
          </button>
        </div>
      </Card>

      <Card style={{
        marginTop: scanner.scanning ? 10 : 0, padding: 0, overflow: "hidden",
        border: scanner.scanning ? undefined : "none",
        height: scanner.scanning ? "auto" : 0,
      }}>
        <div style={{ position: "relative", background: "#000", display: scanner.scanning ? "block" : "none" }}>
          <video ref={scanner.videoRef} autoPlay muted playsInline style={{ width: "100%", display: "block" }} />
          <div style={{ position: "absolute", inset: "30% 12%", border: `2px solid ${THEME.accent}`, borderRadius: 8, pointerEvents: "none" }} />
        </div>
      </Card>
      {scanner.error && <div style={{ fontSize: 12, color: THEME.danger, marginTop: 8 }}>{scanner.error}</div>}

      {isBarcodeQuery && (
        <div style={{ marginTop: 10 }}>
          {barcodeLoading && <div style={{ display: "flex", alignItems: "center", gap: 8, color: THEME.textMuted, fontSize: 13, padding: "8px 2px" }}><Loader2 size={15} className="spin" /> Looking up barcode…</div>}
          {barcodeError && <div style={{ fontSize: 12, color: THEME.danger, padding: "4px 2px" }}>{barcodeError}</div>}
        </div>
      )}

      {product && (
        <FoodEntrySheet
          name={product.name} brand={product.brand} per100={product.per100} servingGrams={product.servingGrams}
          onCancel={() => setProduct(null)}
          onSubmit={(scaled, qtyGrams) => commitEntry({
            ...scaled, name: product.name, brand: product.brand, source: isBarcodeQuery ? "barcode" : "database",
            per100: product.per100, servingGrams: product.servingGrams, qtyGrams,
          })}
        />
      )}

      {!product && !isBarcodeQuery && (
        <div style={{ marginTop: 14 }}>
          {yourFoodsFiltered.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: THEME.textMuted, fontWeight: 600, marginBottom: 6 }}>Your foods</div>
              <Card style={{ padding: "2px 16px" }}>
                {yourFoodsFiltered.slice(0, 40).map((f, i) => (
                  <ResultRow key={f.name + i} name={f.name} brand={f.brand} tag={f.count > 1 ? `${f.count}×` : null} kcalLabel={`${round0(f.calories)} kcal`} onClick={() => addYourFoodDirect(f)} />
                ))}
              </Card>
            </div>
          )}

          {query.trim().length >= 2 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: THEME.textMuted, fontWeight: 600, marginBottom: 6 }}>Database results</div>
              <Card style={{ padding: dbResults.length ? "2px 16px" : 16 }}>
                {dbLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: THEME.textMuted, fontSize: 13, padding: "6px 0" }}><Loader2 size={15} className="spin" /> Searching…</div>
                ) : dbResults.length > 0 ? (
                  dbResults.map((p, i) => (
                    <ResultRow key={i} name={p.name} brand={p.brand} kcalLabel={`${round0(p.per100.calories)} kcal/100g`} onClick={() => setProduct(p)} />
                  ))
                ) : (
                  <div style={{ fontSize: 12.5, color: THEME.textMuted }}>{dbError || "Keep typing to search."}</div>
                )}
              </Card>
            </div>
          )}

          {yourFoodsFiltered.length === 0 && query.trim().length < 2 && (
            <div style={{ fontSize: 12.5, color: THEME.textMuted, textAlign: "center", padding: "18px 12px" }}>
              Nothing logged yet — search above, scan a barcode, or add manually below.
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => setManualOpen(!manualOpen)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: THEME.textMuted, fontSize: 12.5, cursor: "pointer", padding: "6px 2px" }}
        >
          {manualOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Can't find it? Add manually
        </button>
        {manualOpen && (
          <DirectEntryForm onSubmit={(vals) => commitEntry({ ...vals, source: "manual" })} />
        )}
      </div>
    </div>
  );
}
