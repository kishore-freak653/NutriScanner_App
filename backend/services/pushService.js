import { Expo } from "expo-server-sdk";
import { deletePushTokens, findPushTokens } from "../models/PushToken.js";

// Optional: only needed if "Enhanced security for push notifications" is turned
// on in the Expo project settings.
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN || undefined });

export const isPushToken = (token) => Expo.isExpoPushToken(token);

/**
 * Sends one notification to every device the user is signed in on.
 * Returns how many devices Expo accepted it for. Expo hands it to FCM, which
 * delivers it; a token Expo already knows is dead is removed here.
 */
export const sendPushToUser = async (userId, { title, body, data }) => {
  const tokens = (await findPushTokens(userId)).filter(isPushToken);
  if (tokens.length === 0) return { sent: 0, devices: 0 };

  const messages = tokens.map((to) => ({
    to,
    title,
    body,
    data: data ?? {},
    sound: "default",
    channelId: "default",
  }));

  const dead = [];
  let sent = 0;
  for (const chunk of expo.chunkPushNotifications(messages)) {
    const tickets = await expo.sendPushNotificationsAsync(chunk);
    tickets.forEach((ticket, i) => {
      if (ticket.status === "ok") sent++;
      else if (ticket.details?.error === "DeviceNotRegistered") dead.push(chunk[i].to);
      else console.error("Push failed:", ticket.message);
    });
  }

  await deletePushTokens(dead).catch((error) =>
    console.error("Could not remove dead push tokens:", error.message),
  );
  return { sent, devices: tokens.length };
};
