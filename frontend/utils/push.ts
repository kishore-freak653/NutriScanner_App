import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { API } from "./api";
import { storage } from "./storage";

const KEY = "pushToken";
// Must match the channelId the backend sends with (services/pushService.js).
const CHANNEL = "default";

/**
 * Remote push needs a real phone running the development or release build:
 * Expo Go can't receive it on Android, emulators get no token, and the web
 * build has no push at all. Everywhere else this quietly does nothing.
 */
export const pushSupported =
  Platform.OS !== "web" &&
  Device.isDevice &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

// Loaded on first use, like utils/reminders.ts, so Expo Go doesn't warn.
const loadNotifications = () => import("expo-notifications");

let handlerSet = false;

// Without a handler, notifications that arrive while the app is open are dropped.
const setForegroundHandler = (Notifications: typeof import("expo-notifications")) => {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

/** Asks for permission, gets this phone's Expo push token and saves it for the signed-in user. */
export const registerForPush = async () => {
  if (!pushSupported) return;
  const Notifications = await loadNotifications();
  setForegroundHandler(Notifications);

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "General",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted) ({ granted } = await Notifications.requestPermissionsAsync());
  if (!granted) return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error("No EAS projectId in app.json; run `eas init`.");

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await API.post("/push/token", { token, platform: Platform.OS });
  await storage.set(KEY, token);
};

/** Stops pushes to this phone. Call before the session token is cleared, since the request needs it. */
export const unregisterPush = async () => {
  const token = await storage.get(KEY);
  if (!token) return;
  await storage.remove(KEY);
  await API.delete("/push/token", { data: { token } }).catch(() => {
    // Offline or already signed out: the server drops dead tokens when it next sends.
  });
};

/** For when the session ended without a chance to tell the server. */
export const forgetPushToken = () => storage.remove(KEY);
