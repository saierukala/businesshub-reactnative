import { useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { ActivityIndicator, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Redirect, Slot, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { en, registerTranslation } from 'react-native-paper-dates';
import { AuthProvider, homeFor, useAuth, type Role } from '@/lib/auth';
import { darkTheme, lightTheme } from '@/ui/theme';
import { ToastProvider } from '@/ui/toast';

registerTranslation('en', en); // texts for the date and time pickers

// Each role has its own folder of screens: (staff), (tech), (customer). Everyone else sees (auth).
const AREA: Record<Role, string> = { OWNER: '(staff)', MANAGER: '(staff)', TECHNICIAN: '(tech)', CUSTOMER: '(customer)' };

// Sends logged-out users to /login, and keeps each role inside its own area.
// (Hiding screens is only UX: the API checks the role on every request.)
function Gate() {
  const { user, loading } = useAuth();
  const area = useSegments()[0] as string | undefined;

  if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  if (!user) return area === '(auth)' ? <Slot /> : <Redirect href="/login" />;
  if (area !== AREA[user.role]) return <Redirect href={homeFor(user.role)} />;
  return <Slot />;
}

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15_000 } } }));
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <PaperProvider theme={dark ? darkTheme : lightTheme}>
          <ToastProvider>
            <AuthProvider>
              <StatusBar style={dark ? 'light' : 'dark'} />
              <Gate />
            </AuthProvider>
          </ToastProvider>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
