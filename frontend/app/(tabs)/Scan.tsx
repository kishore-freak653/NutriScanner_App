/**
 * Food scanning screen. Takes or picks a photo, shrinks it, sends it to the
 * backend for AI detection, then opens the result screen.
 */

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { card, colors, radius, type } from "@/constants/design";
import { API, getErrorMessage } from "@/utils/api";
import { encodePhoto, SCAN_PHOTO_SIDE } from "@/utils/photo";
import { requestCameraPermission, requestGalleryPermission } from "@/utils/permission";

const VIEWFINDER_HEIGHT = 300;

type Photo = Pick<ImagePicker.ImagePickerAsset, "uri" | "width" | "height">;

function ScanningLine() {
  const position = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timing = (toValue: number) =>
      Animated.timing(position, {
        toValue,
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([timing(1), timing(0)]));
    loop.start();
    return () => loop.stop();
  }, [position]);

  const translateY = position.interpolate({
    inputRange: [0, 1],
    outputRange: [0, VIEWFINDER_HEIGHT - 3],
  });

  return <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />;
}

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const sentToResult = useRef(false);

  // Coming back from a finished scan starts fresh.
  useFocusEffect(
    useCallback(() => {
      if (sentToResult.current) {
        sentToResult.current = false;
        setPhoto(null);
      }
    }, []),
  );

  const pick = async (
    requestPermission: () => Promise<boolean>,
    launch: (options: ImagePicker.ImagePickerOptions) => Promise<ImagePicker.ImagePickerResult>,
  ) => {
    if (!(await requestPermission())) return;
    const result = await launch({ mediaTypes: ["images"], quality: 0.9 });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const takePhoto = () => pick(requestCameraPermission, ImagePicker.launchCameraAsync);
  const pickImage = () => pick(requestGalleryPermission, ImagePicker.launchImageLibraryAsync);

  const analyze = async () => {
    if (!photo) return;
    try {
      setAnalyzing(true);
      const shrunk = await encodePhoto(photo.uri, SCAN_PHOTO_SIDE);
      const res = await API.post("/food/detect", { image: shrunk.base64 });
      sentToResult.current = true;
      router.push({
        pathname: "/result",
        params: {
          data: JSON.stringify(res.data),
          imageUri: shrunk.uri,
          source: "scan",
          needsQuantity: res.data.needsQuantityInput ? "true" : "false",
        },
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to analyze image",
        text2: getErrorMessage(error, "Please try again."),
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Scan Food"
        onBack={photo && !analyzing ? () => setPhoto(null) : undefined}
        backIcon="close"
        backLabel="Remove photo"
      />

      <View style={styles.viewfinder}>
        {photo ? (
          <>
            <Image
              source={{ uri: photo.uri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityLabel="Selected food photo"
            />
            {analyzing && <ScanningLine />}
          </>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="restaurant-outline" size={40} color={colors.primary} />
            <Text style={styles.placeholderText}>Fit the whole plate in frame</Text>
          </View>
        )}
        <View pointerEvents="none" style={[styles.corner, styles.topLeft]} />
        <View pointerEvents="none" style={[styles.corner, styles.topRight]} />
        <View pointerEvents="none" style={[styles.corner, styles.bottomLeft]} />
        <View pointerEvents="none" style={[styles.corner, styles.bottomRight]} />
      </View>

      <Button
        label="Take photo"
        icon="camera-outline"
        variant="outlined"
        disabled={analyzing}
        onPress={takePhoto}
      />
      <Button
        label="Choose from gallery"
        icon="image-outline"
        variant="outlined"
        disabled={analyzing}
        onPress={pickImage}
        style={styles.gallery}
      />

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.orLine} />
      </View>

      <Button
        label="Analyze food"
        icon="sparkles-outline"
        variant={photo ? "primary" : "soft"}
        disabled={!photo}
        loading={analyzing}
        onPress={analyze}
      />
      {analyzing && <Text style={styles.status}>Analyzing your food...</Text>}

      <View style={styles.otherWays}>
        <Button
          label="Barcode"
          icon="barcode-outline"
          variant="soft"
          disabled={analyzing}
          onPress={() => router.push("/barcode")}
          style={styles.otherWay}
        />
        <Button
          label="Type it"
          icon="create-outline"
          variant="soft"
          disabled={analyzing}
          onPress={() => router.push("/add-meal")}
          style={styles.otherWay}
        />
      </View>
    </ScrollView>
  );
}

const CORNER = 28;
const CORNER_INSET = 12;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  viewfinder: {
    ...card,
    height: VIEWFINDER_HEIGHT,
    overflow: "hidden",
    marginBottom: 16,
    borderRadius: radius.input,
  },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  placeholderText: { ...type.body, color: colors.textSecondary },
  corner: { position: "absolute", width: CORNER, height: CORNER, borderColor: colors.surface },
  topLeft: {
    top: CORNER_INSET,
    left: CORNER_INSET,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: CORNER_INSET,
    right: CORNER_INSET,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: CORNER_INSET,
    left: CORNER_INSET,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: CORNER_INSET,
    right: CORNER_INSET,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
  },
  gallery: { marginTop: 8 },
  otherWays: { flexDirection: "row", gap: 8, marginTop: 12 },
  otherWay: { flex: 1 },
  orRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { ...type.caption, color: colors.textSecondary },
  status: { ...type.body, color: colors.textSecondary, textAlign: "center", marginTop: 12 },
});
