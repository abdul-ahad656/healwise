import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Linking, Platform, Share } from 'react-native';

function extensionFromUrl(url: string, fileType?: string): string {
  if (fileType) {
    const ext = fileType.toLowerCase().replace(/^\./, '');
    if (ext) return ext;
  }
  const match = url.match(/\.([a-z0-9]{2,5})(?:\?|$)/i);
  return match ? match[1].toLowerCase() : 'pdf';
}

/**
 * Download a prescription file to device storage and open the system share sheet
 * so the user can save to Files/Downloads (native). Falls back to opening the URL.
 */
export async function downloadPrescriptionFile(
  url: string,
  options?: { fileType?: string; baseName?: string }
): Promise<void> {
  if (!url?.trim()) {
    throw new Error('Prescription file URL is missing');
  }

  if (Platform.OS === 'web') {
    await Linking.openURL(url);
    return;
  }

  const ext = extensionFromUrl(url, options?.fileType);
  const base = (options?.baseName || 'prescription').replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${base}.${ext}`;
  const dest = `${FileSystem.documentDirectory}${fileName}`;

  const result = await FileSystem.downloadAsync(url, dest);

  try {
    await Share.share({
      url: result.uri,
      title: fileName,
      message: fileName,
    });
  } catch {
    await Linking.openURL(result.uri);
  }
}

export async function openPrescriptionInBrowser(url: string): Promise<void> {
  if (!url?.trim()) {
    throw new Error('Prescription file URL is missing');
  }
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    Alert.alert('Error', 'Cannot open this prescription link on your device.');
    return;
  }
  await Linking.openURL(url);
}
