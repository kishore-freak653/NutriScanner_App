import { getSupabase } from "../config/db.js";
import { isUuid } from "../utils/isUuid.js";

const PUBLIC_COLUMNS = "id, name, email, phone, created_at, updated_at";

const toUser = (row) => {
  if (!row) return null;
  const user = {
    _id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.password !== undefined) user.password = row.password;
  return user;
};

// Includes the password hash, so only use this for checking credentials.
export const findUserByEmail = async (email) => {
  const { data, error } = await getSupabase()
    .from("users")
    .select(`${PUBLIC_COLUMNS}, password`)
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  return toUser(data);
};

export const findUserById = async (id) => {
  // Tokens issued before the move to Supabase hold MongoDB ids, not UUIDs.
  if (!isUuid(id)) return null;
  const { data, error } = await getSupabase()
    .from("users")
    .select(PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return toUser(data);
};

export const createUser = async ({ name, email, phone, password }) => {
  const { data, error } = await getSupabase()
    .from("users")
    .insert({ name, email, phone, password })
    .select(PUBLIC_COLUMNS)
    .single();
  if (error) throw error;
  return toUser(data);
};
