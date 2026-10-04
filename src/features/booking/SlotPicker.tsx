import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { addDays, dayParts, formatDay, formatTime, istDay, istHour } from '@/lib/format';
import { useAvailability } from '@/lib/queries/bookings';
import type { SlotOption } from '@/lib/types';
import { EmptyState, ErrorState, ListSkeleton } from '@/ui/Parts';

type Props = {
  serviceId: string;
  area: string;
  date: string; // YYYY-MM-DD in IST, "" until chosen
  slot?: SlotOption;
  onChange: (date: string, slot: SlotOption | undefined) => void;
  maxDaysAhead?: number;
  // Rescheduling: the booking being moved. Its own time does not block other slots, and its current start is not offered again.
  reschedule?: { bookingId: string; currentStartAt: string };
};

const PARTS = [
  { label: 'Morning', icon: '🌅', test: (h: number) => h < 12 },
  { label: 'Afternoon', icon: '☀️', test: (h: number) => h >= 12 && h < 16 },
  { label: 'Evening', icon: '🌆', test: (h: number) => h >= 16 },
];

// Pick a day from a strip, then one of the start times the BACKEND says are free.
// The app never works out availability, working hours or the cutoff itself.
export function SlotPicker({ serviceId, area, date, slot, onChange, maxDaysAhead = 30, reschedule }: Props) {
  const theme = useTheme();
  const today = useMemo(() => istDay(), []);
  const days = useMemo(() => Array.from({ length: maxDaysAhead + 1 }, (_, i) => addDays(today, i)), [today, maxDaysAhead]);
  const availability = useAvailability({ serviceId, date: date || undefined, area, excludeBookingId: reschedule?.bookingId });
  const slots = availability.data?.slots.filter((s) => s.startAt !== reschedule?.currentStartAt) ?? [];

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <Text variant="titleSmall" style={{ fontWeight: '700' }}>Choose a day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
          {days.map((d) => {
            const p = dayParts(d);
            const on = d === date;
            return (
              <Pressable
                key={d}
                onPress={() => onChange(d, undefined)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={formatDay(d)}
                style={[styles.day, { backgroundColor: on ? theme.colors.primary : theme.colors.surface, borderColor: on ? theme.colors.primary : theme.colors.outlineVariant }]}
              >
                <Text variant="labelSmall" style={{ color: on ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>{d === today ? 'Today' : p.weekday}</Text>
                <Text variant="titleLarge" style={{ fontWeight: '800', color: on ? theme.colors.onPrimary : theme.colors.onSurface }}>{p.day}</Text>
                <Text variant="labelSmall" style={{ color: on ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>{p.month}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Times are India time (IST).</Text>
      </View>

      {!date ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Choose a day to see the free times.</Text>
      ) : availability.isPending ? (
        <ListSkeleton rows={2} />
      ) : availability.isError ? (
        <ErrorState error={availability.error} onRetry={() => availability.refetch()} />
      ) : slots.length === 0 ? (
        <EmptyState icon="calendar-remove-outline" title="No free times on this day" description="Try another day." />
      ) : (
        <View style={{ gap: 14 }}>
          {PARTS.map((part) => {
            const inPart = slots.filter((s) => part.test(istHour(s.startAt)));
            if (inPart.length === 0) return null;
            return (
              <View key={part.label} style={{ gap: 8 }}>
                <Text variant="titleSmall" style={{ fontWeight: '700' }}>{part.icon} {part.label}</Text>
                <View style={styles.times}>
                  {inPart.map((s) => {
                    const on = slot?.startAt === s.startAt;
                    return (
                      <Pressable
                        key={s.startAt}
                        onPress={() => onChange(date, s)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                        style={[styles.time, { backgroundColor: on ? theme.colors.primary : theme.colors.surface, borderColor: on ? theme.colors.primary : theme.colors.outline }]}
                      >
                        <Text style={{ fontWeight: '700', color: on ? theme.colors.onPrimary : theme.colors.onSurface }}>{formatTime(s.startAt)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  day: { width: 62, paddingVertical: 10, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 0 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  time: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, borderWidth: 1, minWidth: 92, alignItems: 'center' },
});
