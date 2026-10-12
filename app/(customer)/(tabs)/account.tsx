import { useRouter } from 'expo-router';
import { AddressSection, ApplianceSection } from '@/features/records';
import { LogoutButton, ProfileCard } from '@/features/ProfileCard';
import { SettingsLink } from '@/features/Settings';
import { Screen } from '@/ui/Screen';

// The customer's own addresses and appliances (no customerId: the backend uses the session).
export default function Account() {
  const router = useRouter();
  return (
    <Screen>
      <ProfileCard showLogout={false} />
      <AddressSection />
      <ApplianceSection />
      <SettingsLink onPress={() => router.push('/settings')} />
      <LogoutButton />
    </Screen>
  );
}
