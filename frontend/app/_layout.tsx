import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import Toast from "react-native-toast-message";


import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from './custom-hooks/useAuth';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* <Stack.Screen name="(tabs)" /> */}
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen name="result" options={{ headerShown: false }} />

          {/* <Stack.Screen name="auth/login.tsx" />
        <Stack.Screen name="auth/register.tsx" /> */}
        </Stack>
        <StatusBar style="auto" />
        <Toast />
      </ThemeProvider>
    </AuthProvider>
  );
}
