import { Stack } from 'expo-router';
import { useStackOptions } from '@/ui/nav';

// Technician area: tabs (today, account) with the job screen pushed on top.
export default function TechLayout() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="tech/jobs/[id]/index" options={{ title: 'Job' }} />
      <Stack.Screen name="tech/jobs/[id]/receipt" options={{ title: 'Receipt' }} />
      <Stack.Screen name="tech/notifications" options={{ title: 'Notifications' }} />
    </Stack>
  );
}
