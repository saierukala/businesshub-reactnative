import { useRouter } from 'expo-router';
import { ProfileCard } from '@/features/ProfileCard';
import { SettingsLink } from '@/features/Settings';
import { Screen } from '@/ui/Screen';

export default function TechAccount() {
  const router = useRouter();
  return (
    <Screen>
      <SettingsLink onPress={() => router.push('/tech/settings')} />
      <ProfileCard />
    </Screen>
  );
}
