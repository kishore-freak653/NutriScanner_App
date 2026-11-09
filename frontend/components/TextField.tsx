import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors, fonts, radius, type } from "@/constants/design";

interface TextFieldProps extends TextInputProps {
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  hint?: string;
  /** Hides the value and adds a show/hide toggle. */
  password?: boolean;
}

export function TextField({ label, icon, hint, password, ...input }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.group}>
      <View style={[styles.wrapper, focused && styles.wrapperFocused]}>
        <Ionicons
          name={icon}
          size={20}
          color={focused ? colors.primary : colors.textSecondary}
        />
        <View style={styles.fields}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            {...input}
            accessibilityLabel={label}
            style={styles.input}
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.primary}
            secureTextEntry={password && !revealed}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            hitSlop={12}
            onPress={() => setRevealed((value) => !value)}
          >
            <Ionicons
              name={revealed ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 12 },
  wrapper: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  wrapperFocused: { borderColor: colors.primary },
  fields: { flex: 1 },
  label: { ...type.caption, fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  input: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  hint: { ...type.caption, color: colors.textSecondary, marginTop: 6, marginLeft: 4 },
});
