import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from './theme';

// Tiny charts drawn with plain Views (no chart library): enough for a phone dashboard and easy to read.
// Colours come from the app colour (palette), so the charts change with it.

// Horizontal bars: label on the left, bar in the middle, value on the right. Without `color`, each row gets the next chart colour.
export function BarList({ rows, color }: { rows: { label: string; value: number; display?: string }[]; color?: string }) {
  const theme = useAppTheme();
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <View style={{ gap: 12 }}>
      {rows.map((r, i) => {
        const c = color ?? theme.app.chart[i % theme.app.chart.length];
        return (
          <View key={`${r.label}-${i}`} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text variant="bodyMedium" style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>{r.label}</Text>
              <Text variant="bodyMedium" style={{ fontWeight: '800' }}>{r.display ?? r.value}</Text>
            </View>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: theme.colors.surfaceVariant, overflow: 'hidden' }}>
              <View style={{ height: 10, borderRadius: 5, width: `${(r.value / max) * 100}%`, backgroundColor: c }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Vertical bars for a short series, e.g. bookings per day for the last 7 days. The best day is in the accent colour.
export function MiniBars({ points }: { points: { label: string; value: number }[] }) {
  const theme = useAppTheme();
  const max = Math.max(1, ...points.map((p) => p.value));
  const top = points.findIndex((p) => p.value === max && max > 0);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 140 }}>
      {points.map((p, i) => (
        <View key={`${p.label}-${i}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 }}>
          <Text variant="labelSmall" style={{ fontWeight: '800' }}>{p.value}</Text>
          <LinearGradient
            colors={i === top ? [theme.app.accent, theme.app.accent] : [theme.colors.primary, theme.app.gradient[1]]}
            style={{ width: '100%', height: Math.max(6, (p.value / max) * 96), borderRadius: 8 }}
          />
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{p.label}</Text>
        </View>
      ))}
    </View>
  );
}
