import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, type } from "@/constants/design";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backIcon?: "arrow-back" | "close";
  backLabel?: string;
  right?: ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backIcon = "arrow-back",
  backLabel = "Go back",
  right,
}: ScreenHeaderProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {onBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            hitSlop={10}
            onPress={onBack}
          >
            <Ionicons name={backIcon} size={24} color={colors.textPrimary} />
          </Pressable>
        )}
      </View>
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", minHeight: 44, marginBottom: 16 },
  side: { width: 44 },
  sideRight: { alignItems: "flex-end" },
  center: { flex: 1, alignItems: "center" },
  title: { ...type.h3, fontSize: 18, lineHeight: 24, color: colors.textPrimary },
  subtitle: { ...type.caption, color: colors.textSecondary, marginTop: 2, textAlign: "center" },
});
