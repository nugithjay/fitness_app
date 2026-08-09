import React, { useState } from "react";
import { Hash, Search, Pencil, Camera, X, Plus, Loader2 } from "lucide-react";
import { THEME, uid, round0, round1, currentTimeHHMM } from "../lib/core";
import { Card, GhostButton, FieldInput, IconButton } from "../components/ui";
import { lookupBarcode, searchFoods } from "../lib/openFoodFacts";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";

function ProductPreview({ product, onAdd, onCancel }) {
  const [qty, setQty] = useState(product.servingGrams ? String(product.servingGrams) : "100");
  const scale = (parseFloat(qty) || 0) / 100;
  const scaled = {
    calories: round0(product.per100.calories * scale),
    protein: round1(product.per100.protein * scale),
    carbs: round1(product.per100.carbs * scale),
    fat: round1(product.per100.fat * scale),
  };
  const chips = [50, 100, 150, 200];

  return (
    <Card style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: THEME.text }}>{product.name}</div>
          {product.brand && <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>{product.brand}</div>}
        </div>
        <IconButton icon={X} onClick={onCancel} />
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
        {chips.map((g) => (
          <GhostButton key={g} active={qty === String(g)} onClick={() => setQty(String(g))} style={{ padding: "6px 10px" }}>
            {g}g
          </GhostButton>
        ))}
        {product.servingGrams ? (
          <GhostButton active={qty === String(product.servingGrams)} onClick={() => setQty(String(product.servingGrams))} style={{ padding: "6px 10px" }}>
            1 serving
          </GhostButton>
        ) : null}
      </div>

      <div style={{ marginTop: 10 }}>
        <FieldInput label="Amount" value={qty} onChange={setQty} type="number" inputMode="decimal" unit="g" />
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 14, fontFamily: THEME.mono, fontSize: 12, color: THEME.textMuted }}>
        <span style={{ color: THEME.text, fontWeight: 700, fontSize: 15 }}>{scaled.calories} kcal</span>
        <span>P {scaled.protein}g</span>
        <span>C {scaled.carbs}g</span>
        <span>F {scaled.fat}g</span>
      </div>

      <div style={{ marginTop: 14 }}>
        <button
          onClick={() => onAdd(scaled, parseFloat(qty) || 0)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
            background: THEME.accent, color: "#1A1408", border: "none", borderRadius: 12,
            padding: "12px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}
        >
          <Plus size={16} /> Add to log
        </button>
      </div>
    </Card>
  );
}

export function FoodView({ date, onAddEntry }) {
  const [mode, setMode] = useState("barcode");

  const [barcodeInput, setBarcodeInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [product, setProduct] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [manual, setManual] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });

  const runLookup = async (code) => {
    setLookupLoading(true);
    setLookupError("");
    setProduct(null);
    try {
      const p = await lookupBarcode(code);
      setProduct(p);
    } catch (e) {
      setLookupError("Couldn't find that barcode. Try search, or enter it manually.");
    } finally {
      setLookupLoading(false);
    }
  };

  const scanner = useBarcodeScanner((code) => {
    setBarcodeInput(code);
    runLookup(code);
  });

  const runSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    setSearchError("");
    setSearchResults([]);
    try {
      const products = await searchFoods(q);
      setSearchResults(products);
      if (products.length === 0) setSearchError("No results with nutrition data. Try a different search or enter manually.");
    } catch (e) {
      setSearchError("Search failed. Check your connection and try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const commitProduct = (scaled, qtyGrams, sourceProduct) => {
    onAddEntry(date, {
      id: uid(),
      time: currentTimeHHMM(),
      name: sourceProduct.name,
      brand: sourceProduct.brand,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
      source: mode,
    });
    setProduct(null);
    setBarcodeInput("");
    setSearchResults([]);
    setSearchQuery("");
  };

  const submitManual = () => {
    if (!manual.name.trim() || !manual.calories) return;
    onAddEntry(date, {
      id: uid(),
      time: currentTimeHHMM(),
      name: manual.name.trim(),
      brand: "",
      calories: round0(manual.calories),
      protein: round1(manual.protein),
      carbs: round1(manual.carbs),
      fat: round1(manual.fat),
      source: "manual",
    });
    setManual({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <GhostButton active={mode === "barcode"} onClick={() => { setMode("barcode"); setProduct(null); setLookupError(""); }} icon={Hash} style={{ flex: 1 }}>Barcode</GhostButton>
        <GhostButton active={mode === "search"} onClick={() => { setMode("search"); setProduct(null); }} icon={Search} style={{ flex: 1 }}>Search</GhostButton>
        <GhostButton active={mode === "manual"} onClick={() => { setMode("manual"); setProduct(null); }} icon={Pencil} style={{ flex: 1 }}>Manual</GhostButton>
      </div>

      {mode === "barcode" && (
        <div>
          <Card>
            <div style={{ display: "flex", gap: 8 }}>
              <FieldInput value={barcodeInput} onChange={setBarcodeInput} placeholder="e.g. 3017624010701" inputMode="numeric" />
              <button
                onClick={() => barcodeInput.trim() && runLookup(barcodeInput.trim())}
                disabled={lookupLoading}
                style={{ background: THEME.accent, border: "none", borderRadius: 10, padding: "0 16px", color: "#1A1408", cursor: "pointer" }}
              >
                {lookupLoading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              {!scanner.scanning ? (
                <GhostButton icon={Camera} onClick={scanner.start} style={{ width: "100%" }}>Scan with camera</GhostButton>
              ) : (
                <div>
                  <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#000" }}>
                    <video ref={scanner.videoRef} style={{ width: "100%", display: "block" }} muted playsInline />
                    <div style={{ position: "absolute", inset: "30% 12%", border: `2px solid ${THEME.accent}`, borderRadius: 8, pointerEvents: "none" }} />
                  </div>
                  <GhostButton onClick={scanner.stop} style={{ width: "100%", marginTop: 8 }}>Cancel</GhostButton>
                </div>
              )}
            </div>
            {scanner.error && <div style={{ fontSize: 12, color: THEME.danger, marginTop: 8 }}>{scanner.error}</div>}
            {lookupError && <div style={{ fontSize: 12, color: THEME.danger, marginTop: 8 }}>{lookupError}</div>}
          </Card>
          {product && <ProductPreview product={product} onCancel={() => setProduct(null)} onAdd={(scaled, qty) => commitProduct(scaled, qty, product)} />}
        </div>
      )}

      {mode === "search" && (
        <div>
          <Card>
            <div style={{ display: "flex", gap: 8 }}>
              <FieldInput value={searchQuery} onChange={setSearchQuery} placeholder="e.g. greek yogurt" />
              <button
                onClick={runSearch}
                disabled={searchLoading}
                style={{ background: THEME.accent, border: "none", borderRadius: 10, padding: "0 16px", color: "#1A1408", cursor: "pointer" }}
              >
                {searchLoading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
              </button>
            </div>
            {searchError && <div style={{ fontSize: 12, color: THEME.danger, marginTop: 8 }}>{searchError}</div>}
          </Card>

          {searchResults.length > 0 && !product && (
            <Card style={{ marginTop: 12, padding: "4px 16px" }}>
              {searchResults.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setProduct(p)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
                    background: "transparent", border: "none", borderBottom: i < searchResults.length - 1 ? `1px solid ${THEME.border}` : "none",
                    padding: "10px 0", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: THEME.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    {p.brand && <div style={{ fontSize: 11, color: THEME.textMuted }}>{p.brand}</div>}
                  </div>
                  <div style={{ fontFamily: THEME.mono, fontSize: 12, color: THEME.textMuted, flexShrink: 0, marginLeft: 8 }}>
                    {round0(p.per100.calories)} kcal/100g
                  </div>
                </button>
              ))}
            </Card>
          )}
          {product && <ProductPreview product={product} onCancel={() => setProduct(null)} onAdd={(scaled, qty) => commitProduct(scaled, qty, product)} />}
        </div>
      )}

      {mode === "manual" && (
        <Card>
          <FieldInput label="Food name" value={manual.name} onChange={(v) => setManual({ ...manual, name: v })} placeholder="Chicken & rice bowl" />
          <div style={{ height: 10 }} />
          <FieldInput label="Calories" value={manual.calories} onChange={(v) => setManual({ ...manual, calories: v })} type="number" inputMode="decimal" unit="kcal" />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <FieldInput label="Protein" value={manual.protein} onChange={(v) => setManual({ ...manual, protein: v })} type="number" inputMode="decimal" unit="g" />
            <FieldInput label="Carbs" value={manual.carbs} onChange={(v) => setManual({ ...manual, carbs: v })} type="number" inputMode="decimal" unit="g" />
            <FieldInput label="Fat" value={manual.fat} onChange={(v) => setManual({ ...manual, fat: v })} type="number" inputMode="decimal" unit="g" />
          </div>
          <div style={{ marginTop: 14 }}>
            <button
              onClick={submitManual}
              disabled={!manual.name.trim() || !manual.calories}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
                background: (!manual.name.trim() || !manual.calories) ? THEME.surfaceHigh : THEME.accent,
                color: (!manual.name.trim() || !manual.calories) ? THEME.textMuted : "#1A1408",
                border: "none", borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 700,
                cursor: (!manual.name.trim() || !manual.calories) ? "default" : "pointer",
              }}
            >
              <Plus size={16} /> Add to log
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
