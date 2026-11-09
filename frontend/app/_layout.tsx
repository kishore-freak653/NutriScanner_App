import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import "react-native-reanimated";
import Toast, { BaseToast, ToastConfig } from "react-native-toast-message";

import { colors, fonts } from "@/constants/design";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    primary: colors.primary,
    text: colors.textPrimary,
  },
};

const lightToast = (accent: string): ToastConfig[string] =>
  function LightToast(props) {
    return (
      <BaseToast
        {...props}
        style={[styles.toast, { borderLeftColor: accent }]}
        contentContainerStyle={styles.toastContent}
        text1Style={styles.toastTitle}
        text2Style={styles.toastBody}
        text2NumberOfLines={2}
      />
    );
  };

const toastConfig: ToastConfig = {
  success: lightToast(colors.primary),
  error: lightToast(colors.error),
  info: lightToast(colors.accent),
};

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="result" />
        <Stack.Screen name="add-meal" />
        <Stack.Screen name="edit-meal" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="barcode" />
        <Stack.Screen name="weight" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // A font failure falls back to the system font rather than blocking the app.
  if (!fontsLoaded && !fontError) return <LoadingScreen />;

  return (
    <AuthProvider>
      <ThemeProvider value={navigationTheme}>
        <RootNavigator />
        <StatusBar style="dark" />
        <Toast config={toastConfig} topOffset={56} visibilityTime={2500} />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  toast: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    height: "auto",
    minHeight: 60,
    paddingVertical: 10,
  },
  toastContent: { paddingHorizontal: 14 },
  toastTitle: { fontFamily: fonts.semibold, fontSize: 14, fontWeight: "normal", color: colors.textPrimary },
  toastBody: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
});
