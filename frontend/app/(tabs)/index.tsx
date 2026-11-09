import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroBars } from "@/components/MacroBars";
import { QuickAdd } from "@/components/QuickAdd";
import { RecordCard } from "@/components/RecordCard";
import { WaterCard } from "@/components/WaterCard";
import { WeekChart } from "@/components/WeekChart";
import { WeeklySummary } from "@/components/WeeklySummary";
import { card, colors, fonts, radius, type } from "@/constants/design";
import { useAuth } from "@/hooks/useAuth";
import { useGoals } from "@/hooks/useGoals";
import { useFoodRecords } from "@/hooks/useFoodRecords";
import { getErrorMessage } from "@/utils/api";
import { openSavedMeal } from "@/utils/navigation";
import {
  FoodRecord,
  lastSevenDays,
  loggingStats,
  mealName,
  recentMeals,
  recordsForToday,
  sumRecords,
} from "@/utils/nutrition";
import { syncReminders } from "@/utils/reminders";

const greetingFor = (hour: number) => {
  if (hour < 12) return "Good Morning,";
  if (hour < 17) return "Good Afternoon,";
  return "Good Evening,";
};

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { goal, macros } = useGoals();
  const { records, loading, refreshing, error, refresh, retry, remove, logAgain } = useFoodRecords();

  const todaysRecords = useMemo(() => recordsForToday(records), [records]);
  const totals = useMemo(() => sumRecords(todaysRecords), [todaysRecords]);
  const week = useMemo(() => lastSevenDays(records), [records]);
  const stats = useMemo(() => loggingStats(records), [records]);
  const usualMeals = useMemo(() => recentMeals(records, 6), [records]);
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const openScan = () => router.push("/(tabs)/Scan");
  const openAddMeal = () => router.push("/add-meal");
  const openMeal = useCallback((record: FoodRecord) => openSavedMeal(router, record), [router]);

  // Skips today's reminder for any meal that's already logged.
  useEffect(() => {
    if (!loading && !error) syncReminders(todaysRecords).catch(() => undefined);
  }, [loading, error, todaysRecords]);

  const quickAdd = useCallback(
    async (record: FoodRecord) => {
      try {
        const added = await logAgain(record);
        Toast.show({
          type: "success",
          text1: `Added ${mealName(record)}`,
          text2: "Tap to undo",
          onPress: () => {
            Toast.hide();
            remove(added._id).catch(() =>
              Toast.show({ type: "error", text1: "Couldn't undo that" }),
            );
          },
        });
      } catch (err) {
        Toast.show({
          type: "error",
          text1: "Couldn't add that meal",
          text2: getErrorMessage(err, "Please try again."),
        });
      }
    },
    [logAgain, remove],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greetingFor(new Date().getHours())}</Text>
          <Text style={styles.name} numberOfLines={1} accessibilityRole="header">
            {firstName} 👋
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open meal history"
          hitSlop={8}
          style={styles.calendar}
          onPress={() => router.push("/(tabs)/History")}
        >
          <Ionicons name="calendar-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {error && (
        <Pressable accessibilityRole="button" style={styles.errorBanner} onPress={retry}>
          <Text style={styles.errorText}>{error} Tap to retry.</Text>
        </Pressable>
      )}

      {loading ? (
        <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />
      ) : records.length === 0 && !error ? (
        <View style={styles.welcome}>
          <Image
            source={require("../../assets/images/ScanImage.png")}
            style={styles.welcomeImage}
            contentFit="cover"
          />
          <View style={styles.welcomeBody}>
            <Text style={styles.welcomeTitle}>Scan your first meal</Text>
            <Text style={styles.welcomeText}>
              Take a photo and get an estimate of its calories, protein, carbs
              and fat in seconds.
            </Text>
            <Button label="Scan food" icon="camera-outline" onPress={openScan} />
            <Button
              label="Add without a photo"
              icon="create-outline"
              variant="outlined"
              onPress={openAddMeal}
              style={styles.addFirst}
            />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.summary}>
            <CalorieRing consumed={totals.calories} goal={goal} />
            <MacroBars totals={totals} goals={macros} />
          </View>
          <View style={styles.actions}>
            <Button
              label="Scan Meal"
              icon="camera-outline"
              stacked
              onPress={openScan}
              style={styles.action}
            />
            <Button
              label="Add Meal"
              icon="add"
              variant="outlined"
              stacked
              onPress={openAddMeal}
              style={styles.action}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Meals</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View all history"
              hitSlop={12}
              onPress={() => router.push("/(tabs)/History")}
            >
              <Text style={styles.link}>View All</Text>
            </Pressable>
          </View>
          {records.slice(0, 3).map((record) => (
            <RecordCard key={record._id} record={record} onPress={openMeal} />
          ))}

          <QuickAdd meals={usualMeals} onAdd={quickAdd} />
          <WaterCard />
          <WeeklySummary {...stats} />

          <Text style={[styles.sectionTitle, styles.chartTitle]}>Calories (last 7 days)</Text>
          <View style={styles.chartCard}>
            <WeekChart days={week} goal={goal} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  headerText: { flex: 1 },
  greeting: { ...type.body, color: colors.textSecondary },
  name: { ...type.h1, fontSize: 24, lineHeight: 30, color: colors.textPrimary },
  calendar: {
    ...card,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: { marginTop: 80 },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.card,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { ...type.body, fontFamily: fonts.semibold, color: colors.errorDark },
  summary: { ...card, flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  action: { flex: 1 },
  addFirst: { marginTop: 8 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: { ...type.h3, color: colors.textPrimary },
  link: { ...type.body, fontFamily: fonts.semibold, color: colors.primaryDark },
  chartCard: { ...card, padding: 16 },
  chartTitle: { marginTop: 20, marginBottom: 8 },
  welcome: { ...card, overflow: "hidden", marginTop: 8 },
  welcomeImage: { width: "100%", aspectRatio: 1.6 },
  welcomeBody: { padding: 16 },
  welcomeTitle: { ...type.h2, color: colors.textPrimary, marginBottom: 4 },
  welcomeText: { ...type.body, color: colors.textSecondary, marginBottom: 16 },
});
