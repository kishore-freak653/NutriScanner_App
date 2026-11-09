import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius } from "@/constants/design";
import { MEAL_STYLES } from "@/constants/nutritionStyles";
import { MEAL_TYPES, MealType } from "@/utils/nutrition";

interface MealTypePickerProps {
  value: MealType;
  onChange: (value: MealType) => void;
}

export function MealTypePicker({ value, onChange }: MealTypePickerProps) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Meal type">
      {MEAL_TYPES.map(({ key, label }) => {
        const selected = key === value;
        return (
          <Pressable
            key={key}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ checked: selected }}
            style={[styles.tile, selected && styles.tileSelected]}
            onPress={() => onChange(key)}
          >
            <Ionicons
              name={MEAL_STYLES[key].icon}
              size={20}
              color={selected ? colors.primaryDark : colors.textSecondary}
            />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.label, selected && styles.labelSelected]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, marginBottom: 16 },
  tile: {
    flex: 1,
    minHeight: 62,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 4,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tileSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  label: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  labelSelected: { color: colors.primaryDark },
});
