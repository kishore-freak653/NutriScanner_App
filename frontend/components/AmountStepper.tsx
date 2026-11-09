import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors, fonts, radius } from "@/constants/design";
import { FoodItem, roundOne } from "@/utils/nutrition";

// Large amounts are usually grams or ml, where half-unit steps would be useless.
const stepFor = (food: FoodItem) => (food.quantity >= 20 ? 10 : 0.5);

interface AmountStepperProps {
  food: FoodItem;
  value: string;
  onChange: (value: string) => void;
}

export function AmountStepper({ food, value, onChange }: AmountStepperProps) {
  const step = stepFor(food);
  const change = (direction: 1 | -1) => {
    const next = (Number(value) || 0) + direction * step;
    onChange(String(Math.max(roundOne(next), step)));
  };

  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${food.name}`}
        hitSlop={6}
        style={styles.button}
        onPress={() => change(-1)}
      >
        <Ionicons name="remove" size={18} color={colors.primaryDark} />
      </Pressable>
      <TextInput
        accessibilityLabel={`Amount of ${food.name}`}
        style={styles.input}
        value={value}
        keyboardType="decimal-pad"
        selectTextOnFocus
        selectionColor={colors.primary}
        onChangeText={onChange}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${food.name}`}
        hitSlop={6}
        style={styles.button}
        onPress={() => change(1)}
      >
        <Ionicons name="add" size={18} color={colors.primaryDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: "row", alignItems: "center", gap: 4 },
  button: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: 46,
    height: 36,
    padding: 0,
    textAlign: "center",
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
});
