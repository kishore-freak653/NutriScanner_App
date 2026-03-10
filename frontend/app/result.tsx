/**
 * result.tsx
 * Displays AI-detected food nutrition results.
 *
 * Two modes:
 *  - Quantity Mode (needsQuantity=true): shows editable quantity inputs first,
 *    then calculates nutrition on confirm.
 *  - Direct Mode (needsQuantity=false): skips straight to nutrition results.
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
 // ✅ fixed path

import * as SecureStore from "expo-secure-store";
import colors from "./constants/color";
import { API } from "./utils/axiosInstance";

export default function ResultScreen() {
  const router = useRouter();
  const { data, imageUri, needsQuantity } = useLocalSearchParams();
  const [saving, setSaving] = useState(false);

  // ─── Parse AI result from navigation params ───
  const isQuantityMode = needsQuantity === "true";
  const result = JSON.parse(data as string);
  const foods = result.foods || [];

  // ─── State ────────────────────────────────────
  // quantities: tracks user-edited amounts per food name
  const [quantities, setQuantities] = useState<{ [key: string]: number }>(
    Object.fromEntries(foods.map((f: any) => [f.name, f.quantity])),
  );
  // calculated: false = show quantity inputs, true = show results
  const [calculated, setCalculated] = useState(!isQuantityMode);
  const [updatedFoods, setUpdatedFoods] = useState(foods);
  const [totals, setTotals] = useState({
    calories: result.totalCalories,
    protein: result.totalProtein,
    fat: result.totalFat,
    carbs: result.totalCarbs,
  });

  // ─── Recalculate nutrition based on user-entered quantities ───
  /**
   * Scales each food item's nutrition proportionally to the new quantity.
   * Formula: newValue = originalValue * (newQty / originalQty)
   */
  const recalculate = () => {
    const newFoods = foods.map((food: any) => {
      const newQty = quantities[food.name] || food.quantity;
      const ratio = newQty / food.quantity; // scaling factor

      return {
        ...food,
        quantity: newQty,
        calories: Math.round(food.calories * ratio), // integer
        protein: Math.round(food.protein * ratio * 10) / 10, // 1 decimal
        fat: Math.round(food.fat * ratio * 10) / 10,
        carbs: Math.round(food.carbs * ratio * 10) / 10,
      };
    });

    setUpdatedFoods(newFoods);

    // Sum up totals across all updated food items
    setTotals({
      calories: newFoods.reduce((s: number, f: any) => s + f.calories, 0),
      protein:
        Math.round(
          newFoods.reduce((s: number, f: any) => s + f.protein, 0) * 10,
        ) / 10,
      fat:
        Math.round(newFoods.reduce((s: number, f: any) => s + f.fat, 0) * 10) /
        10,
      carbs:
        Math.round(
          newFoods.reduce((s: number, f: any) => s + f.carbs, 0) * 10,
        ) / 10,
    });

    setCalculated(true); // switch to results view
  };

  // ─── Save confirmed scan to MongoDB via backend ───
  const saveToHistory = async () => {
    try {
      setSaving(true);
      const savedToken = await SecureStore.getItemAsync("token");

      await API.post(
        "/food/scan",
        {
          foods: updatedFoods,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalFat: totals.fat,
          totalCarbs: totals.carbs,
          imageUrl: imageUri,
        },
        { headers: { Authorization: `Bearer ${savedToken}` } },
      );

      Alert.alert("Saved! ✅", "Food record saved to history!", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", "Could not save. Try again!");
    } finally {
      setSaving(false);
    }
  };

  // ─── Share nutrition summary via device share sheet ───
  const shareResults = async () => {
    try {
      await Share.share({
        message:
          `🥗 NutriScan Results\n\n` +
          `📋 Foods: ${updatedFoods.map((f: any) => f.name).join(", ")}\n\n` +
          `🔥 Calories: ${totals.calories} kcal\n` +
          `💪 Protein: ${totals.protein}g\n` +
          `🫧 Fat: ${totals.fat}g\n` +
          `🌾 Carbs: ${totals.carbs}g\n\n` +
          `Tracked with NutriScan 🌿`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share results");
    }
  };

  // ─── Render ───────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header — title changes based on current mode */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>
          {calculated ? "Nutrition Results" : "Confirm Quantities"}
        </Text>
        {/* Share button only visible after results are calculated */}
        {calculated ? (
          <TouchableOpacity onPress={shareResults}>
            <Ionicons name="share-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {/* Scanned food image preview */}
      {imageUri && (
        <Image source={{ uri: imageUri as string }} style={styles.foodImage} />
      )}

      {/* ── STEP 1: Quantity Input Mode ── */}
      {!calculated && (
        <View style={styles.quantityCard}>
          <View style={styles.quantityHeader}>
            <Ionicons name="help-circle" size={20} color="#ffea00" />
            <Text style={styles.quantityTitle}>Confirm Quantities</Text>
          </View>
          <Text style={styles.quantitySubtitle}>
            AI couldn't determine exact amounts. Please confirm:
          </Text>

          {foods.map((food: any, index: number) => (
            <View key={index} style={styles.quantityRow}>
              <Text style={styles.quantityFoodName}>{food.name}</Text>
              <TextInput
                style={styles.quantityInput}
                defaultValue={String(food.quantity)}
                keyboardType="numeric"
                onChangeText={(val) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [food.name]: parseFloat(val) || 0,
                  }))
                }
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.quantityUnit}>{food.unit}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.calculateBtn} onPress={recalculate}>
            <Ionicons name="calculator" size={20} color="white" />
            <Text style={styles.calculateBtnText}> Calculate Nutrition</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── STEP 2: Nutrition Results ── */}
      {calculated && (
        <>
          {/* Total nutrition summary card */}
          <View style={styles.totalCard}>
            <Text style={styles.totalTitle}>Total Nutrition</Text>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.calories }]}>
                  {totals.calories}
                </Text>
                <Text style={styles.macroLabel}>🔥 Cal</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.protein }]}>
                  {totals.protein}g
                </Text>
                <Text style={styles.macroLabel}>💪 Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.fat }]}>
                  {totals.fat}g
                </Text>
                <Text style={styles.macroLabel}>🫧 Fat</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: colors.carbs }]}>
                  {totals.carbs}g
                </Text>
                <Text style={styles.macroLabel}>🌾 Carbs</Text>
              </View>
            </View>
          </View>

          {/* Per-food breakdown cards */}
          <Text style={styles.sectionTitle}>Detected Foods</Text>
          {updatedFoods.map((food: any, index: number) => (
            <View key={index} style={styles.foodCard}>
              <View style={styles.foodHeader}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.foodQuantity}>
                  {food.quantity} {food.unit}
                </Text>
              </View>
              <View style={styles.foodMacros}>
                <View style={styles.foodMacroItem}>
                  <Text
                    style={[styles.foodMacroValue, { color: colors.calories }]}
                  >
                    {food.calories}
                  </Text>
                  <Text style={styles.foodMacroLabel}>cal</Text>
                </View>
                <View style={styles.foodMacroItem}>
                  <Text
                    style={[styles.foodMacroValue, { color: colors.protein }]}
                  >
                    {food.protein}g
                  </Text>
                  <Text style={styles.foodMacroLabel}>protein</Text>
                </View>
                <View style={styles.foodMacroItem}>
                  <Text style={[styles.foodMacroValue, { color: colors.fat }]}>
                    {food.fat}g
                  </Text>
                  <Text style={styles.foodMacroLabel}>fat</Text>
                </View>
                <View style={styles.foodMacroItem}>
                  <Text
                    style={[styles.foodMacroValue, { color: colors.carbs }]}
                  >
                    {food.carbs}g
                  </Text>
                  <Text style={styles.foodMacroLabel}>carbs</Text>
                </View>
              </View>
            </View>
          ))}

          {/* Action buttons */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={saveToHistory}
            disabled={saving}
          >
            <Ionicons name="bookmark" size={20} color="white" />
            <Text style={styles.saveBtnText}>
              {saving ? "Saving..." : "  Save to History"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.discardBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.discardBtnText}>Scan Again</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 55, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  heading: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  foodImage: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    marginBottom: 20,
    resizeMode: "cover",
  },
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },
  totalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  macroRow: { flexDirection: "row", justifyContent: "space-between" },
  macroItem: { alignItems: "center", flex: 1 },
  macroValue: { fontSize: 22, fontWeight: "800" },
  macroLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  foodCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },
  foodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  foodName: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  foodQuantity: {
    fontSize: 13,
    color: colors.textSecondary,
    backgroundColor: "#1f1f1f",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  foodMacros: { flexDirection: "row", justifyContent: "space-between" },
  foodMacroItem: { alignItems: "center", flex: 1 },
  foodMacroValue: { fontSize: 16, fontWeight: "700" },
  foodMacroLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 55,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    elevation: 4,
  },
  saveBtnText: { color: "white", fontSize: 17, fontWeight: "700" },
  discardBtn: {
    borderRadius: 14,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },
  discardBtnText: { color: colors.textSecondary, fontSize: 16 },
  quantityCard: {
    backgroundColor: "#1a1500",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ffea0033",
  },
  quantityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  quantityTitle: { fontSize: 15, fontWeight: "700", color: "#ffea00" },
  quantitySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#2a2a00",
  },
  quantityFoodName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  quantityInput: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#ffea0055",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: "white",
    width: 70,
    textAlign: "center",
    fontSize: 14,
  },
  quantityUnit: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
    width: 40,
  },
  calculateBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  calculateBtnText: { color: "white", fontSize: 16, fontWeight: "700" },
});
