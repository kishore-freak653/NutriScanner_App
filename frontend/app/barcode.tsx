import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TextField } from "@/components/TextField";
import { card, colors, radius, type } from "@/constants/design";
import { API, getErrorMessage } from "@/utils/api";

const hasCameraScanner = Platform.OS !== "web";

export default function BarcodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  // The camera reports the same code many times a second, so only the first counts.
  const busy = useRef(false);

  const lookUp = async (code: string) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setProblem(null);
    try {
      const res = await API.get(`/food/barcode/${encodeURIComponent(code)}`);
      const { food } = res.data;
      router.replace({
        pathname: "/result",
        params: {
          data: JSON.stringify({ foods: [food] }),
          needsQuantity: "true",
          source: "barcode",
        },
      });
    } catch (err) {
      setProblem(getErrorMessage(err, "Please try again."));
    } finally {
      // Stays locked after a miss until "Scan again", so it doesn't retry in a loop.
      setLoading(false);
    }
  };

  const scanAgain = () => {
    busy.current = false;
    setProblem(null);
  };

  const submitTyped = () => {
    busy.current = false;
    lookUp(typed.trim());
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Scan a barcode" onBack={() => router.back()} />

        {hasCameraScanner && (
          <View style={styles.viewfinder}>
            {permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
                onBarcodeScanned={({ data }) => lookUp(data)}
              />
            ) : (
              <View style={styles.permission}>
                <Text style={styles.permissionText}>
                  Allow camera access to read barcodes on packets.
                </Text>
                <Button label="Allow camera" variant="outlined" onPress={requestPermission} />
              </View>
            )}
          </View>
        )}

        {problem && (
          <View style={styles.problem}>
            <Text style={styles.problemText}>{problem}</Text>
            <View style={styles.problemActions}>
              {hasCameraScanner && (
                <Button
                  label="Scan again"
                  variant="outlined"
                  onPress={scanAgain}
                  style={styles.problemAction}
                />
              )}
              <Button
                label="Add it myself"
                variant="soft"
                onPress={() => router.replace({ pathname: "/add-meal", params: { tab: "quick" } })}
                style={styles.problemAction}
              />
            </View>
          </View>
        )}

        <TextField
          label="Or type the barcode number"
          icon="barcode-outline"
          keyboardType="number-pad"
          value={typed}
          onChangeText={(value) => setTyped(value.replace(/\D/g, ""))}
          maxLength={14}
        />
        <Button
          label="Look up"
          variant="outlined"
          loading={loading}
          disabled={typed.length < 8}
          onPress={submitTyped}
        />

        <Text style={styles.credit}>Product data from Open Food Facts, a community database.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 16 },
  viewfinder: {
    ...card,
    height: 280,
    overflow: "hidden",
    marginBottom: 16,
    borderRadius: radius.input,
  },
  permission: { flex: 1, justifyContent: "center", padding: 16, gap: 12 },
  permissionText: { ...type.body, color: colors.textSecondary, textAlign: "center" },
  problem: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.card,
    padding: 12,
    marginBottom: 16,
  },
  problemText: { ...type.body, color: colors.errorDark, marginBottom: 10 },
  problemActions: { flexDirection: "row", gap: 8 },
  problemAction: { flex: 1 },
  credit: { ...type.caption, color: colors.textSecondary, textAlign: "center", marginTop: 16 },
});
