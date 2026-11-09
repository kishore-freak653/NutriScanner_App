import { getSupabase } from "../config/db.js";

// The token is the key, so a phone that changes hands moves to its new user.
export const savePushToken = async (userId, token, platform) => {
  const { error } = await getSupabase()
    .from("push_tokens")
    .upsert({ token, user_id: userId, platform }, { onConflict: "token" });
  if (error) throw error;
};

export const deletePushToken = async (userId, token) => {
  const { error } = await getSupabase()
    .from("push_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("token", token);
  if (error) throw error;
};

export const findPushTokens = async (userId) => {
  const { data, error } = await getSupabase()
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId);
  if (error) throw error;
  return data.map((row) => row.token);
};

// For tokens Expo reports as dead, such as after the app is uninstalled.
export const deletePushTokens = async (tokens) => {
  if (tokens.length === 0) return;
  const { error } = await getSupabase().from("push_tokens").delete().in("token", tokens);
  if (error) throw error;
};
