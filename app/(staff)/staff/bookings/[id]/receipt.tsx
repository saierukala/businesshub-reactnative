import { useLocalSearchParams } from 'expo-router';
import { Receipt } from '@/features/booking/Receipt';

export default function StaffReceipt() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Receipt bookingId={id} />;
}
