import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { DEFAULT_CALORIE_GOAL, defaultMacroGoals, MacroGoals } from "@/utils/nutrition";
import { storage } from "@/utils/storage";

const CALORIE_KEY = "calorieGoal";
const MACRO_KEY = "macroGoals";

const parseMacros = (saved: string | null): MacroGoals | null => {
  try {
    const parsed = saved ? JSON.parse(saved) : null;
    const valid = parsed && [parsed.protein, parsed.carbs, parsed.fat].every((n) => n > 0);
    return valid ? parsed : null;
  } catch {
    return null;
  }
};

// Goals live on this device. Re-read on focus to pick up edits from Profile.
export function useGoals() {
  const [goal, setGoalState] = useState(DEFAULT_CALORIE_GOAL);
  const [customMacros, setCustomMacros] = useState<MacroGoals | null>(null);

  useFocusEffect(
    useCallback(() => {
      storage.get(CALORIE_KEY).then((saved) => {
        const parsed = Number(saved);
        if (saved && parsed > 0) setGoalState(parsed);
      });
      storage.get(MACRO_KEY).then((saved) => setCustomMacros(parseMacros(saved)));
    }, []),
  );

  const setGoal = useCallback(async (value: number) => {
    setGoalState(value);
    await storage.set(CALORIE_KEY, String(value));
  }, []);

  const setMacros = useCallback(async (value: MacroGoals) => {
    setCustomMacros(value);
    await storage.set(MACRO_KEY, JSON.stringify(value));
  }, []);

  // Until someone sets their own, macro goals follow the calorie goal.
  return { goal, macros: customMacros ?? defaultMacroGoals(goal), setGoal, setMacros };
}
