import { useLocalSearchParams } from 'expo-router';
import { BookingDetail } from '@/features/booking/BookingDetail';

export default function StaffBooking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookingDetail id={id} staff />;
}
