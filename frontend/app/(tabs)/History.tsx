import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { RecordCard } from "@/components/RecordCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { card, colors, fonts, radius, type } from "@/constants/design";
import { MEAL_STYLES } from "@/constants/nutritionStyles";
import { useGoals } from "@/hooks/useGoals";
import { useFoodRecords } from "@/hooks/useFoodRecords";
import { getErrorMessage } from "@/utils/api";
import { confirmAction } from "@/utils/confirm";
import { openSavedMeal } from "@/utils/navigation";
import {
  addDays,
  dayTitle,
  daysBefore,
  FoodRecord,
  groupByMeal,
  recordsForDay,
  sumRecords,
} from "@/utils/nutrition";

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { goal } = useGoals();
  const { records, loading, refreshing, error, refresh, retry, remove } = useFoodRecords();

  // Counted back from today, so the screen stays right if it's left open past midnight.
  const [daysAgo, setDaysAgo] = useState(0);
  const day = addDays(new Date(), -daysAgo);
  const dayRecords = recordsForDay(records, day);
  const sections = groupByMeal(dayRecords);
  const dayCalories = sumRecords(dayRecords).calories;

  // An empty day offers the nearest earlier day with meals, or else the latest one.
  const nearestMeal = records.find((r) => daysBefore(r.createdAt) > daysAgo) ?? records[0];

  const confirmDelete = useCallback(
    (id: string) => {
      confirmAction("Delete this meal?", "This can't be undone.", "Delete", () => {
        remove(id).catch((err) =>
          Toast.show({
            type: "error",
            text1: "Couldn't delete that meal",
            text2: getErrorMessage(err, "Please try again."),
          }),
        );
      });
    },
    [remove],
  );

  const openMeal = useCallback((record: FoodRecord) => openSavedMeal(router, record), [router]);

  const renderItem = useCallback(
    ({ item }: { item: FoodRecord }) => (
      <RecordCard record={item} onDelete={confirmDelete} onPress={openMeal} showMealType={false} />
    ),
    [confirmDelete, openMeal],
  );

  const title = (
    <View style={{ paddingTop: insets.top + 8 }}>
      <ScreenHeader title="History" />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.padded}>{title}</View>
        <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />
      </View>
    );
  }

  const header = (
    <>
      {title}
      <View style={styles.dayBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous day"
          hitSlop={8}
          style={styles.dayArrow}
          onPress={() => setDaysAgo((days) => days + 1)}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.dayText}>
          <Text style={styles.dayTitle} accessibilityLiveRegion="polite">
            {dayTitle(day)}
          </Text>
          <Text style={styles.dayTotal}>
            {dayCalories.toLocaleString("en-IN")} / {goal.toLocaleString("en-IN")} kcal
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next day"
          accessibilityState={{ disabled: daysAgo === 0 }}
          disabled={daysAgo === 0}
          hitSlop={8}
          style={styles.dayArrow}
          onPress={() => setDaysAgo((days) => days - 1)}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={daysAgo === 0 ? colors.border : colors.textPrimary}
          />
        </Pressable>
      </View>
    </>
  );

  const failed = error && records.length === 0;

  return (
    <SectionList
      style={styles.container}
      contentContainerStyle={styles.padded}
      sections={sections}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={header}
      renderSectionHeader={({ section }) => {
        const style = MEAL_STYLES[section.key];
        return (
          <View style={styles.section} accessibilityRole="header">
            <Ionicons name={style.icon} size={18} color={style.color} />
            <Text style={[styles.sectionTitle, { color: style.color }]}>{section.title}</Text>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, failed && styles.emptyIconError]}>
            <Ionicons
              name={failed ? "alert-circle-outline" : "nutrition-outline"}
              size={32}
              color={failed ? colors.error : colors.primary}
            />
          </View>
          {failed ? (
            <>
              <Text style={styles.emptyTitle}>Failed to load meals</Text>
              <Text style={styles.emptyText}>{error}</Text>
              <Button
                label="Retry"
                icon="refresh"
                variant="outlined"
                onPress={retry}
                style={styles.emptyAction}
              />
            </>
          ) : nearestMeal ? (
            <>
              <Text style={styles.emptyTitle}>No meals on this day</Text>
              <Text style={styles.emptyText}>Use the arrows to move between days.</Text>
              <Button
                label={`Go to ${dayTitle(new Date(nearestMeal.createdAt))}`}
                variant="soft"
                onPress={() => setDaysAgo(daysBefore(nearestMeal.createdAt))}
                style={styles.emptyAction}
              />
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle}>No meals yet</Text>
              <Text style={styles.emptyText}>Start by scanning your first meal!</Text>
              <Button
                label="Scan food"
                icon="camera-outline"
                onPress={() => router.push("/(tabs)/Scan")}
                style={styles.emptyAction}
              />
            </>
          )}
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: 16, paddingBottom: 24 },
  spinner: { marginTop: 80 },
  dayBar: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 8,
    marginBottom: 4,
  },
  dayArrow: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  dayText: { flex: 1, alignItems: "center" },
  dayTitle: { ...type.h3, color: colors.textPrimary },
  dayTotal: { ...type.caption, color: colors.textSecondary },
  section: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, marginBottom: 8 },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  empty: { alignItems: "center", marginTop: 56, paddingHorizontal: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyIconError: { backgroundColor: colors.errorLight },
  emptyTitle: { ...type.h2, color: colors.textPrimary, marginBottom: 4 },
  emptyText: { ...type.body, color: colors.textSecondary, textAlign: "center" },
  emptyAction: { alignSelf: "stretch", marginTop: 24 },
});
