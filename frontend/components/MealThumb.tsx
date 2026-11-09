import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "@/constants/design";

interface MealThumbProps {
  id: string;
  name: string;
  uri?: string | null;
  size?: number;
  round?: boolean;
}

// Falls back to an icon when a meal has no photo or its link has stopped working.
export function MealThumb({ id, name, uri, size = 56, round = false }: MealThumbProps) {
  const [failed, setFailed] = useState(false);
  const borderRadius = round ? size / 2 : 10;

  return (
    <View style={[styles.thumb, { width: size, height: size, borderRadius }]}>
      {uri && !failed ? (
        <Image
          // Signed links change on every load, so cache by meal rather than by link.
          source={{ uri, cacheKey: id }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          recyclingKey={id}
          onError={() => setFailed(true)}
          accessibilityLabel={`Photo of ${name}`}
        />
      ) : (
        <Ionicons name="restaurant-outline" size={Math.round(size * 0.4)} color={colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
