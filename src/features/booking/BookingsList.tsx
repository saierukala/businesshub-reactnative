import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon, Text, useTheme } from 'react-native-paper';
import { formatINR, formatTime, formatWeekdayDate } from '@/lib/format';
import { useInfiniteList } from '@/lib/infinite';
import type { Booking, BookingStatus } from '@/lib/types';
import { statusMeta } from '@/ui/theme';
import { PillGroup } from '@/ui/Form';
import { Card, InfiniteList, StatusChip } from '@/ui/Parts';

// Same filter as the web app: one status, or all.
const FILTERS = [{ value: '', label: 'All' }, ...(Object.keys(statusMeta) as BookingStatus[]).map((s) => ({ value: s, label: statusMeta[s].label }))];

export function BookingCard({ booking: b, staff, onPress }: { booking: Booking; staff?: boolean; onPress: () => void }) {
  const theme = useTheme();
  const muted = { color: theme.colors.onSurfaceVariant };
  return (
    <Card onPress={onPress} style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="labelMedium" style={muted}>{b.bookingNumber}</Text>
        <StatusChip status={b.status} small />
      </View>
      <Text variant="titleMedium" style={{ fontWeight: '700' }}>{b.service.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon source="calendar-clock" size={16} color={theme.colors.primary} />
        <Text variant="bodyMedium">{formatWeekdayDate(b.startAt)}, {formatTime(b.startAt)}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon source={staff ? 'account-outline' : 'wrench-outline'} size={16} color={theme.colors.onSurfaceVariant} />
        <Text variant="bodySmall" style={muted} numberOfLines={1}>
          {staff ? `${b.customer.name} · ${b.address.area}` : b.technician ? `${b.technician.name} · ${b.appliance.brand} ${b.appliance.category.name}` : `${b.appliance.brand} ${b.appliance.category.name} · technician not assigned yet`}
        </Text>
      </View>
      {b.needsReassignment && <Text variant="labelMedium" style={{ color: theme.colors.error, fontWeight: '700' }}>Needs a new technician</Text>}
      <Text variant="labelLarge" style={{ alignSelf: 'flex-end', fontWeight: '700' }}>{formatINR(b.service.basePrice)}</Text>
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
