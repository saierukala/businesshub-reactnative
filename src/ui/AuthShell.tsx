import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { Screen } from './Screen';

// The branded header used by login, register and forgot-password.
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <Screen top contentStyle={{ justifyContent: 'center', gap: 24 }}>
      <View style={styles.brand}>
        <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
          <Icon source="wrench" size={34} color={theme.colors.onPrimary} />
        </View>
        <Text variant="headlineMedium" style={{ fontWeight: '800' }}>HomeFix</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Appliance repair at your doorstep</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
        <View style={{ gap: 4 }}>
          <Text variant="titleLarge" style={{ fontWeight: '700' }}>{title}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{subtitle}</Text>
        </View>
        {children}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: 6 },
  logo: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  card: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 20, gap: 12 },
});
