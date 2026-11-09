/**
 * Global authentication context for NutriScan.
 * Provides login, register and logout, and persists the session in storage.
 * Navigation follows `user` through the Stack.Protected guards in app/_layout.
 */

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Toast from "react-native-toast-message";
import { API, getErrorMessage, setUnauthorizedHandler } from "@/utils/api";
import { forgetPushToken, registerForPush, unregisterPush } from "@/utils/push";
import { storage } from "@/utils/storage";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  /** True only while the saved session is restored on app launch. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const startSession = async (data: User & { token: string }) => {
  const { _id, name, email, phone, token } = data;
  const user = { _id, name, email, phone };
  await storage.set("token", token);
  await storage.set("user", JSON.stringify(user));
  return user;
};

const clearSession = async () => {
  await storage.remove("token");
  await storage.remove("user");
  await forgetPushToken();
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          storage.get("token"),
          storage.get("user"),
        ]);
        if (savedToken && savedUser) setUser(JSON.parse(savedUser));
      } catch {
        // Unreadable session: the user just sees the login screen.
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    // An expired or invalid token ends the session wherever it is noticed.
    setUnauthorizedHandler(() => {
      clearSession();
      setUser((current) => {
        if (current) {
          Toast.show({
            type: "info",
            text1: "Session expired",
            text2: "Please sign in again.",
          });
        }
        return null;
      });
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Runs on sign-in and on every launch with a saved session, so a token that
  // changed or was dropped by the server is saved again.
  const userId = user?._id;
  useEffect(() => {
    if (!userId) return;
    registerForPush().catch((error) =>
      console.warn("Push notifications unavailable:", error?.message ?? error),
    );
  }, [userId]);

  const register = useCallback<AuthContextType["register"]>(
    async (name, email, password, phone) => {
      try {
        const res = await API.post("/auth/register", {
          name,
          email,
          password,
          phone,
        });
        setUser(await startSession(res.data));
        Toast.show({
          type: "success",
          text1: "Account created",
          text2: `Welcome, ${res.data.name}!`,
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Registration failed",
          text2: getErrorMessage(error, "Something went wrong."),
        });
      }
    },
    [],
  );

  const login = useCallback<AuthContextType["login"]>(async (email, password) => {
    try {
      const res = await API.post("/auth/login", { email, password });
      setUser(await startSession(res.data));
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Sign in failed",
        text2: getErrorMessage(error, "Something went wrong."),
      });
    }
  }, []);

  const logout = useCallback(async () => {
    await unregisterPush();
    await clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
