// Pick a profile photo from the gallery or camera, crop it square and shrink it to 512x512 JPEG.
// A 4 MB camera photo becomes ~40 KB, well under the server's 300 KB limit. Returns a data URL, or null if cancelled.
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const SIZE = 512;

export async function pickPhoto(source: 'library' | 'camera'): Promise<string | null> {
  const permission =
    source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(source === 'camera' ? 'Allow camera access in your phone settings to take a photo' : 'Allow photo access in your phone settings to choose a photo');
  }

  // allowsEditing lets the person crop a square on the phone; the centre crop below covers web, where it is ignored.
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;

  const { uri, width, height } = result.assets[0];
  const side = Math.min(width, height);
  const context = ImageManipulator.manipulate(uri);
  context.crop({ originX: (width - side) / 2, originY: (height - side) / 2, width: side, height: side });
  if (side > SIZE) context.resize({ width: SIZE, height: SIZE });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
  if (!saved.base64) throw new Error('Could not read the photo. Please try another one.');
  return `data:image/jpeg;base64,${saved.base64}`;
}
