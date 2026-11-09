import { getSupabase } from "../config/db.js";

export const findWater = async (userId, day) => {
  const { data, error } = await getSupabase()
    .from("water_logs")
    .select("glasses")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();
  if (error) throw error;
  return data?.glasses ?? 0;
};

export const saveWater = async (userId, day, glasses) => {
  const { error } = await getSupabase()
    .from("water_logs")
    .upsert({ user_id: userId, day, glasses }, { onConflict: "user_id,day" });
  if (error) throw error;
};

const toWeight = (row) => ({ date: row.day, weightKg: row.weight_kg });

export const findWeights = async (userId) => {
  const { data, error } = await getSupabase()
    .from("weight_logs")
    .select("day, weight_kg")
    .eq("user_id", userId)
    .order("day", { ascending: false });
  if (error) throw error;
  return data.map(toWeight);
};

export const saveWeight = async (userId, day, weightKg) => {
  const { data, error } = await getSupabase()
    .from("weight_logs")
    .upsert({ user_id: userId, day, weight_kg: weightKg }, { onConflict: "user_id,day" })
    .select("day, weight_kg")
    .single();
  if (error) throw error;
  return toWeight(data);
};

export const deleteWeight = async (userId, day) => {
  const { error } = await getSupabase()
    .from("weight_logs")
    .delete()
    .eq("user_id", userId)
    .eq("day", day);
  if (error) throw error;
};
