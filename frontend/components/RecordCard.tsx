import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MealThumb } from "@/components/MealThumb";
import { card, colors, fonts, type } from "@/constants/design";
import { MEAL_STYLES } from "@/constants/nutritionStyles";
import { FoodRecord, mealLabel, mealName, roundOne, timeLabel } from "@/utils/nutrition";

interface RecordCardProps {
  record: FoodRecord;
  onDelete?: (id: string) => void;
  onPress?: (record: FoodRecord) => void;
  /** Off where the meal type is already shown, such as under a section heading. */
  showMealType?: boolean;
}

function RecordCardBase({ record, onDelete, onPress, showMealType = true }: RecordCardProps) {
  const names = mealName(record);
  const label = mealLabel(record.mealType);
  const time = timeLabel(record.createdAt);
  const calories = `${Math.round(record.totalCalories || 0).toLocaleString("en-IN")} kcal`;
  const macros = `P ${roundOne(record.totalProtein)}g · C ${roundOne(record.totalCarbs)}g · F ${roundOne(record.totalFat)}g`;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={onPress ? `Edit ${names}` : undefined}
        disabled={!onPress}
        onPress={() => onPress?.(record)}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <MealThumb id={record._id} name={names} uri={record.imageUrl} />

        <View style={styles.body}>
          {showMealType ? (
            <>
              <Text style={styles.detail} numberOfLines={1}>
                {label && (
                  <Text
                    style={[
                      styles.mealType,
                      { color: MEAL_STYLES[record.mealType ?? "other"].color },
                    ]}
                  >
                    {label} ·{" "}
                  </Text>
                )}
                {time}
              </Text>
              <Text style={styles.names} numberOfLines={1}>
                {names}
              </Text>
              <Text style={styles.detail} numberOfLines={1}>
                {calories} · {macros}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.names} numberOfLines={1}>
                {names}
              </Text>
              <Text style={styles.detail} numberOfLines={1}>
                {time} · {calories}
              </Text>
              <Text style={styles.detail} numberOfLines={1}>
                {macros}
              </Text>
            </>
          )}
        </View>
      </Pressable>

      {onDelete && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${names}`}
          hitSlop={12}
          onPress={() => onDelete(record._id)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </Pressable>
      )}
    </View>
  );
}

export const RecordCard = memo(RecordCardBase);

const styles = StyleSheet.create({
  card: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    marginBottom: 8,
  },
  main: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  pressed: { opacity: 0.7 },
  body: { flex: 1 },
  names: { ...type.body, fontFamily: fonts.semibold, color: colors.textPrimary },
  mealType: { fontFamily: fonts.semibold },
  detail: { ...type.caption, color: colors.textSecondary, marginTop: 1 },
});
