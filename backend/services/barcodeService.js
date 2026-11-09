const roundOne = (value) => Math.round((Number(value) || 0) * 10) / 10;

// Open Food Facts is free and needs no key, but asks clients to identify themselves.
export const findProductByBarcode = async (barcode) => {
  const base = process.env.OPEN_FOOD_FACTS_URL || "https://world.openfoodfacts.org";
  const fields = "product_name,brands,nutriments,serving_quantity";
  const response = await fetch(`${base}/api/v2/product/${barcode}.json?fields=${fields}`, {
    headers: { "User-Agent": "NutriScan/1.0" },
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Open Food Facts returned ${response.status}`);

  const { status, product } = await response.json();
  if (status !== 1 || !product) return null;

  const per100g = product.nutriments ?? {};
  const calories = Number(per100g["energy-kcal_100g"]);
  if (!Number.isFinite(calories)) return null;

  // Default to one serving when the product lists one, otherwise 100 g.
  const grams = Number(product.serving_quantity) > 0 ? Number(product.serving_quantity) : 100;
  const scale = (value) => roundOne((Number(value) || 0) * (grams / 100));
  const brand = product.brands?.split(",")[0]?.trim();
  const name = product.product_name?.trim() || "Packaged food";

  return {
    name: brand && !name.includes(brand) ? `${name} (${brand})` : name,
    quantity: grams,
    unit: "g",
    calories: Math.round(scale(calories)),
    protein: scale(per100g.proteins_100g),
    fat: scale(per100g.fat_100g),
    carbs: scale(per100g.carbohydrates_100g),
  };
};
