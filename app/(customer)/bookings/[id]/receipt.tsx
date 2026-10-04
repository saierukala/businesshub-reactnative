import { useLocalSearchParams } from 'expo-router';
import { Receipt } from '@/features/booking/Receipt';

export default function CustomerReceipt() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Receipt bookingId={id} />;
}
