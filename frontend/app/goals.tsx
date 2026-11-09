import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ComponentProps, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { card, colors, fonts, radius, type } from "@/constants/design";
import { MACRO_STYLES } from "@/constants/nutritionStyles";
import { useGoals } from "@/hooks/useGoals";
import { DEFAULT_CALORIE_GOAL, defaultMacroGoals, MacroGoals } from "@/utils/nutrition";

const MIN_GOAL = 500;
const MAX_GOAL = 10000;
const MAX_MACRO_GOAL = 1000;

const macrosToDraft = (macros: MacroGoals) => ({
  protein: String(macros.protein),
  carbs: String(macros.carbs),
  fat: String(macros.fat),
});

function GoalRow({
  icon,
  color,
  label,
  unit,
  value,
  maxLength,
  onChange,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  color: string;
  label: string;
  unit: string;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.rowLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={`Daily ${label.toLowerCase()} goal in ${unit === "g" ? "grams" : unit}`}
        style={styles.input}
        keyboardType="number-pad"
        value={value}
        onChangeText={onChange}
        maxLength={maxLength}
        selectTextOnFocus
        selectionColor={colors.primary}
      />
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { goal, macros, setGoal, setMacros } = useGoals();
  const { protein, carbs, fat } = macros;
  const [calorieDraft, setCalorieDraft] = useState(String(goal));
  const [macroDraft, setMacroDraft] = useState(() => macrosToDraft(macros));

  // Saved goals load just after the screen opens.
  useEffect(() => setCalorieDraft(String(goal)), [goal]);
  useEffect(() => setMacroDraft(macrosToDraft({ protein, carbs, fat })), [protein, carbs, fat]);

  const draftCalories = Number(calorieDraft);
  const suggested = defaultMacroGoals(
    draftCalories >= MIN_GOAL && draftCalories <= MAX_GOAL ? draftCalories : DEFAULT_CALORIE_GOAL,
  );
  const usingSuggested = MACRO_STYLES.every(({ key }) => macroDraft[key] === String(suggested[key]));

  const save = async () => {
    if (!Number.isInteger(draftCalories) || draftCalories < MIN_GOAL || draftCalories > MAX_GOAL) {
      Toast.show({
        type: "error",
        text1: "Check your calorie goal",
        text2: `Enter a whole number from ${MIN_GOAL} to ${MAX_GOAL}.`,
      });
      return;
    }
    const values = {
      protein: Number(macroDraft.protein),
      carbs: Number(macroDraft.carbs),
      fat: Number(macroDraft.fat),
    };
    const valid = Object.values(values).every(
      (value) => Number.isInteger(value) && value >= 1 && value <= MAX_MACRO_GOAL,
    );
    if (!valid) {
      Toast.show({
        type: "error",
        text1: "Check your macro goals",
        text2: `Enter whole numbers from 1 to ${MAX_MACRO_GOAL}.`,
      });
      return;
    }
    await setGoal(draftCalories);
    // Untouched macros keep following the calorie goal.
    const macrosEdited = MACRO_STYLES.some(({ key }) => macroDraft[key] !== String(macros[key]));
    if (macrosEdited) await setMacros(values);
    Toast.show({ type: "success", text1: "Goals updated" });
    router.back();
  };

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
        <ScreenHeader title="Daily Goals" onBack={() => router.back()} />
        <Text style={styles.intro}>Set your daily nutrition targets</Text>

        <View style={styles.rows}>
          <GoalRow
            icon="flame"
            color={colors.accent}
            label="Calories"
            unit="kcal"
            value={calorieDraft}
            maxLength={5}
            onChange={setCalorieDraft}
          />
          {MACRO_STYLES.map(({ key, label, icon, color }) => (
            <GoalRow
              key={key}
              icon={icon}
              color={color}
              label={label}
              unit="g"
              value={macroDraft[key]}
              maxLength={4}
              onChange={(value) => setMacroDraft((current) => ({ ...current, [key]: value }))}
            />
          ))}
        </View>

        <View style={styles.suggested}>
          <View style={styles.suggestedTitle}>
            <Ionicons name="information-circle" size={18} color={colors.primaryDark} />
            <Text style={styles.suggestedHeading}>Suggested for your calorie goal</Text>
          </View>
          <Text style={styles.suggestedText}>
            Protein {suggested.protein} g · Carbs {suggested.carbs} g · Fat {suggested.fat} g
          </Text>
          <Text style={styles.suggestedNote}>
            A common 25% protein, 50% carbs and 25% fat split, not personal medical advice.
          </Text>
          {!usingSuggested && (
            <Button
              label="Use these"
              variant="soft"
              onPress={() => setMacroDraft(macrosToDraft(suggested))}
              style={styles.useSuggested}
            />
          )}
        </View>

        <Button label="Save Goals" onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 16 },
  intro: { ...type.body, color: colors.textSecondary, marginBottom: 12 },
  rows: { gap: 8, marginBottom: 16 },
  row: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 14,
  },
  rowLabel: { ...type.body, fontFamily: fonts.semibold, flex: 1, color: colors.textPrimary },
  input: {
    width: 72,
    minHeight: 40,
    paddingVertical: 4,
    paddingHorizontal: 0,
    textAlign: "right",
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  unit: { ...type.body, width: 30, color: colors.textSecondary },
  suggested: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 16,
  },
  suggestedTitle: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  suggestedHeading: { ...type.body, fontFamily: fonts.semibold, color: colors.primaryDark },
  suggestedText: { ...type.body, color: colors.textPrimary },
  suggestedNote: { ...type.caption, color: colors.textSecondary, marginTop: 4 },
  useSuggested: { marginTop: 12, backgroundColor: colors.surface },
});
