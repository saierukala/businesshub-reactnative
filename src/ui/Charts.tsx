import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

// Tiny charts drawn with plain Views (no chart library): enough for a phone dashboard and easy to read.

// Horizontal bars: label on the left, bar in the middle, value on the right.
export function BarList({ rows, color }: { rows: { label: string; value: number; display?: string }[]; color?: string }) {
  const theme = useTheme();
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <View style={{ gap: 10 }}>
      {rows.map((r, i) => (
        <View key={`${r.label}-${i}`} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>{r.label}</Text>
            <Text variant="bodyMedium" style={{ fontWeight: '700' }}>{r.display ?? r.value}</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.colors.surfaceVariant }}>
            <View style={{ height: 8, borderRadius: 4, width: `${(r.value / max) * 100}%`, backgroundColor: color ?? theme.colors.primary }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Vertical bars for a short series, e.g. bookings per day for the last 7 days.
export function MiniBars({ points }: { points: { label: string; value: number }[] }) {
  const theme = useTheme();
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120 }}>
      {points.map((p, i) => (
        <View key={`${p.label}-${i}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 }}>
          <Text variant="labelSmall" style={{ fontWeight: '700' }}>{p.value}</Text>
          <View style={{ width: '100%', height: Math.max(4, (p.value / max) * 80), borderRadius: 6, backgroundColor: theme.colors.primary }} />
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{p.label}</Text>
        </View>
      ))}
    </View>
  );
}
