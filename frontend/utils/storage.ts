import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// SecureStore has no web implementation, so the web build uses localStorage.
const isWeb = Platform.OS === "web";

export const storage = {
  get: async (key: string): Promise<string | null> => {
    if (!isWeb) return SecureStore.getItemAsync(key);
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  },
  set: async (key: string, value: string): Promise<void> => {
    if (isWeb) localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  remove: async (key: string): Promise<void> => {
    if (isWeb) localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};
