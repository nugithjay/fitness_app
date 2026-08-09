export function nutrimentsToPer100(n) {
  n = n || {};
  let calories = n["energy-kcal_100g"];
  if (calories == null && n["energy_100g"] != null) calories = n["energy_100g"] / 4.184;
  return {
    calories: Number(calories) || 0,
    protein: Number(n["proteins_100g"]) || 0,
    carbs: Number(n["carbohydrates_100g"]) || 0,
    fat: Number(n["fat_100g"]) || 0,
  };
}

export async function lookupBarcode(code) {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,nutriments,serving_quantity`
  );
  const data = await res.json();
  if (data.status !== 1 || !data.product) throw new Error("not_found");
  const p = data.product;
  return {
    name: p.product_name || "Unknown product",
    brand: p.brands || "",
    per100: nutrimentsToPer100(p.nutriments),
    servingGrams: p.serving_quantity ? Math.round(Number(p.serving_quantity)) : null,
  };
}

export async function searchFoods(query) {
  const res = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`
  );
  const data = await res.json();
  return (data.products || [])
    .filter((p) => p.product_name)
    .map((p) => ({
      name: p.product_name,
      brand: p.brands || "",
      per100: nutrimentsToPer100(p.nutriments),
      servingGrams: p.serving_quantity ? Math.round(Number(p.serving_quantity)) : null,
    }))
    .filter((p) => p.per100.calories > 0)
    .slice(0, 15);
}
