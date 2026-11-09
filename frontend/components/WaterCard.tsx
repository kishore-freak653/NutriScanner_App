import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { card, colors, fonts, radius, type } from "@/constants/design";
import { API, getErrorMessage } from "@/utils/api";
import { localDate } from "@/utils/nutrition";

const GOAL_GLASSES = 8;
const MAX_GLASSES = 50;
const ML_PER_GLASS = 250;

export function WaterCard() {
  const [glasses, setGlasses] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  // Saves run one at a time, so quick taps can't arrive out of order.
  const saves = useRef<Promise<unknown>>(Promise.resolve());

  const load = useCallback(async () => {
    try {
      const res = await API.get("/tracking/water", { params: { date: localDate() } });
      setGlasses(res.data.glasses);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const change = (delta: 1 | -1) => {
    if (glasses === null) return;
    const next = Math.min(Math.max(glasses + delta, 0), MAX_GLASSES);
    if (next === glasses) return;
    setGlasses(next);
    saves.current = saves.current.then(() =>
      API.put("/tracking/water", { date: localDate(), glasses: next }).catch((err) => {
        Toast.show({
          type: "error",
          text1: "Couldn't save your water",
          text2: getErrorMessage(err, "Please try again."),
        });
        return load();
      }),
    );
  };

  if (failed && glasses === null) {
    return (
      <Pressable accessibilityRole="button" style={[styles.card, styles.failed]} onPress={load}>
        <Ionicons name="water" size={20} color={colors.water} />
        <Text style={styles.detail}>Couldn&apos;t load your water. Tap to retry.</Text>
      </Pressable>
    );
  }

  const count = glasses ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="water" size={20} color={colors.water} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>
          {count} of {GOAL_GLASSES} glasses
        </Text>
        <Text style={styles.detail}>{(count * ML_PER_GLASS).toLocaleString("en-IN")} ml today</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min((count / GOAL_GLASSES) * 100, 100)}%` }]} />
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Remove a glass of water"
        hitSlop={6}
        disabled={count === 0}
        style={[styles.step, count === 0 && styles.stepOff]}
        onPress={() => change(-1)}
      >
        <Ionicons name="remove" size={20} color={colors.water} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a glass of water"
        hitSlop={6}
        style={styles.step}
        onPress={() => change(1)}
      >
        <Ionicons name="add" size={20} color={colors.water} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    marginTop: 12,
  },
  failed: { minHeight: 52 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.waterLight,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  title: { ...type.body, fontFamily: fonts.semibold, color: colors.textPrimary },
  detail: { ...type.caption, color: colors.textSecondary },
  track: {
    height: 4,
    marginTop: 6,
    borderRadius: radius.full,
    backgroundColor: colors.waterLight,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.full, backgroundColor: colors.water },
  step: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.waterLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepOff: { opacity: 0.4 },
});
