import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ComponentProps } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/constants/design";

type IconName = ComponentProps<typeof Ionicons>["name"];

const tabIcon =
  (active: IconName, inactive: IconName) =>
  function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return <Ionicons name={focused ? active : inactive} size={24} color={color} />;
  };

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62 + insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Today", tabBarIcon: tabIcon("home", "home-outline") }}
      />
      <Tabs.Screen
        name="Scan"
        options={{ title: "Scan", tabBarIcon: tabIcon("scan", "scan-outline") }}
      />
      <Tabs.Screen
        name="History"
        options={{ title: "History", tabBarIcon: tabIcon("time", "time-outline") }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: tabIcon("person", "person-outline") }}
      />
    </Tabs>
  );
}
