/**
 * Scan.tsx
 * Food scanning screen for NutriScan.
 * Allows the user to take a photo or pick from gallery,
 * then sends the image to the backend for AI-based food detection.
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import colors from "../constants/color";
import { API } from "../utils/axiosInstance";
import {
  requestCameraPermission,
  requestGalleryPermission,
} from "../utils/permission";

export default function ScanScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ─── Pick image from device gallery ───
  const pickImage = async () => {
    const granted = await requestGalleryPermission();
    if (!granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.4, // reduced quality to avoid 413 payload error
      base64: false,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // ─── Take a new photo using the device camera ───
  const takePhoto = async () => {
    const granted = await requestCameraPermission();
    if (!granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // ─── Send image to backend for AI food detection ───
  /**
   * Converts the selected image to Base64, sends it to the
   * backend /food/detect endpoint, then navigates to result.tsx
   * with the AI response and a flag indicating if quantity input is needed.
   */
  const analyzeFood = async () => {
    if (!image) {
      Alert.alert("No image", "Please select or take a photo first!");
      return;
    }

    try {
      setLoading(true);

      // Convert image URI to Base64 string for API transmission
      const base64 = await FileSystem.readAsStringAsync(image, {
        encoding: "base64",
      });

      const savedToken = await SecureStore.getItemAsync("token");

      const res = await API.post(
        "/food/detect",
        { image: base64 },
        { headers: { Authorization: `Bearer ${savedToken}` } },
      );

      // Navigate to result screen — pass AI data, image URI, and quantity flag
      router.push({
        pathname: "/result",
        params: {
          data: JSON.stringify(res.data),
          imageUri: image,
          needsQuantity: res.data.needsQuantityInput ? "true" : "false",
        },
      });
    } catch (error: any) {
      const status = error.response?.status;
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;
      Alert.alert("Detection Failed", `${status}: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Scan Food</Text>
      <Text style={styles.subHeading}>Take a photo or pick from gallery</Text>

      {/* Image preview box */}
      <View style={styles.imageBox}>
        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons
              name="camera-outline"
              size={60}
              color={colors.textSecondary}
            />
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}
      </View>

      {/* Camera / Gallery buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
          <Ionicons name="camera" size={22} color="white" />
          <Text style={styles.actionBtnText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
          <Ionicons name="images" size={22} color="white" />
          <Text style={styles.actionBtnText}>Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Remove selected image */}
      {image && (
        <TouchableOpacity
          style={styles.retakeBtn}
          onPress={() => setImage(null)}
        >
          <Text style={styles.retakeBtnText}>✕ Remove Image</Text>
        </TouchableOpacity>
      )}

      {/* Analyze button — disabled until image is selected */}
      <TouchableOpacity
        style={[styles.analyzeBtn, !image && { opacity: 0.5 }]}
        onPress={analyzeFood}
        disabled={!image || loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="sparkles" size={22} color="white" />
            <Text style={styles.analyzeBtnText}> Analyze Food</Text>
          </>
        )}
      </TouchableOpacity>

      {loading && (
        <Text style={styles.loadingText}>🤖 AI is analyzing your food...</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 60 },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subHeading: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  imageBox: {
    width: "100%",
    height: 280,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    marginBottom: 20,
  },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  placeholderText: { color: colors.textSecondary, fontSize: 14 },
  buttonRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },
  actionBtnText: { color: colors.textPrimary, fontWeight: "600", fontSize: 15 },
  retakeBtn: { alignItems: "center", marginBottom: 12, padding: 8 },
  retakeBtnText: { color: colors.textSecondary, fontSize: 14 },
  analyzeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 58,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    elevation: 4,
  },
  analyzeBtnText: { color: "white", fontSize: 18, fontWeight: "700" },
  loadingText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 16,
    fontSize: 14,
  },
});
