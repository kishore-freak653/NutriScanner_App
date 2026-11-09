import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Toast from "react-native-toast-message";

import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { colors, fonts, type } from "@/constants/design";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      Toast.show({ type: "error", text1: "Please fill in every field" });
      return;
    }
    setLoading(true);
    await register(name.trim(), email.trim(), password, phone.trim());
    setLoading(false);
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join NutriScan and start tracking your meals."
    >
      <TextField
        label="Full name"
        icon="person-outline"
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        textContentType="name"
      />
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
        label="Phone number"
        icon="call-outline"
        placeholder="+91 98765 43210"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      <TextField
        label="Password"
        icon="lock-closed-outline"
        placeholder="Create a password"
        hint="At least 6 characters."
        password
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Button
        label="Create account"
        trailingIcon="arrow-forward"
        loading={loading}
        onPress={handleSignUp}
        style={styles.submit}
      />
      <Pressable
        accessibilityRole="link"
        style={styles.switch}
        onPress={() => router.replace("/auth/login")}
      >
        <Text style={styles.switchText}>
          Already have an account? <Text style={styles.switchLink}>Sign in</Text>
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
