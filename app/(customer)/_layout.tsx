import { Stack } from 'expo-router';
import { useStackOptions } from '@/ui/nav';

// Customer area: tabs (home, bookings, book, account) with detail screens pushed on top.
export default function CustomerLayout() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="bookings/[id]/index" options={{ title: 'Booking' }} />
      <Stack.Screen name="bookings/[id]/receipt" options={{ title: 'Receipt' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
    </Stack>
  );
}
