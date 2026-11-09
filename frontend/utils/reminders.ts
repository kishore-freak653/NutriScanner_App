import { Platform } from "react-native";
import { FoodRecord, MealType } from "./nutrition";
import { storage } from "./storage";

const KEY = "reminders";
const CHANNEL = "meal-reminders";
const DAYS_AHEAD = 7;

export type ReminderMeal = Exclude<MealType, "snack">;
export type ReminderSettings = Record<ReminderMeal, boolean>;

export const REMINDERS: { key: ReminderMeal; label: string; hour: number; minute: number; time: string }[] = [
  { key: "breakfast", label: "Breakfast", hour: 9, minute: 30, time: "9:30 am" },
  { key: "lunch", label: "Lunch", hour: 14, minute: 0, time: "2:00 pm" },
  { key: "dinner", label: "Dinner", hour: 21, minute: 0, time: "9:00 pm" },
];

const OFF: ReminderSettings = { breakfast: false, lunch: false, dinner: false };

export const remindersSupported = Platform.OS !== "web";

// Loaded on first use, because importing it in Expo Go logs a warning about
// remote push, which this app doesn't use.
const loadNotifications = () => import("expo-notifications");

export const loadReminderSettings = async (): Promise<ReminderSettings> => {
  try {
    return { ...OFF, ...JSON.parse((await storage.get(KEY)) ?? "{}") };
  } catch {
    return OFF;
  }
};

export const saveReminderSettings = (settings: ReminderSettings) =>
  storage.set(KEY, JSON.stringify(settings));

export const requestReminderPermission = async () => {
  if (!remindersSupported) return false;
  const Notifications = await loadNotifications();
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
};

/**
 * Local notifications can't check anything when they fire, so this replaces the
 * schedule each time meals change: a week ahead, minus any meal logged today.
 */
export const syncReminders = async (todaysRecords: FoodRecord[], now = new Date()) => {
  if (!remindersSupported) return;
  const settings = await loadReminderSettings();
  const enabled = REMINDERS.filter((reminder) => settings[reminder.key]);
  const logged = new Set(todaysRecords.map((record) => record.mealType));

  const Notifications = await loadNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (enabled.length === 0) return;

  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;

  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: "Meal reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    for (const { key, label, hour, minute } of enabled) {
      if (offset === 0 && logged.has(key)) continue;
      const date = new Date(now);
      date.setDate(date.getDate() + offset);
      date.setHours(hour, minute, 0, 0);
      if (date <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: `Time to log ${label.toLowerCase()}?`, body: "It only takes a few seconds." },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
      });
    }
  }
};

export const cancelReminders = async () => {
  if (!remindersSupported) return;
  const Notifications = await loadNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
};
