import { Text, SegmentedButtons, useTheme } from 'react-native-paper';
import { useAppearance, type Mode } from '@/lib/appearance';
import { Card, SectionTitle } from '@/ui/Parts';
import { Screen } from '@/ui/Screen';

const MODES: { value: Mode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

// The same Settings screen for every role. (The web's "Sidebar color" has no mobile equivalent: there is no sidebar.)
export function SettingsScreen() {
  const theme = useTheme();
  const { mode, setMode } = useAppearance();
  return (
    <Screen>
      <SectionTitle>Appearance</SectionTitle>
      <Card style={{ gap: 12 }}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Light or dark (night) mode. System follows your phone. Saved on this device only.
        </Text>
        <SegmentedButtons value={mode} onValueChange={(v) => setMode(v as Mode)} buttons={MODES.map((m) => ({ ...m, testID: `appearance-${m.value}` }))} />
      </Card>
    </Screen>
  );
}

// A row that opens Settings, for the account / More screens.
export function SettingsLink({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Card onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text variant="titleSmall" style={{ fontWeight: '700' }}>Settings</Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Light / dark mode</Text>
    </Card>
  );
}
