import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { card, colors, fonts, radius, type } from "@/constants/design";
import { useAuth } from "@/hooks/useAuth";
import { useGoals } from "@/hooks/useGoals";
import { useFoodRecords } from "@/hooks/useFoodRecords";
import { confirmAction } from "@/utils/confirm";
import { loggingStats, recordsForToday } from "@/utils/nutrition";
import {
  cancelReminders,
  loadReminderSettings,
  REMINDERS,
  ReminderMeal,
  ReminderSettings,
  remindersSupported,
  requestReminderPermission,
  saveReminderSettings,
  syncReminders,
} from "@/utils/reminders";

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { goal, macros } = useGoals();
  const { records } = useFoodRecords();
  const [reminders, setReminders] = useState<ReminderSettings | null>(null);

  useEffect(() => {
    if (remindersSupported) loadReminderSettings().then(setReminders);
  }, []);

  const daysTracked = useMemo(
    () => new Set(records.map((r) => new Date(r.createdAt).toDateString())).size,
    [records],
  );
  const { streak } = useMemo(() => loggingStats(records), [records]);

  if (!user) return null;

  const toggleReminder = async (key: ReminderMeal, enabled: boolean) => {
    if (!reminders) return;
    if (enabled && !(await requestReminderPermission())) {
      Toast.show({
        type: "error",
        text1: "Notifications are off",
        text2: "Allow notifications for this app in your phone's settings.",
      });
      return;
    }
    const next = { ...reminders, [key]: enabled };
    setReminders(next);
    await saveReminderSettings(next);
    await syncReminders(recordsForToday(records)).catch(() =>
      Toast.show({ type: "error", text1: "Couldn't update your reminders" }),
    );
  };

  const signOut = async () => {
    await cancelReminders().catch(() => undefined);
    logout();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader title="Profile" />

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user.name)}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {user.email}
        </Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{records.length}</Text>
          <Text style={styles.statLabel}>Meals logged</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{daysTracked}</Text>
          <Text style={styles.statLabel}>Days tracked</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day streak</Text>
        </View>
      </View>

      <Text style={styles.rowTitle}>Daily goals</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit daily goals"
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={() => router.push("/goals")}
      >
        <Ionicons name="flame" size={20} color={colors.accent} />
        <View style={styles.rowFill}>
          <Text style={styles.rowValue}>{goal.toLocaleString("en-IN")} kcal</Text>
          <Text style={styles.reminderTime}>
            P {macros.protein} g · C {macros.carbs} g · F {macros.fat} g
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>

      <Text style={styles.rowTitle}>Weight</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Track your weight"
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={() => router.push("/weight")}
      >
        <Ionicons name="scale-outline" size={20} color={colors.primary} />
        <Text style={[styles.rowValue, styles.rowFill]}>Track your weight</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>

      {reminders && (
        <>
          <Text style={styles.rowTitle}>Meal reminders</Text>
          <View style={styles.reminders}>
            {REMINDERS.map(({ key, label, time }) => (
              <View key={key} style={styles.reminder}>
                <View style={styles.rowFill}>
                  <Text style={styles.rowValue}>{label}</Text>
                  <Text style={styles.reminderTime}>{time}, if you haven&apos;t logged it</Text>
                </View>
                <Switch
                  accessibilityLabel={`${label} reminder`}
                  value={reminders[key]}
                  onValueChange={(enabled) => toggleReminder(key, enabled)}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={colors.surface}
                />
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={styles.rowTitle}>Phone number</Text>
      <View style={styles.row}>
        <Ionicons name="call" size={18} color={colors.primary} />
        <Text style={[styles.rowValue, styles.rowFill]} numberOfLines={1}>
          {user.phone || "Not set"}
        </Text>
      </View>

      <Button
        label="Sign out"
        icon="log-out-outline"
        style={styles.signOut}
        onPress={() =>
          confirmAction("Sign out?", "You'll need to sign in again to see your meals.", "Sign out", signOut)
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  identity: { alignItems: "center", marginBottom: 16 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, color: colors.primaryDark },
  name: { ...type.h2, color: colors.textPrimary },
  email: { ...type.body, color: colors.textSecondary },
  stats: { flexDirection: "row", gap: 8, marginBottom: 16 },
  stat: { ...card, flex: 1, alignItems: "center", padding: 14 },
  statValue: { ...type.h1, fontSize: 24, lineHeight: 30, color: colors.textPrimary },
  statLabel: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  rowTitle: { ...type.h3, fontSize: 14, lineHeight: 20, color: colors.textPrimary, marginBottom: 8 },
  row: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  rowValue: { ...type.body, fontFamily: fonts.semibold, color: colors.textPrimary },
  rowFill: { flex: 1 },
  pressed: { opacity: 0.7 },
  reminders: { ...card, paddingHorizontal: 14, marginBottom: 16 },
  reminder: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 56 },
  reminderTime: { ...type.caption, color: colors.textSecondary },
  signOut: { marginTop: 4 },
});
