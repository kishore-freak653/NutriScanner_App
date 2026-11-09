import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, fonts, type } from "@/constants/design";

const SIZE = 144;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CalorieRingProps {
  consumed: number;
  goal: number;
}

export function CalorieRing({ consumed, goal }: CalorieRingProps) {
  const over = consumed > goal;
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const difference = Math.abs(goal - consumed).toLocaleString("en-IN");
  const status = `${difference} ${over ? "over" : "left"}`;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${consumed} of ${goal} calories today, ${status}`}
    >
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.primaryLight}
          strokeWidth={STROKE}
          fill="none"
        />
        {progress > 0 && (
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={over ? colors.accent : colors.primary}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        )}
      </Svg>
      <View style={styles.center}>
        <Text style={styles.value}>{consumed.toLocaleString("en-IN")}</Text>
        <Text style={styles.ofGoal}>of {goal.toLocaleString("en-IN")} kcal</Text>
        <Text style={[styles.status, over && styles.statusOver]}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: SIZE, height: SIZE },
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  value: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, color: colors.textPrimary },
  ofGoal: { ...type.caption, fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  status: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.primaryDark, marginTop: 2 },
  statusOver: { color: colors.carbs },
});
