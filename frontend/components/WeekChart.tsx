import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, type } from "@/constants/design";

const BAR_AREA = 76;

interface Day {
  key: string;
  label: string;
  fullLabel: string;
  calories: number;
  isToday: boolean;
}

export function WeekChart({ days, goal }: { days: Day[]; goal: number }) {
  // The goal sets the minimum scale, so one small meal doesn't fill the chart.
  const scale = Math.max(goal, ...days.map((day) => day.calories), 1);
  const summary = days.map((d) => `${d.fullLabel} ${d.calories}`).join(", ");

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Calories for the last seven days: ${summary}. Goal ${goal}.`}
    >
      <View style={styles.bars}>
        {days.map((day) => (
          <View key={day.key} style={styles.column}>
            <View
              style={[
                styles.bar,
                {
                  height: day.calories ? Math.max((day.calories / scale) * BAR_AREA, 8) : 4,
                  backgroundColor: day.isToday
                    ? colors.primary
                    : day.calories
                      ? "#9FDDB5"
                      : colors.primaryLight,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {days.map((day) => (
          <Text key={day.key} style={[styles.label, day.isToday && styles.labelToday]}>
            {day.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { height: BAR_AREA, flexDirection: "row", alignItems: "flex-end", gap: 10 },
  column: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: "100%", maxWidth: 26, borderRadius: 6 },
  labels: { flexDirection: "row", gap: 10, marginTop: 8 },
  label: { ...type.caption, fontSize: 11, flex: 1, textAlign: "center", color: colors.textSecondary },
  labelToday: { fontFamily: fonts.semibold, color: colors.primaryDark },
});
