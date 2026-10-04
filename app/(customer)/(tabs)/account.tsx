import { AddressSection, ApplianceSection } from '@/features/records';
import { LogoutButton, ProfileCard } from '@/features/ProfileCard';
import { Screen } from '@/ui/Screen';

// The customer's own addresses and appliances (no customerId: the backend uses the session).
export default function Account() {
  return (
    <Screen>
      <ProfileCard showLogout={false} />
      <AddressSection />
      <ApplianceSection />
      <LogoutButton />
    </Screen>
  );
}
