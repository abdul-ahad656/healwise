import { Stack } from 'expo-router';

export default function DoctorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="patients" />
      <Stack.Screen name="teleconsult" />
      <Stack.Screen name="upload-prescription" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
