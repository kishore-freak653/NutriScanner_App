import { createClient } from "@supabase/supabase-js";
import { ensurePhotoBucket } from "../services/photoStorage.js";

let client;

// Created on first use so the environment is read after dotenv has loaded it.
export const getSupabase = () => {
  if (!client) {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }
    client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
};

const connectDB = async () => {
  try {
    const { error } = await getSupabase()
      .from("users")
      .select("id", { head: true })
      .limit(1);
    if (error) throw new Error(error.message || "Could not query the users table");

    const checks = await Promise.all([
      getSupabase().from("food_records").select("meal_type, image_path").limit(0),
      getSupabase().from("water_logs").select("day").limit(0),
      getSupabase().from("weight_logs").select("day").limit(0),
    ]);
    const outdated = checks.find((check) => check.error);
    if (outdated) {
      throw new Error(
        `Database is out of date (${outdated.error.message}). ` +
          "Paste backend/supabase/schema.sql into the Supabase SQL editor and run it.",
      );
    }
    console.log("Supabase Connected");

    // Meals can still be saved without photos, so this doesn't stop the server.
    await ensurePhotoBucket().catch((bucketError) =>
      console.error("Could not set up photo storage:", bucketError.message),
    );
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDB;
