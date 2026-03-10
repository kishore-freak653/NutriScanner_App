import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import colors from "../constants/color";
import { API } from "../utils/axiosInstance";

export default function HistoryScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch every time tab is focused
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, []),
  );

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const savedToken = await SecureStore.getItemAsync("token");
      const res = await API.get("/food/history", {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      setRecords(res.data.records || []);
    } catch (error: any) {
      Alert.alert("Error", "Could not load history");
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    Alert.alert("Delete", "Remove this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const savedToken = await SecureStore.getItemAsync("token");
            await API.delete(`/food/${id}`, {
              headers: { Authorization: `Bearer ${savedToken}` },
            });
            setRecords((prev) => prev.filter((r) => r._id !== id));
          } catch {
            Alert.alert("Error", "Could not delete record");
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.heading}>History</Text>
      <Text style={styles.subHeading}>Your past food scans</Text>

      {/* Empty State */}
      {records.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="nutrition-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>No records yet</Text>
          <Text style={styles.emptyText}>
            Scan some food and save it to see history here!
          </Text>
        </View>
      ) : (
        // Replace the card in History.tsx with this:

        records.map((record) => (
          <View key={record._id} style={styles.card}>
            {/* Food Image if exists */}
            {record.imageUrl && (
              <Image
                source={{ uri: record.imageUrl }}
                style={styles.cardImage}
              />
            )}

            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.foodNames}>
                  {record.foods.map((f: any) => f.name).join(", ")}
                </Text>
                <Text style={styles.dateText}>
                  {formatDate(record.createdAt)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => deleteRecord(record._id)}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={18} color="#e53935" />
              </TouchableOpacity>
            </View>

            {/* Macros Row */}
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: "#ff6b35" }]}>
                  {record.totalCalories}
                </Text>
                <Text style={styles.macroLabel}>🔥 cal</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: "#2979ff" }]}>
                  {record.totalProtein}g
                </Text>
                <Text style={styles.macroLabel}>💪 protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: "#ff1744" }]}>
                  {record.totalFat}g
                </Text>
                <Text style={styles.macroLabel}>🫧 fat</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, { color: "#ffea00" }]}>
                  {record.totalCarbs}g
                </Text>
                <Text style={styles.macroLabel}>🌾 carbs</Text>
              </View>
            </View>
          </View>
        ))
      )}
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
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  cardImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: "cover",
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  foodNames: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    maxWidth: "85%",
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  deleteBtn: {
    padding: 4,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroItem: {
    alignItems: "center",
    flex: 1,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  macroLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  },
});
