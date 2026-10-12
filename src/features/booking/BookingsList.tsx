import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon, Text, useTheme } from 'react-native-paper';
import { formatINR, formatTime, formatWeekdayDate } from '@/lib/format';
import { useInfiniteList } from '@/lib/infinite';
import type { Booking, BookingStatus } from '@/lib/types';
import { alpha, statusMeta } from '@/ui/theme';
import { categoryIcon } from '@/ui/icons';
import { PillGroup } from '@/ui/Form';
import { Card, InfiniteList, StatusChip } from '@/ui/Parts';

// Same filter as the web app: one status, or all.
const FILTERS = [{ value: '', label: 'All' }, ...(Object.keys(statusMeta) as BookingStatus[]).map((s) => ({ value: s, label: statusMeta[s].label }))];

// The list only knows the service's visit charge (the final total, with any extra charge, is on the booking itself),
// so it is labelled as the visit charge.
export function BookingCard({ booking: b, staff, onPress }: { booking: Booking; staff?: boolean; onPress: () => void }) {
  const theme = useTheme();
  const muted = { color: theme.colors.onSurfaceVariant };
  const tint = statusMeta[b.status].color;
  return (
    <Card onPress={onPress} style={{ gap: 10, borderLeftWidth: 4, borderLeftColor: tint }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: alpha(tint, 0.14), alignItems: 'center', justifyContent: 'center' }}>
          <Icon source={categoryIcon(b.appliance.category.name)} size={24} color={tint} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="titleMedium" style={{ fontWeight: '800' }} numberOfLines={1}>{b.service.name}</Text>
          <Text variant="labelMedium" style={muted}>{b.bookingNumber}</Text>
        </View>
        <StatusChip status={b.status} small />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon source="calendar-clock" size={16} color={theme.colors.primary} />
        <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{formatWeekdayDate(b.startAt)}, {formatTime(b.startAt)}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon source={staff ? 'account-outline' : 'wrench-outline'} size={16} color={theme.colors.onSurfaceVariant} />
        <Text variant="bodySmall" style={[muted, { flex: 1 }]} numberOfLines={1}>
          {staff ? `${b.customer.name} · ${b.address.area}` : b.technician ? `${b.technician.name} · ${b.appliance.brand} ${b.appliance.category.name}` : `${b.appliance.brand} ${b.appliance.category.name} · technician not assigned yet`}
        </Text>
      </View>
      {b.needsReassignment && <Text variant="labelMedium" style={{ color: theme.colors.error, fontWeight: '700' }}>Needs a new technician</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant, paddingTop: 10 }}>
        <Text variant="bodySmall" style={muted}>Visit charge <Text variant="labelLarge" style={{ fontWeight: '800', color: theme.colors.onSurface }}>{formatINR(b.service.basePrice)}</Text></Text>
        <Icon source="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
      </View>
    </Card>
  );
}

// Bookings for a customer (their own), for staff (everyone), the reassignment queue, or one customer's history.
export function BookingsList({ staff = false, queue = false, customerId, hideFilters = false }: { staff?: boolean; queue?: boolean; customerId?: string; hideFilters?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const query = useInfiniteList<Booking>('bookings', '/bookings', {
    status: queue ? undefined : status || undefined,
    needsReassignment: queue || undefined,
    sort: queue ? 'soonest' : 'newest',
    customerId,
  });
  const base = staff ? '/staff/bookings' : '/bookings';

  return (
    <InfiniteList
      query={query}
      emptyIcon={queue ? 'check-all' : 'calendar-blank-outline'}
      emptyTitle={queue ? 'Nothing needs reassignment' : 'No bookings here yet'}
      emptyDescription={queue ? 'Every booking has a technician.' : status ? 'Try another filter.' : staff ? 'New bookings appear here.' : 'Book a repair and it will show up here.'}
      header={
        queue || hideFilters ? undefined : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            <PillGroup options={FILTERS} value={status} onChange={setStatus} />
          </ScrollView>
        )
      }
      renderItem={(b) => <BookingCard booking={b} staff={staff} onPress={() => router.push(`${base}/${b.id}`)} />}
    />
  );
}
