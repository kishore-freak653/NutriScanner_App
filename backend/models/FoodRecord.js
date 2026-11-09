import { getSupabase } from "../config/db.js";
import { isUuid } from "../utils/isUuid.js";
import { validationError } from "../utils/validationError.js";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

const toMealType = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (!MEAL_TYPES.includes(value)) throw validationError("Unknown meal type");
  return value;
};

const toNumber = (value, field, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw validationError(`${field} must be a number`);
  }
  return number;
};

const toText = (value) => (value ? String(value) : null);

// Keeps only the known food fields, so anything else the client sends is dropped.
const normalizeFoods = (foods) => {
  if (!Array.isArray(foods) || foods.length === 0) {
    throw validationError("At least one food item is required");
  }
  return foods.map((food) => {
    const name = typeof food?.name === "string" ? food.name.trim() : "";
    if (!name) throw validationError("Every food item needs a name");
    return {
      name,
      quantity: toNumber(food.quantity, "quantity", 1),
      unit: food.unit ? String(food.unit) : "serving",
      calories: toNumber(food.calories, "calories"),
      protein: toNumber(food.protein, "protein"),
      fat: toNumber(food.fat, "fat"),
      carbs: toNumber(food.carbs, "carbs"),
    };
  });
};

const toRecord = (row) => ({
  _id: row.id,
  userId: row.user_id,
  foods: row.foods,
  totalCalories: row.total_calories,
  totalProtein: row.total_protein,
  totalFat: row.total_fat,
  totalCarbs: row.total_carbs,
  imageUrl: row.image_url,
  imagePath: row.image_path,
  mealType: row.meal_type,
  scanNote: row.scan_note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createFoodRecord = async (record) => {
  const { data, error } = await getSupabase()
    .from("food_records")
    .insert({
      user_id: record.userId,
      foods: normalizeFoods(record.foods),
      total_calories: toNumber(record.totalCalories, "totalCalories"),
      total_protein: toNumber(record.totalProtein, "totalProtein"),
      total_fat: toNumber(record.totalFat, "totalFat"),
      total_carbs: toNumber(record.totalCarbs, "totalCarbs"),
      image_url: toText(record.imageUrl),
      image_path: toText(record.imagePath),
      meal_type: toMealType(record.mealType),
      scan_note: toText(record.scanNote),
    })
    .select()
    .single();
  if (error) throw error;
  return toRecord(data);
};

export const findFoodRecordsByUser = async (userId) => {
  const { data, error } = await getSupabase()
    .from("food_records")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(toRecord);
};

export const findFoodRecordById = async (id) => {
  if (!isUuid(id)) return null;
  const { data, error } = await getSupabase()
    .from("food_records")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toRecord(data) : null;
};

export const updateFoodRecord = async (id, changes) => {
  const { data, error } = await getSupabase()
    .from("food_records")
    .update({
      foods: normalizeFoods(changes.foods),
      total_calories: toNumber(changes.totalCalories, "totalCalories"),
      total_protein: toNumber(changes.totalProtein, "totalProtein"),
      total_fat: toNumber(changes.totalFat, "totalFat"),
      total_carbs: toNumber(changes.totalCarbs, "totalCarbs"),
      meal_type: toMealType(changes.mealType),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toRecord(data);
};

export const deleteFoodRecord = async (id) => {
  const { error } = await getSupabase()
    .from("food_records")
    .delete()
    .eq("id", id);
  if (error) throw error;
};
