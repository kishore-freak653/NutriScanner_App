import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

// ─── Camera Permission ───
export const requestCameraPermission = async (): Promise<boolean> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Permission needed", "Allow camera access to take photo");
    return false;
  }
  return true;
};

// ─── Gallery Permission ───
export const requestGalleryPermission = async (): Promise<boolean> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Permission needed", "Allow gallery access to pick image");
    return false;
  }
  return true;
};
