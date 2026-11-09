/**
 * Reviews a new meal before saving it, whatever its source: a scan, a typed
 * description, a barcode or a manual entry. When amounts are uncertain the user
 * confirms them first.
 */

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ComponentProps, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { AmountStepper } from "@/components/AmountStepper";
import { Button } from "@/components/Button";
import { MacroChips } from "@/components/MacroChips";
import { MealTypePicker } from "@/components/MealTypePicker";
import { ScreenHeader } from "@/components/ScreenHeader";
import { card, colors, fonts, radius, type } from "@/constants/design";
import { API, getErrorMessage } from "@/utils/api";
import { defaultMealType, parseMeal, roundOne, scaleFood, sumFoods, Totals } from "@/utils/nutrition";
import { encodePhoto, SAVED_PHOTO_SIDE } from "@/utils/photo";

const NOTICES: Record<string, string> = {
  scan: "These are AI estimates and may vary slightly from actual values.",
  text: "These are AI estimates and may vary slightly from actual values.",
  barcode: "From Open Food Facts, a community database. Check it against the packet.",
};

function ActionTile({
  label,
  icon,
  color,
  background,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  color: string;
  background: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: background },
        (pressed || disabled) && styles.tileDimmed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Ionicons name={icon} size={20} color={color} />
      )}
      <Text style={[styles.tileLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, imageUri, needsQuantity, source } = useLocalSearchParams();
  const { foods: scannedFoods, totals: scannedTotals } = useMemo(() => parseMeal(data), [data]);
  const notice = NOTICES[source as string];

  const [editing, setEditing] = useState(needsQuantity === "true");
  // Amounts always scale from these, so repeated edits don't compound rounding.
  const [foods, setFoods] = useState(scannedFoods);
  const [amounts, setAmounts] = useState(() => scannedFoods.map((food) => String(food.quantity)));
  const [currentFoods, setCurrentFoods] = useState(scannedFoods);
  const [mealType, setMealType] = useState(() => defaultMealType());
  const [totals, setTotals] = useState<Totals>(scannedTotals);
  const [saving, setSaving] = useState(false);

  const renameFood = (index: number, name: string) =>
    setFoods((current) => current.map((food, i) => (i === index ? { ...food, name } : food)));

  const removeFood = (index: number) => {
    setFoods((current) => current.filter((_, i) => i !== index));
    setAmounts((current) => current.filter((_, i) => i !== index));
  };

  const applyAmounts = () => {
    if (foods.some((food) => !food.name.trim())) {
      Toast.show({ type: "error", text1: "Every food needs a name" });
      return;
    }
    const values = amounts.map(Number);
    if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
      Toast.show({
        type: "error",
        text1: "Check your amounts",
        text2: "Each amount needs to be a number above 0.",
      });
      return;
    }
    const scaled = foods.map((food, index) => scaleFood(food, values[index]));
    setCurrentFoods(scaled);
    setTotals(sumFoods(scaled));
    setEditing(false);
  };

  const save = async () => {
    try {
      setSaving(true);
      const meal = {
        foods: currentFoods,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalFat: totals.fat,
        totalCarbs: totals.carbs,
        mealType,
      };
      const haptic = () => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      };

      // A photo that can't be prepared shouldn't stop the meal being saved.
      const encoded =
        source === "scan" && imageUri
          ? await encodePhoto(imageUri as string, SAVED_PHOTO_SIDE).catch(() => null)
          : null;
      const res = await API.post("/food/scan", { ...meal, image: encoded?.base64 });
      haptic();
      const photoLost = source === "scan" && (!encoded || res.data.photoSaved === false);
      Toast.show({
        type: "success",
        text1: "Saved to your day",
        text2: photoLost ? "The photo couldn't be saved." : undefined,
      });
      router.dismissTo("/(tabs)");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Couldn't save this meal",
        text2: getErrorMessage(error, "Please try again."),
      });
      setSaving(false);
    }
  };

  const share = () =>
    Share.share({
      message:
        `${currentFoods.map((food) => food.name).join(", ")}\n\n` +
        `Calories: ${totals.calories} kcal\n` +
        `Protein: ${totals.protein}g\n` +
        `Carbs: ${totals.carbs}g\n` +
        `Fat: ${totals.fat}g\n\n` +
        `Estimated with NutriScan`,
    }).catch(() => undefined);

  const noFoods = foods.length === 0;
  const photo = imageUri ? (
    <Image
      source={{ uri: imageUri as string }}
      style={[styles.photo, editing && styles.photoShort]}
      contentFit="cover"
      accessibilityLabel="Scanned food photo"
    />
  ) : null;

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
        {noFoods ? (
          <>
            <ScreenHeader title="Meal results" onBack={() => router.back()} />
            {photo}
            <View style={styles.noFoods}>
              <Text style={styles.foodsTitle}>No food found</Text>
              <Text style={styles.noFoodsText}>
                We didn&apos;t spot any food in that photo. Try a closer shot in better light.
              </Text>
              <Button label="Try another photo" icon="camera-outline" onPress={() => router.back()} />
            </View>
          </>
        ) : editing ? (
          <>
            <ScreenHeader
              title="Confirm amounts"
              subtitle="Adjust the quantities if needed"
              onBack={() => router.back()}
            />
            {photo}
            {foods.map((food, index) => (
              <View key={index} style={styles.amountRow}>
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
                <View style={styles.amountText}>
                  <TextInput
                    accessibilityLabel={`Name of food ${index + 1}`}
                    style={[styles.foodName, styles.nameInput]}
                    value={food.name}
                    selectionColor={colors.primary}
                    onChangeText={(name) => renameFood(index, name)}
                  />
                  <Text style={styles.foodDetail} numberOfLines={1}>
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
            <Button
              label="Update nutrition"
              trailingIcon="arrow-forward"
              onPress={applyAmounts}
              style={styles.update}
            />
          </>
        ) : (
          <>
            <ScreenHeader title="Meal results" onBack={() => router.back()} />
            {photo}
            <Text style={styles.foodsTitle} numberOfLines={2}>
              {currentFoods.map((food) => food.name).join(" + ")}
            </Text>

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total calories</Text>
              <Text style={styles.totalValue}>
                {totals.calories.toLocaleString("en-IN")} kcal
              </Text>
              <MacroChips totals={totals} />
            </View>

            <MealTypePicker value={mealType} onChange={setMealType} />

            <Text style={styles.sectionTitle}>Breakdown</Text>
            {currentFoods.map((food, index) => (
              <View key={index} style={styles.breakdownRow}>
                <View style={styles.amountIcon}>
                  <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.amountText}>
                  <Text style={styles.foodName} numberOfLines={1}>
                    {food.name}
                  </Text>
                  <Text style={styles.foodDetail} numberOfLines={1}>
                    {roundOne(food.quantity)} {food.unit} · {food.calories.toLocaleString("en-IN")} kcal
                  </Text>
                  <Text style={styles.foodDetail} numberOfLines={1}>
                    P {food.protein}g · C {food.carbs}g · F {food.fat}g
                  </Text>
                </View>
              </View>
            ))}

            {notice && (
              <View style={styles.notice}>
                <Ionicons name="information-circle-outline" size={18} color={colors.carbs} />
                <Text style={styles.noticeText}>{notice}</Text>
              </View>
            )}

            <Button label="Edit amounts" variant="outlined" onPress={() => setEditing(true)} />

            <View style={styles.tiles}>
              <ActionTile
                label="Share"
                icon="share-social-outline"
                color={colors.primaryDark}
                background={colors.primaryLight}
                disabled={saving}
                onPress={share}
              />
              <ActionTile
                label="Save"
                icon="bookmark-outline"
                color={colors.onPrimary}
                background={colors.primary}
                loading={saving}
                onPress={save}
              />
              <ActionTile
                label="Discard"
                icon="trash-outline"
                color={colors.errorDark}
                background={colors.errorLight}
                disabled={saving}
                onPress={() => router.back()}
              />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 16 },
  photo: { width: "100%", height: 200, borderRadius: radius.card, marginBottom: 12 },
  photoShort: { height: 160 },
  noFoods: { marginTop: 4 },
  noFoodsText: { ...type.body, color: colors.textSecondary, marginBottom: 16 },
  foodsTitle: { ...type.h2, color: colors.textPrimary, marginBottom: 10 },
  totalCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 16,
  },
  totalLabel: { ...type.body, color: colors.textPrimary, textAlign: "center" },
  totalValue: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.primaryDark,
    textAlign: "center",
    marginBottom: 10,
  },
  sectionTitle: { ...type.h3, color: colors.textPrimary, marginBottom: 8 },
  breakdownRow: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    marginBottom: 8,
  },
  amountRow: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    marginBottom: 8,
  },
  amountIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  amountText: { flex: 1 },
  nameInput: { padding: 0 },
  foodName: { ...type.body, fontFamily: fonts.semibold, color: colors.textPrimary },
  foodDetail: { ...type.caption, color: colors.textSecondary, marginTop: 1 },
  update: { marginTop: 12 },
  notice: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.carbsLight,
    borderRadius: radius.card,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  noticeText: { ...type.caption, flex: 1, color: colors.textPrimary },
  tiles: { flexDirection: "row", gap: 8, marginTop: 12 },
  tile: {
    flex: 1,
    height: 62,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tileDimmed: { opacity: 0.7 },
  tileLabel: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
});
