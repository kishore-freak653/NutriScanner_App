import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { MACRO_STYLES } from "@/constants/nutritionStyles";
import { colors, fonts, radius, type } from "@/constants/design";
import { MacroGoals, roundOne, Totals } from "@/utils/nutrition";

interface MacroBarsProps {
  totals: Pick<Totals, "protein" | "carbs" | "fat">;
  goals: MacroGoals;
}

export function MacroBars({ totals, goals }: MacroBarsProps) {
  return (
    <View style={styles.list}>
      {MACRO_STYLES.map(({ key, label, icon, color, background }) => {
        const value = `${roundOne(totals[key]).toLocaleString("en-IN")} / ${goals[key].toLocaleString("en-IN")} g`;
        const percent = Math.min((totals[key] / Math.max(goals[key], 1)) * 100, 100);
        return (
          <View key={key} style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
            <Ionicons name={icon} size={18} color={color} />
            <View style={styles.text}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
                {value}
              </Text>
              <View style={[styles.track, { backgroundColor: background }]}>
                <View style={[styles.fill, { backgroundColor: color, width: `${percent}%` }]} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, gap: 10 },
  row: { flexDirection: "row", gap: 8 },
  text: { flex: 1 },
  label: { ...type.caption, color: colors.textSecondary },
  value: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.textPrimary },
  track: { height: 4, marginTop: 3, borderRadius: radius.full, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.full },
});
