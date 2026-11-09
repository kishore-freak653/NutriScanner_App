import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { card, colors, fonts, type } from "@/constants/design";
import { FoodRecord, mealName } from "@/utils/nutrition";

interface QuickAddProps {
  meals: FoodRecord[];
  onAdd: (meal: FoodRecord) => void;
}

export function QuickAdd({ meals, onAdd }: QuickAddProps) {
  if (meals.length === 0) return null;

  return (
    <View>
      <Text style={styles.title}>Log again</Text>
      {/* Bleeds to the screen edges so the row reads as scrollable. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroller}
        contentContainerStyle={styles.row}
      >
        {meals.map((meal) => {
          const name = mealName(meal);
          const calories = Math.round(meal.totalCalories || 0).toLocaleString("en-IN");
          return (
            <Pressable
              key={meal._id}
              accessibilityRole="button"
              accessibilityLabel={`Log ${name} again, ${calories} calories`}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              onPress={() => onAdd(meal)}
            >
              <View style={styles.tileText}>
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={styles.calories}>{calories} kcal</Text>
              </View>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h3, color: colors.textPrimary, marginTop: 20, marginBottom: 8 },
  scroller: { marginHorizontal: -16, overflow: "visible" },
  row: { gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  tile: {
    ...card,
    width: 190,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  pressed: { opacity: 0.7 },
  tileText: { flex: 1 },
  name: { ...type.body, fontFamily: fonts.semibold, color: colors.textPrimary },
  calories: { ...type.caption, color: colors.textSecondary },
});
