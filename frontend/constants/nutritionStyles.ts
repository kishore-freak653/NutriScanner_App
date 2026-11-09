import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { colors } from "@/constants/design";
import { MacroGoals, MealType } from "@/utils/nutrition";

type IconName = ComponentProps<typeof Ionicons>["name"];

export const MEAL_STYLES: Record<MealType | "other", { icon: IconName; color: string }> = {
  breakfast: { icon: "sunny-outline", color: colors.carbs },
  lunch: { icon: "restaurant-outline", color: colors.primaryDark },
  dinner: { icon: "moon-outline", color: colors.dinner },
  snack: { icon: "cafe-outline", color: colors.protein },
  other: { icon: "ellipse-outline", color: colors.textSecondary },
};

export const MACRO_STYLES: {
  key: keyof MacroGoals;
  label: string;
  icon: IconName;
  color: string;
  background: string;
}[] = [
  { key: "protein", label: "Protein", icon: "barbell-outline", color: colors.protein, background: colors.proteinLight },
  { key: "carbs", label: "Carbs", icon: "leaf-outline", color: colors.carbs, background: colors.carbsLight },
  { key: "fat", label: "Fat", icon: "water-outline", color: colors.fat, background: colors.fatLight },
];
