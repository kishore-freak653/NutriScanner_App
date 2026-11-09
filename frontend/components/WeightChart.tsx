import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import { colors, type } from "@/constants/design";

const HEIGHT = 120;
const PADDING = 8;

export interface WeightEntry {
  date: string;
  weightKg: number;
}

// Expects entries oldest first.
export function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const [width, setWidth] = useState(0);
  const weights = entries.map((entry) => entry.weightKg);
  const low = Math.min(...weights);
  const high = Math.max(...weights);
  // A flat line sits mid-chart rather than dividing by zero.
  const range = high - low || 1;

  const points = entries.map((entry, index) => ({
    x: PADDING + (index / Math.max(entries.length - 1, 1)) * (width - PADDING * 2),
    y: PADDING + (1 - (entry.weightKg - low) / range) * (HEIGHT - PADDING * 2),
  }));

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Weight over ${entries.length} entries, from ${low} to ${high} kilograms`}
    >
      <View style={styles.area} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            <Polyline
              points={points.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            {points.map((point, index) => (
              <Circle key={index} cx={point.x} cy={point.y} r={3.5} fill={colors.primary} />
            ))}
          </Svg>
        )}
      </View>
      <View style={styles.range}>
        <Text style={styles.label}>Lowest {low} kg</Text>
        <Text style={styles.label}>Highest {high} kg</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { height: HEIGHT },
  range: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  label: { ...type.caption, color: colors.textSecondary },
});
