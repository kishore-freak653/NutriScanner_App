import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { colors, fonts, radius } from "@/constants/design";

type Variant = "primary" | "outlined" | "soft";
type IconName = ComponentProps<typeof Ionicons>["name"];

interface ButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  trailingIcon?: IconName;
  variant?: Variant;
  /** Puts the icon above the label, for larger action tiles. */
  stacked?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const foreground: Record<Variant, string> = {
  primary: colors.onPrimary,
  outlined: colors.primaryDark,
  soft: colors.primaryDark,
};

export function Button({
  label,
  onPress,
  icon,
  trailingIcon,
  variant = "primary",
  stacked = false,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const inactive = disabled || loading;
  const color = foreground[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        stacked && styles.stacked,
        pressed && variant === "primary" && styles.primaryPressed,
        pressed && variant !== "primary" && styles.softPressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={stacked ? 26 : 20} color={color} />}
          <Text style={[styles.label, { color }]}>{label}</Text>
          {trailingIcon && <Ionicons name={trailingIcon} size={18} color={color} />}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: radius.button,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  stacked: { height: 78, flexDirection: "column", gap: 4 },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryDark },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  soft: { backgroundColor: colors.primaryLight },
  softPressed: { backgroundColor: "#D3EEDC" },
  disabled: { opacity: 0.5 },
  label: { fontFamily: fonts.semibold, fontSize: 15 },
});
