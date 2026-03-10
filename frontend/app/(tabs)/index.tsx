import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import colors from "../constants/color";
import { useAuth } from "../custom-hooks/useAuth";
import { useEffect } from "react";

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading]);

  if (loading || !user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Ionicons name="leaf" size={26} color={colors.primary} />
          <Text style={styles.appName}>NutriScan</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Welcome */}
      <Text style={styles.welcomeText}>
        Welcome back, {user?.name?.split(" ")[0] ?? "User"}! 👋
      </Text>
      <Text style={styles.welcomeSub}>
        Track your nutrition with AI-powered food scanning
      </Text>

      {/* Banner Card */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerTextCol}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <Text style={styles.aiBadgeText}>AI Powered</Text>
          </View>
          <Text style={styles.bannerTitle}>Scan any food instantly</Text>
          <Text style={styles.bannerSub}>
            Get calories, protein, carbs & fat in seconds
          </Text>
        </View>
        <Image
          source={require("../../assets/images/ScanImage.png")}
          style={styles.bannerImage}
        />
      </View>

      {/* Scan Button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => router.push("/(tabs)/Scan")}
      >
        <Ionicons name="camera" size={22} color="white" />
        <Text style={styles.scanText}>  Scan Food</Text>
      </TouchableOpacity>

      {/* Quick Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={22} color="#ff6b35" />
          <Text style={styles.statLabel}>Calories</Text>
          <Text style={styles.statSub}>Track daily</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="barbell" size={22} color="#2979ff" />
          <Text style={styles.statLabel}>Protein</Text>
          <Text style={styles.statSub}>Build muscle</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="leaf" size={22} color={colors.primary} />
          <Text style={styles.statLabel}>Nutrition</Text>
          <Text style={styles.statSub}>Stay healthy</Text>
        </View>
      </View>

      {/* Recent Scans */}
      {/* <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Scans</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/History")}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View> */}

      {/* <View style={styles.emptyCard}>
        <Ionicons name="receipt-outline" size={36} color={colors.textSecondary} />
        <Text style={styles.emptyText}>No scans yet</Text>
        <Text style={styles.emptySubText}>
          Tap Scan Food to get started!
        </Text>
      </View> */}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  bannerCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    overflow: "hidden",
    minHeight: 150,
  },
  bannerTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0d2b1a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  aiBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "600",
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  bannerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bannerImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  scanButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    elevation: 4,
  },
  scanText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    marginTop:10,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  emptySubText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
});