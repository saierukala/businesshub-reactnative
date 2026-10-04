import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { FAB } from 'react-native-paper';
import { BookingsList } from '@/features/booking/BookingsList';

export default function StaffBookings() {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <BookingsList staff />
      <FAB icon="plus" label="New booking" onPress={() => router.push('/staff/bookings/new')} style={{ position: 'absolute', right: 16, bottom: 16 }} />
    </View>
  );
}
