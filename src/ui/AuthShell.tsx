import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { versionLabel } from '@/lib/version';
import { Screen } from './Screen';
import { alpha, useAppTheme } from './theme';

// The branded header used by login, register, forgot-password and "I have a code":
// a gradient band in the app colour with the logo, and the form card overlapping it.
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Screen contentStyle={{ paddingHorizontal: 0, paddingTop: 0, gap: 0 }}>
      <LinearGradient colors={theme.app.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.band, { paddingTop: insets.top + 36 }]}>
        <View style={[styles.logo, { backgroundColor: alpha(theme.app.onGradient, 0.16), borderColor: alpha(theme.app.onGradient, 0.35) }]}>
          <Icon source="wrench" size={36} color={theme.app.onGradient} />
        </View>
        <Text variant="headlineMedium" style={{ fontWeight: '800', color: theme.app.onGradient, letterSpacing: 0.3 }}>HomeFix</Text>
        <Text variant="bodyMedium" style={{ color: theme.app.onGradient, opacity: 0.85 }}>Appliance repair at your doorstep</Text>
      </LinearGradient>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, boxShadow: `0 10px 30px ${alpha(theme.app.shadow, theme.dark ? 0.5 : 0.12)}` },
        ]}
      >
        <View style={{ gap: 4 }}>
          <Text variant="titleLarge" style={{ fontWeight: '800' }}>{title}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{subtitle}</Text>
        </View>
        {children}
      </View>
      <Text variant="labelSmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, marginBottom: 16 }} testID="app-version">{versionLabel()}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  band: { alignItems: 'center', gap: 6, paddingBottom: 64, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  logo: { width: 76, height: 76, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  card: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 20, gap: 12, marginHorizontal: 16, marginTop: -40, marginBottom: 24 },
});
