import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="manage-doctors" />
      <Stack.Screen name="manage-health-tips" />
      <Stack.Screen name="manage-medicine" />
      <Stack.Screen name="analytics" />
    </Stack>
  );
}
