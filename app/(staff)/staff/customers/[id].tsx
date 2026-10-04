import { useLocalSearchParams } from 'expo-router';
import { CustomerProfile } from '@/features/staff/customers';

export default function StaffCustomer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CustomerProfile id={id} />;
}
