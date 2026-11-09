import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Toast from "react-native-toast-message";

import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { colors, fonts, type } from "@/constants/design";
import { useAuth } from "@/hooks/useAuth";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Toast.show({ type: "error", text1: "Enter your email and password" });
      return;
    }
    setLoading(true);
    await login(email.trim(), password);
    setLoading(false);
  };

  return (
    <AuthLayout brand title="Better food choices," subtitle="made easy.">
      <TextField
        label="Email address"
        icon="mail-outline"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextField
        label="Password"
        icon="lock-closed-outline"
        placeholder="Your password"
        password
        value={password}
        onChangeText={setPassword}
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={handleLogin}
      />
      <Button
        label="Sign in"
        trailingIcon="arrow-forward"
        loading={loading}
        onPress={handleLogin}
        style={styles.submit}
      />
      <Pressable
        accessibilityRole="link"
        style={styles.switch}
        onPress={() => router.push("/auth/register")}
      >
        <Text style={styles.switchText}>
          Don&apos;t have an account? <Text style={styles.switchLink}>Create one</Text>
        </Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: 8 },
  switch: { paddingVertical: 16, alignItems: "center" },
  switchText: { ...type.body, color: colors.textSecondary },
  switchLink: { fontFamily: fonts.semibold, color: colors.primaryDark },
});
