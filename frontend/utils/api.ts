import axios from "axios";
import { storage } from "./storage";

export const API = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ??
    "https://nutriscan-backend-wdym.onrender.com/api",
  // Long enough for AI detection and for a sleeping server to wake up.
  timeout: 60000,
});

let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

API.interceptors.request.use(async (config) => {
  const token = await storage.get("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) onUnauthorized?.();
    return Promise.reject(error);
  },
);

// Turns any API failure into a sentence that is safe to show the user.
export const getErrorMessage = (error: any, fallback: string): string => {
  const data = error?.response?.data;
  if (data?.message) return data.message;
  if (data?.errors?.[0]?.msg) return data.errors[0].msg;
  if (error?.code === "ECONNABORTED") {
    return "The server took too long to respond. Please try again.";
  }
  if (!error?.response) return "Can't reach the server. Check your connection.";
  return fallback;
};
