import { Stack } from 'expo-router';
import { useStackOptions } from '@/ui/nav';

// Owner / Manager area: tabs (dashboard, bookings, customers, more) with every other screen pushed on top.
export default function StaffLayout() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="staff/bookings/[id]/index" options={{ title: 'Booking' }} />
      <Stack.Screen name="staff/bookings/[id]/receipt" options={{ title: 'Receipt' }} />
      <Stack.Screen name="staff/bookings/new" options={{ title: 'New booking' }} />
      <Stack.Screen name="staff/customers/[id]" options={{ title: 'Customer' }} />
      <Stack.Screen name="staff/technicians/index" options={{ title: 'Technicians' }} />
      <Stack.Screen name="staff/technicians/[id]" options={{ title: 'Technician' }} />
      <Stack.Screen name="staff/reassignments" options={{ title: 'Needs reassignment' }} />
      <Stack.Screen name="staff/services" options={{ title: 'Services' }} />
      <Stack.Screen name="staff/users" options={{ title: 'Users' }} />
      <Stack.Screen name="staff/reports" options={{ title: 'Reports' }} />
      <Stack.Screen name="staff/reviews" options={{ title: 'Reviews' }} />
      <Stack.Screen name="staff/audit" options={{ title: 'Audit log' }} />
      <Stack.Screen name="staff/notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="staff/roles" options={{ title: 'Roles & permissions' }} />
      <Stack.Screen name="staff/settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
