import { Alert, Platform } from "react-native";

// Alert.alert does nothing on web, so the web build uses the browser's dialog.
export const confirmAction = (
  title: string,
  message: string,
  actionLabel: string,
  onConfirm: () => void,
) => {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: actionLabel, style: "destructive", onPress: onConfirm },
  ]);
};
