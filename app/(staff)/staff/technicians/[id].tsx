import { useLocalSearchParams } from 'expo-router';
import { TechnicianDetail } from '@/features/staff/technicians';

export default function StaffTechnician() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TechnicianDetail id={id} />;
}
