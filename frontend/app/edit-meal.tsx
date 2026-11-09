/**
 * Edits a saved meal in one place: its type, its foods and their portions, with
 * the nutrition totals updating as the portions change.
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ComponentProps, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { AmountStepper } from "@/components/AmountStepper";
import { Button } from "@/components/Button";
import { MealThumb } from "@/components/MealThumb";
import { MealTypePicker } from "@/components/MealTypePicker";
import { ScreenHeader } from "@/components/ScreenHeader";
import { card, colors, fonts, type } from "@/constants/design";
import { MACRO_STYLES } from "@/constants/nutritionStyles";
import { API, getErrorMessage } from "@/utils/api";
import {
  defaultMealType,
  MEAL_TYPES,
  parseMeal,
  roundOne,
  scaleFood,
  sumFoods,
} from "@/utils/nutrition";

function NutritionTile({
  icon,
  color,
  background,
  value,
  label,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  color: string;
  background: string;
  value: string;
  label: string;
}) {
  return (
    <View
      style={[styles.tile, { backgroundColor: background }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.tileValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function EditMealScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, recordId } = useLocalSearchParams();
  const saved = useMemo(() => parseMeal(data), [data]);

  const [foods, setFoods] = useState(saved.foods);
  const [amounts, setAmounts] = useState(() => saved.foods.map((food) => String(food.quantity)));
  const [mealType, setMealType] = useState(
    () => MEAL_TYPES.find((meal) => meal.key === saved.mealType)?.key ?? defaultMealType(),
  );
  const [saving, setSaving] = useState(false);

  const scaled = foods.map((food, index) => scaleFood(food, Number(amounts[index]) || 0));
  const portionsChanged =
    foods.length !== saved.foods.length ||
    amounts.some((amount, index) => Number(amount) !== foods[index].quantity);
  // A saved total can differ slightly from its foods, so leave it alone unless portions change.
  const totals = portionsChanged ? sumFoods(scaled) : saved.totals;

  const removeFood = (index: number) => {
    setFoods((current) => current.filter((_, i) => i !== index));
    setAmounts((current) => current.filter((_, i) => i !== index));
  };

  const update = async () => {
    if (foods.some((food) => !food.name.trim())) {
      Toast.show({ type: "error", text1: "Every food needs a name" });
      return;
    }
    if (amounts.some((amount) => !(Number(amount) > 0))) {
      Toast.show({
        type: "error",
        text1: "Check your amounts",
        text2: "Each amount needs to be a number above 0.",
      });
      return;
    }
    try {
      setSaving(true);
      await API.put(`/food/${recordId}`, {
        foods: scaled,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalFat: totals.fat,
        totalCarbs: totals.carbs,
        mealType,
      });
      Toast.show({ type: "success", text1: "Meal updated" });
      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Couldn't update this meal",
        text2: getErrorMessage(error, "Please try again."),
      });
      setSaving(false);
    }
  };

  const title = foods.map((food) => food.name).join(" + ");

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Edit Meal" onBack={() => router.back()} />

        <View style={styles.hero}>
          <MealThumb id={String(recordId)} name={title} uri={saved.imageUrl} size={104} round />
          <Text style={styles.mealTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Meal Type</Text>
        <MealTypePicker value={mealType} onChange={setMealType} />

        <Text style={styles.sectionTitle}>Portion</Text>
        {foods.map((food, index) => (
          <View key={index} style={styles.portion}>
            {foods.length > 1 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${food.name}`}
                hitSlop={8}
                onPress={() => removeFood(index)}
              >
                <Ionicons name="close-circle-outline" size={22} color={colors.error} />
              </Pressable>
            )}
            <View style={styles.portionText}>
              <TextInput
                accessibilityLabel={`Name of food ${index + 1}`}
                style={styles.foodName}
                value={food.name}
                selectionColor={colors.primary}
                onChangeText={(name) =>
                  setFoods((current) =>
                    current.map((item, i) => (i === index ? { ...item, name } : item)),
                  )
                }
              />
              <Text style={styles.foodUnit} numberOfLines={1}>
                {food.unit}
              </Text>
            </View>
            <AmountStepper
              food={food}
              value={amounts[index]}
              onChange={(value) =>
                setAmounts((current) =>
                  current.map((amount, i) => (i === index ? value : amount)),
                )
              }
            />
          </View>
        ))}

        <View style={styles.tiles}>
          <NutritionTile
            icon="flame"
            color={colors.carbs}
            background={colors.surface}
            value={totals.calories.toLocaleString("en-IN")}
            label="kcal"
          />
          {MACRO_STYLES.map(({ key, label, icon, color, background }) => (
            <NutritionTile
              key={key}
              icon={icon}
              color={color}
              background={background}
              value={`${roundOne(totals[key])} g`}
              label={label}
            />
          ))}
        </View>

        <Button label="Update Meal" loading={saving} onPress={update} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 16 },
  hero: { alignItems: "center", marginBottom: 16 },
  mealTitle: { ...type.h3, color: colors.textPrimary, textAlign: "center", marginTop: 10 },
  sectionTitle: { ...type.h3, fontSize: 14, lineHeight: 20, color: colors.textPrimary, marginBottom: 8 },
  portion: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    marginBottom: 8,
  },
  portionText: { flex: 1 },
  foodName: { ...type.body, fontFamily: fonts.semibold, color: colors.textPrimary, padding: 0 },
  foodUnit: { ...type.caption, color: colors.textSecondary, marginTop: 1 },
  tiles: { flexDirection: "row", gap: 6, marginTop: 8, marginBottom: 16 },
  tile: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 12 },
  tileValue: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  tileLabel: { ...type.caption, fontSize: 11, color: colors.textSecondary },
});
