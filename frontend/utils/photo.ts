import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

// Plenty for food recognition, and far smaller and faster to upload than a full photo.
export const SCAN_PHOTO_SIDE = 1280;
// Only ever shown as a meal photo, so it can be smaller again to save storage.
export const SAVED_PHOTO_SIDE = 800;

export const encodePhoto = async (uri: string, maxSide: number) => {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const { width, height } = original;
  const rendered =
    Math.max(width, height) > maxSide
      ? await ImageManipulator.manipulate(uri)
          .resize(width >= height ? { width: maxSide } : { height: maxSide })
          .renderAsync()
      : original;
  return rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
};
