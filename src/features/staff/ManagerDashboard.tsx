import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Chip, Text, useTheme } from 'react-native-paper';
import { formatINR } from '@/lib/format';
import { useManagerDashboard } from '@/lib/queries/dashboard';
import { statusMeta } from '@/ui/theme';
import { BarList, MiniBars } from '@/ui/Charts';
import { Banner, Card, ErrorState, ListSkeleton, SectionTitle, StatCard } from '@/ui/Parts';
import { Screen } from '@/ui/Screen';
import { BookingCard } from '../booking/BookingsList';
import type { BookingStatus } from '@/lib/types';

const SOURCE_LABEL = { ONLINE: 'Online', PHONE: 'Phone', WHATSAPP: 'WhatsApp', WALK_IN: 'Walk-in' };
const shortDay = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' });

// Owner / Manager home: what needs attention today. Every number is counted by the API (SQL), not by the app.
export function ManagerDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const q = useManagerDashboard();

  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      {q.isPending ? <ListSkeleton rows={4} /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (() => {
        const d = q.data;
        const today = Object.entries(d.todayByStatus) as [BookingStatus, number][];
        return (
          <>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard label="Revenue today" value={formatINR(d.revenue.today)} icon="cash" tone="#16a34a" />
              <StatCard label="This month" value={formatINR(d.revenue.thisMonth)} icon="chart-line" />
            </View>

            {d.needsReassignment.total > 0 && (
              <Banner tone="error" icon="account-alert" title={`${d.needsReassignment.total} booking${d.needsReassignment.total === 1 ? '' : 's'} need a new technician`}>
                <Button mode="contained" compact onPress={() => router.push('/staff/reassignments')} style={{ alignSelf: 'flex-start', marginTop: 6 }}>Review now</Button>
              </Banner>
            )}

            <View style={{ gap: 8 }}>
              <SectionTitle>Today's bookings</SectionTitle>
              {today.length === 0 ? (
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>No bookings today.</Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {today.map(([status, n]) => (
                    <Chip key={status} icon={statusMeta[status].icon} style={{ backgroundColor: statusMeta[status].color + '1f' }} textStyle={{ color: statusMeta[status].color, fontWeight: '700' }}>
                      {statusMeta[status].label}: {n}
                    </Chip>
                  ))}
                </View>
              )}
            </View>

            {d.pendingAssignments.total > 0 && (
              <View style={{ gap: 8 }}>
                <SectionTitle action={<Button compact onPress={() => router.push('/staff/bookings')}>All bookings</Button>}>Waiting for a technician ({d.pendingAssignments.total})</SectionTitle>
                {d.pendingAssignments.items.slice(0, 5).map((b) => <BookingCard key={b.id} booking={b} staff onPress={() => router.push(`/staff/bookings/${b.id}`)} />)}
              </View>
            )}

            <View style={{ gap: 8 }}>
              <SectionTitle>Free technicians now</SectionTitle>
              {d.availableTechnicians.length === 0 ? (
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Nobody is free right now.</Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {d.availableTechnicians.map((t) => <Chip key={t.id} icon="account-check" onPress={() => router.push(`/staff/technicians/${t.id}`)}>{t.name}</Chip>)}
                </View>
              )}
            </View>

            {d.bookingTrend.length > 0 && (
              <View style={{ gap: 8 }}>
                <SectionTitle>Bookings, last 7 days</SectionTitle>
                <Card><MiniBars points={d.bookingTrend.slice(-7).map((p) => ({ label: shortDay(p.date), value: p.count }))} /></Card>
              </View>
            )}

            {d.popularServices.length > 0 && (
              <View style={{ gap: 8 }}>
                <SectionTitle>Popular services</SectionTitle>
                <Card><BarList rows={d.popularServices.map((s) => ({ label: s.name, value: s.bookings }))} /></Card>
              </View>
            )}

            {d.technicianWorkload.length > 0 && (
              <View style={{ gap: 8 }}>
                <SectionTitle>Technician workload</SectionTitle>
                <Card style={{ gap: 12 }}>
                  {d.technicianWorkload.map((t) => (
                    <View key={t.technicianId} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{t.name}</Text>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Today {t.today} · Next 7 days {t.next7Days}</Text>
                    </View>
                  ))}
                </Card>
              </View>
            )}

            {Object.keys(d.bookingsBySource).length > 0 && (
              <View style={{ gap: 8 }}>
                <SectionTitle>Where bookings come from</SectionTitle>
                <Card>
                  <BarList color={theme.colors.secondary} rows={(Object.entries(d.bookingsBySource) as [keyof typeof SOURCE_LABEL, number][]).map(([k, v]) => ({ label: SOURCE_LABEL[k] ?? k, value: v }))} />
                </Card>
              </View>
            )}
          </>
        );
      })()}
    </Screen>
  );
}
