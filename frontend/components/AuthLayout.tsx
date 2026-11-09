import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Logo } from "@/components/Logo";
import { colors, fonts, type } from "@/constants/design";

interface AuthLayoutProps {
  /** Shows the large logo and name above the form. */
  brand?: boolean;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ brand, title, subtitle, children }: AuthLayoutProps) {
  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View pointerEvents="none" style={styles.decor}>
        <Ionicons name="leaf" size={110} color={colors.primaryLight} style={styles.leafTop} />
        <Ionicons name="leaf" size={150} color={colors.primaryLight} style={styles.leafBottom} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {brand && (
            <>
              <Logo size={60} />
              <Text style={styles.brandName}>NutriScan</Text>
            </>
          )}
          <Text style={brand ? styles.tagline : styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  decor: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  leafTop: { position: "absolute", top: 36, right: -30, transform: [{ rotate: "20deg" }] },
  leafBottom: { position: "absolute", bottom: -24, left: -44 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  header: { alignItems: "center", marginBottom: 28 },
  brandName: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, color: colors.primaryDark, marginTop: 10 },
  tagline: { ...type.body, color: colors.textSecondary, marginTop: 4 },
  title: { ...type.h1, fontSize: 24, lineHeight: 30, color: colors.textPrimary, textAlign: "center" },
  subtitle: { ...type.body, color: colors.textSecondary, textAlign: "center", marginTop: 4 },
});
