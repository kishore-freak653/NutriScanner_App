export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" },
];

export const mealLabel = (mealType?: MealType | null) =>
  MEAL_TYPES.find((meal) => meal.key === mealType)?.label ?? null;

export const defaultMealType = (now = new Date()): MealType => {
  const hour = now.getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 19 && hour < 23) return "dinner";
  return "snack";
};

export interface FoodRecord {
  _id: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  imageUrl: string | null;
  mealType?: MealType | null;
  createdAt: string;
}

export interface Totals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export type MacroGoals = Pick<Totals, "protein" | "carbs" | "fat">;

export const DEFAULT_CALORIE_GOAL = 2000;

// A common starting split of 25% protein, 50% carbs and 25% fat, at 4/4/9 kcal per gram.
export const defaultMacroGoals = (calories: number): MacroGoals => ({
  protein: Math.round((calories * 0.25) / 4),
  carbs: Math.round((calories * 0.5) / 4),
  fat: Math.round((calories * 0.25) / 9),
});

// Rounds to one decimal, which also hides floating point noise like 0.30000004.
export const roundOne = (value: number) => Math.round((value || 0) * 10) / 10;

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

// The calendar day on this phone, as the API stores it.
export const localDate = (date = new Date()) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

export const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

export const sumRecords = (records: FoodRecord[]): Totals => {
  const sum = (pick: (record: FoodRecord) => number) =>
    roundOne(records.reduce((total, record) => total + (pick(record) || 0), 0));
  return {
    calories: Math.round(sum((r) => r.totalCalories)),
    protein: sum((r) => r.totalProtein),
    fat: sum((r) => r.totalFat),
    carbs: sum((r) => r.totalCarbs),
  };
};

export const sumFoods = (foods: FoodItem[]): Totals => ({
  calories: Math.round(foods.reduce((sum, food) => sum + food.calories, 0)),
  protein: roundOne(foods.reduce((sum, food) => sum + food.protein, 0)),
  fat: roundOne(foods.reduce((sum, food) => sum + food.fat, 0)),
  carbs: roundOne(foods.reduce((sum, food) => sum + food.carbs, 0)),
});

export const recordsForDay = (records: FoodRecord[], day: Date) =>
  records.filter((r) => dayKey(new Date(r.createdAt)) === dayKey(day));

export const recordsForToday = (records: FoodRecord[], now = new Date()) =>
  recordsForDay(records, now);

export const lastSevenDays = (records: FoodRecord[], now = new Date()) => {
  const caloriesByDay = new Map<string, number>();
  for (const record of records) {
    const key = dayKey(new Date(record.createdAt));
    caloriesByDay.set(
      key,
      (caloriesByDay.get(key) ?? 0) + (record.totalCalories || 0),
    );
  }
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(now, index - 6);
    return {
      key: dayKey(date),
      label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      fullLabel: date.toLocaleDateString("en-IN", { weekday: "long" }),
      calories: Math.round(caloriesByDay.get(dayKey(date)) ?? 0),
      isToday: index === 6,
    };
  });
};

// A streak survives until the end of today, so it isn't lost before breakfast.
export const loggingStats = (records: FoodRecord[], now = new Date()) => {
  const logged = new Set(records.map((r) => dayKey(new Date(r.createdAt))));
  let day = logged.has(dayKey(now)) ? now : addDays(now, -1);
  let streak = 0;
  while (logged.has(dayKey(day))) {
    streak += 1;
    day = addDays(day, -1);
  }
  const week = lastSevenDays(records, now).filter((d) => d.calories > 0);
  const averageCalories = week.length
    ? Math.round(week.reduce((sum, d) => sum + d.calories, 0) / week.length)
    : 0;
  return { streak, daysLogged: week.length, averageCalories };
};

export const mealName = (record: Pick<FoodRecord, "foods">) =>
  record.foods.map((food) => food.name).join(", ");

// Newest first, with repeats of the same meal removed.
export const recentMeals = (records: FoodRecord[], limit: number) => {
  const seen = new Set<string>();
  const meals: FoodRecord[] = [];
  for (const record of records) {
    const key = mealName(record).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    meals.push(record);
    if (meals.length === limit) break;
  }
  return meals;
};

// Whole calendar days between a date and today, so a late meal still counts as yesterday.
export const daysBefore = (dateStr: string, now = new Date()) => {
  const date = new Date(dateStr);
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((start(now) - start(date)) / 86400000);
};

export const dayTitle = (date: Date, now = new Date()) => {
  const short = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
  if (dayKey(date) === dayKey(now)) return `Today, ${short}`;
  if (dayKey(date) === dayKey(addDays(now, -1))) return `Yesterday, ${short}`;
  return `${date.toLocaleDateString("en-IN", { weekday: "short" })}, ${short}`;
};

export const timeLabel = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

// Expects records newest first, as the API returns them; each group reads earliest first.
export const groupByMeal = (records: FoodRecord[]) => {
  const earliestFirst = [...records].reverse();
  const groups: { key: MealType | "other"; title: string; data: FoodRecord[] }[] = MEAL_ORDER.map((key) => ({
    key,
    title: mealLabel(key) as string,
    data: earliestFirst.filter((record) => record.mealType === key),
  }));
  // Meals saved before meal types existed have none.
  groups.push({
    key: "other",
    title: "Other",
    data: earliestFirst.filter((record) => !mealLabel(record.mealType)),
  });
  return groups.filter((group) => group.data.length > 0);
};

export const scaleFood = (food: FoodItem, quantity: number): FoodItem => {
  const ratio = quantity / food.quantity;
  return {
    ...food,
    quantity,
    calories: Math.round(food.calories * ratio),
    protein: roundOne(food.protein * ratio),
    fat: roundOne(food.fat * ratio),
    carbs: roundOne(food.carbs * ratio),
  };
};

// Reads a meal passed between screens as JSON, tolerating missing or bad values.
export const parseMeal = (raw: unknown) => {
  let parsed: Record<string, any> = {};
  try {
    parsed = JSON.parse(raw as string) ?? {};
  } catch {
    // Treated as a meal with no foods.
  }
  const foods: FoodItem[] = (parsed.foods ?? []).map((food: FoodItem) => ({
    ...food,
    quantity: Number(food.quantity) || 1,
    calories: Number(food.calories) || 0,
    protein: Number(food.protein) || 0,
    fat: Number(food.fat) || 0,
    carbs: Number(food.carbs) || 0,
  }));
  const summed = sumFoods(foods);
  const totals: Totals = {
    calories: Number(parsed.totalCalories) || summed.calories,
    protein: Number(parsed.totalProtein) || summed.protein,
    fat: Number(parsed.totalFat) || summed.fat,
    carbs: Number(parsed.totalCarbs) || summed.carbs,
  };
  return {
    foods,
    totals,
    mealType: parsed.mealType as MealType | null | undefined,
    imageUrl: parsed.imageUrl as string | null | undefined,
  };
};
