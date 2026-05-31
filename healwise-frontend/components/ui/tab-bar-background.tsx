import { useThemeColor } from '@/hooks/use-theme-color';
import { StyleSheet, View } from 'react-native';

export default function TabBarBackground() {
  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#151718' }, 'background');
  return (
    <View style={[styles.background, { backgroundColor }]} />
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    elevation: 4, // shadow for Android
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
});
