import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { API, getErrorMessage } from "@/utils/api";
import { defaultMealType, FoodRecord } from "@/utils/nutrition";

/**
 * Loads the user's scans whenever the screen gains focus. The spinner only
 * shows on first load; later refreshes update the list quietly behind it.
 */
export function useFoodRecords() {
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await API.get("/food/history");
      setRecords(res.data.records ?? []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load your scans."));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    load();
  }, [load]);

  // Removes the record straight away and restores it if the server refuses.
  const remove = useCallback(
    async (id: string) => {
      setRecords((current) => current.filter((record) => record._id !== id));
      try {
        await API.delete(`/food/${id}`);
      } catch (err) {
        await load();
        throw err;
      }
    },
    [load],
  );

  // Logs a past meal again for right now. Its photo stays with the original.
  const logAgain = useCallback(
    async (record: FoodRecord) => {
      const res = await API.post("/food/scan", {
        foods: record.foods,
        totalCalories: record.totalCalories,
        totalProtein: record.totalProtein,
        totalFat: record.totalFat,
        totalCarbs: record.totalCarbs,
        mealType: defaultMealType(),
      });
      await load();
      return res.data.record as FoodRecord;
    },
    [load],
  );

  return { records, loading, refreshing, error, refresh, retry, remove, logAgain };
}
