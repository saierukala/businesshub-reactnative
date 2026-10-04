import { useLocalSearchParams } from 'expo-router';
import { TechJob } from '@/features/tech';

export default function TechJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TechJob id={id} />;
}
