import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, SegmentedButtons, Text } from 'react-native-paper';
import { useAppearance, type Mode } from '@/lib/appearance';
import { Card, SectionTitle } from '@/ui/Parts';
import { Screen } from '@/ui/Screen';
import { PALETTES, alpha, mix, useAppTheme, type PaletteId } from '@/ui/theme';

const MODES: { value: Mode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

// A tiny drawing of the app in this palette: the header bar, a button and the accent.
function Swatch({ id, selected, onPress }: { id: PaletteId; selected: boolean; onPress: () => void }) {
  const theme = useAppTheme();
  const p = PALETTES.find((x) => x.id === id)!;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${p.label} colour`}
      testID={`palette-${id}`}
      style={({ pressed }) => [
        styles.swatch,
        { borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant, borderWidth: selected ? 2 : 1, backgroundColor: theme.colors.surface },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={[styles.preview, { backgroundColor: mix(p.brand, '#ffffff', 0.93) }]}>
        <View style={[styles.previewBar, { backgroundColor: p.bar, borderColor: alpha(p.onBar, 0.12) }]}>
          <View style={{ width: 22, height: 4, borderRadius: 2, backgroundColor: p.onBar }} />
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.accent }} />
        </View>
        <View style={[styles.previewButton, { backgroundColor: p.brand }]} />
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: p.accent }} />
          <View style={{ flex: 2, height: 4, borderRadius: 2, backgroundColor: alpha(p.brand, 0.2) }} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="labelLarge" style={{ fontWeight: selected ? '800' : '600' }}>{p.label}</Text>
        {selected && <Icon source="check-circle" size={18} color={theme.colors.primary} />}
      </View>
    </Pressable>
  );
}

// The same Settings screen for every role. Both choices are saved on this device only.
export function SettingsScreen() {
  const theme = useAppTheme();
  const { mode, setMode, palette, setPalette } = useAppearance();
  return (
    <Screen>
      <SectionTitle>Appearance</SectionTitle>
      <Card style={{ gap: 12 }}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Light or dark (night) mode. System follows your phone. Saved on this device only.
        </Text>
        <SegmentedButtons value={mode} onValueChange={(v) => setMode(v as Mode)} buttons={MODES.map((m) => ({ ...m, testID: `appearance-${m.value}` }))} />
      </Card>

      <SectionTitle>App colour</SectionTitle>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: -8 }}>
        The header, tab bar and buttons. The same colours as the website. Changes at once.
      </Text>
      <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="App colour">
        {PALETTES.map((p) => <Swatch key={p.id} id={p.id} selected={palette === p.id} onPress={() => setPalette(p.id)} />)}
      </View>
    </Screen>
  );
}

// A row that opens Settings, for the account / More screens.
export function SettingsLink({ onPress }: { onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Card onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
        <Icon source="palette-outline" size={22} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="titleSmall" style={{ fontWeight: '700' }}>Settings</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Light / dark mode and app colour</Text>
      </View>
      <Icon source="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: '48%', flexGrow: 1, borderRadius: 16, padding: 8, gap: 8 },
  preview: { borderRadius: 10, padding: 8, gap: 8, height: 88 },
  previewBar: { height: 20, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  previewButton: { height: 14, borderRadius: 5, width: '70%' },
});
