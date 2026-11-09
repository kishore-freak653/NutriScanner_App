import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
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
import { ScreenHeader } from "@/components/ScreenHeader";
import { TextField } from "@/components/TextField";
import { WeightChart, WeightEntry } from "@/components/WeightChart";
import { card, colors, fonts, type } from "@/constants/design";
import { useFoodRecords } from "@/hooks/useFoodRecords";
import { API, getErrorMessage } from "@/utils/api";
import { confirmAction } from "@/utils/confirm";
import { localDate, loggingStats, roundOne } from "@/utils/nutrition";

const CHART_ENTRIES = 30;
const MIN_KG = 20;
const MAX_KG = 500;

const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const signed = (value: number) => `${value > 0 ? "+" : ""}${roundOne(value)} kg`;

export default function WeightScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { records } = useFoodRecords();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await API.get("/tracking/weight");
      setEntries(res.data.entries ?? []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load your weight."));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const chartEntries = useMemo(() => entries.slice(0, CHART_ENTRIES).reverse(), [entries]);
  const { averageCalories } = useMemo(() => loggingStats(records), [records]);
  const change = entries.length > 1 ? entries[0].weightKg - entries[entries.length - 1].weightKg : null;

  const save = async () => {
    const weightKg = Number(draft.replace(",", "."));
    if (!Number.isFinite(weightKg) || weightKg < MIN_KG || weightKg > MAX_KG) {
      Toast.show({
        type: "error",
        text1: "Check your weight",
        text2: `Enter a number from ${MIN_KG} to ${MAX_KG} kg.`,
      });
      return;
    }
    try {
      setSaving(true);
      await API.put("/tracking/weight", { date: localDate(), weightKg: roundOne(weightKg) });
      await load();
      setDraft("");
      Keyboard.dismiss();
      Toast.show({ type: "success", text1: "Weight saved for today" });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Couldn't save your weight",
        text2: getErrorMessage(err, "Please try again."),
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = (date: string) =>
    confirmAction("Delete this entry?", dateLabel(date), "Delete", async () => {
      try {
        await API.delete(`/tracking/weight/${date}`);
        await load();
      } catch (err) {
        Toast.show({
          type: "error",
          text1: "Couldn't delete that entry",
          text2: getErrorMessage(err, "Please try again."),
        });
      }
    });

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
        <ScreenHeader title="Weight" onBack={() => router.back()} />

        <TextField
          label="Today's weight (kg)"
          icon="scale-outline"
          keyboardType="decimal-pad"
          placeholder="e.g. 72.5"
          value={draft}
          onChangeText={setDraft}
          maxLength={6}
        />
        <Button label="Save weight" loading={saving} disabled={!draft.trim()} onPress={save} />

        {loading ? (
          <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />
        ) : error ? (
          <Pressable accessibilityRole="button" style={styles.errorBanner} onPress={load}>
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </Pressable>
        ) : entries.length === 0 ? (
          <Text style={styles.empty}>
            Save your first weight to start your chart. Once a week at the same time of day works well.
          </Text>
        ) : (
          <>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{entries[0].weightKg} kg</Text>
                <Text style={styles.statLabel}>Latest</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{change === null ? "–" : signed(change)}</Text>
                <Text style={styles.statLabel}>Since you started</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{averageCalories.toLocaleString("en-IN")}</Text>
                <Text style={styles.statLabel}>Avg kcal, 7 days</Text>
              </View>
            </View>

            {chartEntries.length > 1 && (
              <View style={styles.chart}>
                <WeightChart entries={chartEntries} />
              </View>
            )}

            <Text style={styles.sectionTitle}>Entries</Text>
            {entries.map((entry) => (
              <View key={entry.date} style={styles.row}>
                <Text style={styles.rowDate}>{dateLabel(entry.date)}</Text>
                <Text style={styles.rowValue}>{entry.weightKg} kg</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete weight from ${dateLabel(entry.date)}`}
                  hitSlop={12}
                  onPress={() => remove(entry.date)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </Pressable>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 16 },
  spinner: { marginTop: 48 },
  errorBanner: { backgroundColor: colors.errorLight, borderRadius: 12, padding: 12, marginTop: 16 },
  errorText: { ...type.body, fontFamily: fonts.semibold, color: colors.errorDark },
  empty: { ...type.body, color: colors.textSecondary, textAlign: "center", marginTop: 32 },
  stats: { flexDirection: "row", gap: 8, marginTop: 16 },
  stat: { ...card, flex: 1, alignItems: "center", paddingVertical: 12, paddingHorizontal: 4 },
  statValue: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, color: colors.textPrimary },
  statLabel: { ...type.caption, fontSize: 11, color: colors.textSecondary, textAlign: "center" },
  chart: { ...card, padding: 12, marginTop: 12 },
  sectionTitle: { ...type.h3, color: colors.textPrimary, marginTop: 20, marginBottom: 8 },
  row: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  rowDate: { ...type.body, flex: 1, color: colors.textSecondary },
  rowValue: { ...type.body, fontFamily: fonts.semibold, color: colors.textPrimary },
});
