/**
 * useAuth.tsx
 * Global authentication context for NutriScan.
 * Provides login, register, logout and persists JWT token via SecureStore.
 */

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { API } from "../utils/axiosInstance";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";

// ─── Types ───────────────────────────────────────────────
interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone: string,
  ) => Promise<void>;
  logout: () => void;
}

// ─── Context ─────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On app start — check if user was previously logged in
  useEffect(() => {
    checkToken();
  }, []);

  /**
   * Reads saved token + user from SecureStore on app launch.
   * If found, restores the session without requiring re-login.
   */
  const checkToken = async () => {
    try {
      const savedToken = await SecureStore.getItemAsync("token");
      const savedUser = await SecureStore.getItemAsync("user");

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      // Silent fail — user will just see the login screen
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registers a new user, saves token + user to SecureStore,
   * and navigates to the main tabs.
   */
  const register = async (
    name: string,
    email: string,
    password: string,
    phone: string,
  ) => {
    try {
      setLoading(true);

      const res = await API.post("/auth/register", {
        name,
        email,
        password,
        phone,
      });

      // Persist session
      await SecureStore.setItemAsync("token", res.data.token);
      await SecureStore.setItemAsync("user", JSON.stringify(res.data));

      setUser(res.data);
      setToken(res.data.token);

      Toast.show({
        type: "success",
        text1: "Account Created! 🎉",
        text2: `Welcome, ${res.data.name}!`,
      });

      router.replace("/");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Registration Failed",
        text2: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logs in an existing user with email + password.
   * Saves JWT token and user data to SecureStore for session persistence.
   */
  const login = async (email: string, password: string) => {
    try {
      const res = await API.post("/auth/login", { email, password });

      // Persist session
      await SecureStore.setItemAsync("token", res.data.token);
      await SecureStore.setItemAsync("user", JSON.stringify(res.data));

      setUser(res.data);
      setToken(res.data.token);

      Toast.show({
        type: "success",
        text1: "Welcome back! 👋",
        text2: `Logged in as ${res.data.name}`,
      });

      router.replace("/(tabs)");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Check your connection.";

      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: message,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clears stored token + user from SecureStore and redirects to login.
   */
  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");

    setUser(null);
    setToken(null);

    Toast.show({
      type: "info",
      text1: "Logged Out",
      text2: "See you soon! 👋",
    });

    router.replace("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{ login, logout, user, token, register, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
