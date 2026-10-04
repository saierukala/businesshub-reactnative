import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/lib/auth';

// Sends logged-out users to /login and logged-in users away from it.
function Gate() {
  const { user, loading } = useAuth();
  const onLogin = useSegments()[0] === 'login';
  if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  if (!user && !onLogin) return <Redirect href="/login" />;
  if (user && onLogin) return <Redirect href="/" />;
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Today' }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="visit/[id]" options={{ title: 'Visit' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </QueryClientProvider>
  );
}
