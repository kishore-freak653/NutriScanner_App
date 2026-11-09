import { TextStyle, ViewStyle } from "react-native";

export const colors = {
  background: "#F7FAF9",
  surface: "#FFFFFF",
  border: "#E3EBE7",

  primary: "#16A344",
  primaryDark: "#0E7A3A",
  primaryLight: "#E7F6EC",

  accent: "#F59E0B",
  success: "#10B981",
  error: "#EF4444",
  errorDark: "#B91C1C",
  errorLight: "#FEECEC",

  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  onPrimary: "#FFFFFF",

  protein: "#C81E1E",
  proteinLight: "#FDECEC",
  carbs: "#B45309",
  carbsLight: "#FEF3C7",
  fat: "#15803D",
  fatLight: "#DCFCE7",
  water: "#0369A1",
  waterLight: "#E0F2FE",
  dinner: "#4338CA",
};

export const fonts = {
  regular: "Inter_400Regular",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export const radius = { card: 12, button: 12, input: 16, chip: 16, full: 999 };

export const type = {
  h1: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26 },
  h3: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
} satisfies Record<string, TextStyle>;

export const cardShadow: ViewStyle = {
  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
};

export const card: ViewStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  ...cardShadow,
};
