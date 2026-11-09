/**
 * Adds a meal without a photo. Search Food finds past meals or asks the AI to
 * estimate a description; Quick Add takes the numbers directly. All of them
 * finish on the result screen.
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { MealThumb } from "@/components/MealThumb";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TextField } from "@/components/TextField";
import { card, colors, fonts, radius, type } from "@/constants/design";
import { useFoodRecords } from "@/hooks/useFoodRecords";
import { API, getErrorMessage } from "@/utils/api";
import { FoodItem, mealName, recentMeals } from "@/utils/nutrition";

const LIST_LIMIT = 8;
const SEARCH_POOL = 200;

type Tab = "search" | "quick";
const TABS: { key: Tab; label: string }[] = [
  { key: "search", label: "Search Food" },
  { key: "quick", label: "Quick Add" },
];

const toNumber = (value: string) => Number(value.replace(",", "."));

export default function AddMealScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { records } = useFoodRecords();

  const [tab, setTab] = useState<Tab>(params.tab === "quick" ? "quick" : "search");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [estimating, setEstimating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    quantity: "1",
    unit: "serving",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const setField = (field: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const pastMeals = useMemo(() => recentMeals(records, SEARCH_POOL), [records]);
  const search = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      pastMeals
        .filter((meal) => !search || mealName(meal).toLowerCase().includes(search))
        .slice(0, LIST_LIMIT),
    [pastMeals, search],
  );
  const selected = pastMeals.filter((meal) => selectedIds.includes(meal._id));

  const toggle = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const addSelected = () =>
    router.push({
      pathname: "/result",
      params: {
        data: JSON.stringify(
          selected.length === 1
            ? selected[0]
            : { foods: selected.flatMap((meal) => meal.foods) },
        ),
        source: "manual",
      },
    });

  const estimate = async () => {
    try {
      setEstimating(true);
      const res = await API.post("/food/estimate", { text: query.trim() });
      router.push({
        pathname: "/result",
        params: {
          data: JSON.stringify(res.data),
          needsQuantity: res.data.needsQuantityInput ? "true" : "false",
          source: "text",
        },
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Couldn't estimate that meal",
        text2: getErrorMessage(err, "Try again, or enter it yourself in Quick Add."),
      });
    } finally {
      setEstimating(false);
    }
  };

  const reviewForm = () => {
    const name = form.name.trim();
    const quantity = toNumber(form.quantity);
    const numbers = [form.calories, form.protein || "0", form.carbs || "0", form.fat || "0"].map(toNumber);
    const invalid =
      !name ||
      !form.calories.trim() ||
      !(quantity > 0) ||
      numbers.some((number) => !Number.isFinite(number) || number < 0);
    if (invalid) {
      Toast.show({
        type: "error",
        text1: "Check your meal",
        text2: "It needs a name, an amount above 0, and calories.",
      });
      return;
    }
    const [calories, protein, carbs, fat] = numbers;
    const food: FoodItem = {
      name,
      quantity,
      unit: form.unit.trim() || "serving",
      calories: Math.round(calories),
      protein,
      carbs,
      fat,
    };
    router.push({
      pathname: "/result",
      params: { data: JSON.stringify({ foods: [food] }), source: "manual" },
    });
  };

  const showAddBar = tab === "search" && selected.length > 0;

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: showAddBar ? 16 : insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Add Meal" onBack={() => router.back()} />

        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map(({ key, label }) => (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: tab === key }}
              style={[styles.tab, tab === key && styles.tabActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === "search" ? (
          <>
            <TextField
              label="Search or describe your meal"
              icon="search-outline"
              placeholder="e.g. 2 rotis with dal and salad"
              value={query}
              onChangeText={setQuery}
              maxLength={300}
            />
            <View style={styles.pair}>
              <Button
                label="Estimate with AI"
                icon="sparkles-outline"
                variant="soft"
                loading={estimating}
                disabled={!query.trim()}
                onPress={estimate}
                style={styles.half}
              />
              <Button
                label="Barcode"
                icon="barcode-outline"
                variant="soft"
                onPress={() => router.push("/barcode")}
                style={styles.half}
              />
            </View>

            {matches.length > 0 ? (
              <Text style={styles.sectionTitle}>
                {search ? "Matching past meals" : "Your past meals"}
              </Text>
            ) : (
              <Text style={styles.emptyText}>
                {search
                  ? "No past meal matches that. Tap Estimate with AI to get its nutrition."
                  : "Meals you log will appear here, ready to add again."}
              </Text>
            )}
            {matches.map((meal) => {
              const name = mealName(meal);
              const isSelected = selectedIds.includes(meal._id);
              return (
                <Pressable
                  key={meal._id}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`Select ${name}`}
                  accessibilityState={{ checked: isSelected }}
                  style={({ pressed }) => [
                    styles.meal,
                    isSelected && styles.mealSelected,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => toggle(meal._id)}
                >
                  <MealThumb id={meal._id} name={name} uri={meal.imageUrl} size={44} />
                  <View style={styles.mealText}>
                    <Text style={styles.mealName} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={styles.mealDetail}>
                      {Math.round(meal.totalCalories || 0).toLocaleString("en-IN")} kcal
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                    size={26}
                    color={colors.primary}
                  />
                </Pressable>
              );
            })}
          </>
        ) : (
          <>
            <TextField
              label="Food name"
              icon="fast-food-outline"
              value={form.name}
              onChangeText={setField("name")}
            />
            <View style={styles.pair}>
              <View style={styles.half}>
                <TextField
                  label="Amount"
                  icon="layers-outline"
                  keyboardType="decimal-pad"
                  value={form.quantity}
                  onChangeText={setField("quantity")}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  label="Unit"
                  icon="pricetag-outline"
                  value={form.unit}
                  onChangeText={setField("unit")}
                />
              </View>
            </View>
            <TextField
              label="Calories (kcal)"
              icon="flame-outline"
              keyboardType="decimal-pad"
              value={form.calories}
              onChangeText={setField("calories")}
            />
            <View style={styles.pair}>
              <View style={styles.half}>
                <TextField
                  label="Protein (g)"
                  icon="barbell-outline"
                  keyboardType="decimal-pad"
                  value={form.protein}
                  onChangeText={setField("protein")}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  label="Carbs (g)"
                  icon="leaf-outline"
                  keyboardType="decimal-pad"
                  value={form.carbs}
                  onChangeText={setField("carbs")}
                />
              </View>
            </View>
            <TextField
              label="Fat (g)"
              icon="water-outline"
              keyboardType="decimal-pad"
              value={form.fat}
              onChangeText={setField("fat")}
            />
            <Button label="Review meal" trailingIcon="arrow-forward" onPress={reviewForm} />
          </>
        )}
      </ScrollView>

      {showAddBar && (
        <View style={[styles.addBar, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            label={`Add Selected (${selected.length} ${selected.length === 1 ? "item" : "items"})`}
            onPress={addSelected}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 16 },
  tabs: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    marginBottom: 16,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
  },
  tabActive: { backgroundColor: colors.primary },
  tabLabel: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.primaryDark },
  tabLabelActive: { color: colors.onPrimary },
  pair: { flexDirection: "row", gap: 8 },
  half: { flex: 1 },
  sectionTitle: { ...type.h3, color: colors.textPrimary, marginTop: 20, marginBottom: 8 },
  emptyText: { ...type.body, color: colors.textSecondary, textAlign: "center", marginTop: 32 },
  meal: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  mealSelected: { borderColor: colors.primary },
  pressed: { opacity: 0.7 },
  mealText: { flex: 1 },
  mealName: { ...type.body, fontFamily: fonts.semibold, color: colors.textPrimary },
  mealDetail: { ...type.caption, color: colors.textSecondary },
  addBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
