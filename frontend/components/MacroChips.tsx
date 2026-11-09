import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, type } from "@/constants/design";
import { MACRO_STYLES } from "@/constants/nutritionStyles";
import { roundOne, Totals } from "@/utils/nutrition";

interface MacroChipsProps {
  totals: Pick<Totals, "protein" | "carbs" | "fat">;
}

export function MacroChips({ totals }: MacroChipsProps) {
  return (
    <View style={styles.row}>
      {MACRO_STYLES.map(({ key, label, color, background }) => (
        <View key={key} style={[styles.chip, { backgroundColor: background }]}>
          <Text style={styles.label}>{label}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.value, { color }]}>
            {roundOne(totals[key]).toLocaleString("en-IN")}g
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  chip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: radius.chip,
  },
  label: { ...type.caption, color: colors.textPrimary },
  value: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, marginTop: 2 },
});
