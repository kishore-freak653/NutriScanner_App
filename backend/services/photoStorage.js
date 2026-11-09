import { randomUUID } from "node:crypto";
import { getSupabase } from "../config/db.js";
import { validationError } from "../utils/validationError.js";

const BUCKET = "meal-photos";
const MAX_BYTES = 5 * 1024 * 1024;
const URL_LIFETIME_SECONDS = 24 * 60 * 60;

// The bucket is private: photos are only reachable through short-lived signed links.
export const ensurePhotoBucket = async () => {
  const { error } = await getSupabase().storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ["image/jpeg"],
  });
  if (error && !/already exists/i.test(error.message)) throw error;
};

export const decodePhoto = (base64) => {
  const bytes = Buffer.from(String(base64), "base64");
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!isJpeg) throw validationError("The photo must be a JPEG image");
  if (bytes.length > MAX_BYTES) throw validationError("The photo is too large");
  return bytes;
};

export const uploadPhoto = async (userId, bytes) => {
  const path = `${userId}/${randomUUID()}.jpg`;
  const { error } = await getSupabase()
    .storage.from(BUCKET)
    .upload(path, bytes, { contentType: "image/jpeg" });
  if (error) throw error;
  return path;
};

// A missing link only costs a thumbnail, so failures here never fail the request.
export const getPhotoUrls = async (paths) => {
  if (paths.length === 0) return new Map();
  try {
    const { data, error } = await getSupabase()
      .storage.from(BUCKET)
      .createSignedUrls(paths, URL_LIFETIME_SECONDS);
    if (error) throw error;
    return new Map(
      data.filter((item) => !item.error).map((item) => [item.path, item.signedUrl]),
    );
  } catch (error) {
    console.error("Could not sign photo links:", error.message);
    return new Map();
  }
};

export const removePhoto = async (path) => {
  const { error } = await getSupabase().storage.from(BUCKET).remove([path]);
  if (error) console.error("Could not remove photo:", error.message);
};
