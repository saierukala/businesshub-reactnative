import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, PaperProvider, useTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { en, registerTranslation } from 'react-native-paper-dates';
import { AppearanceProvider, useAppearance } from '@/lib/appearance';
import { AuthProvider, homeFor, useAuth, type Role } from '@/lib/auth';
import { darkTheme, lightTheme } from '@/ui/theme';
import { ToastProvider } from '@/ui/toast';

registerTranslation('en', en); // texts for the date and time pickers

// Each role has its own folder of screens: (staff), (tech), (customer). Everyone else sees (auth).
const AREA: Record<Role, string> = { OWNER: '(staff)', MANAGER: '(staff)', TECHNICIAN: '(tech)', CUSTOMER: '(customer)' };

// Sends logged-out users to /login, and keeps each role inside its own area.
// (Hiding screens is only UX: the API checks the role on every request.)
// The navigator (<Slot />) is ALWAYS rendered and we move with router.replace: swapping it for a <Redirect>
// makes Expo Router rebuild the whole app, which loses state such as a "saved" message shown at login.
function Gate() {
  const { user, loading } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const area = useSegments()[0] as string | undefined;
  const target = loading ? null : !user ? (area === '(auth)' ? null : '/login') : area !== AREA[user.role] ? homeFor(user.role) : null;

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      {/* Covers the screen while we check the session or switch area, so nothing from the wrong area flashes. */}
      {(loading || target) && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background, justifyContent: 'center' }]}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15_000 } } }));
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <AppearanceProvider>
          <Themed />
        </AppearanceProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

// Light or dark from Settings (or the phone's choice, when set to System).
function Themed() {
  const { dark } = useAppearance();
  return (
    <PaperProvider theme={dark ? darkTheme : lightTheme}>
      <ToastProvider>
        <AuthProvider>
          <StatusBar style={dark ? 'light' : 'dark'} />
          <Gate />
        </AuthProvider>
      </ToastProvider>
    </PaperProvider>
  );
}
