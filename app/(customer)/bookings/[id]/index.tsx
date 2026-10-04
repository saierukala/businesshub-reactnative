import { useLocalSearchParams } from 'expo-router';
import { BookingDetail } from '@/features/booking/BookingDetail';

export default function CustomerBooking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookingDetail id={id} />;
}
