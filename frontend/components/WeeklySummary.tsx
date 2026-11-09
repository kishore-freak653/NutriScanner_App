import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { card, colors, fonts, type } from "@/constants/design";

interface WeeklySummaryProps {
  streak: number;
  daysLogged: number;
  averageCalories: number;
}

function Stat({
  icon,
  color,
  value,
  label,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  color: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function WeeklySummary({ streak, daysLogged, averageCalories }: WeeklySummaryProps) {
  return (
    <View style={styles.row}>
      <Stat
        icon="flame"
        color={colors.accent}
        value={`${streak} ${streak === 1 ? "day" : "days"}`}
        label="Streak"
      />
      <Stat
        icon="calendar-outline"
        color={colors.primary}
        value={`${daysLogged} of 7`}
        label="Days logged"
      />
      <Stat
        icon="analytics-outline"
        color={colors.primary}
        value={averageCalories.toLocaleString("en-IN")}
        label="Avg kcal a day"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginTop: 16 },
  stat: { ...card, flex: 1, alignItems: "center", paddingVertical: 12, paddingHorizontal: 6 },
  value: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
    marginTop: 4,
  },
  label: { ...type.caption, fontSize: 11, color: colors.textSecondary },
});
