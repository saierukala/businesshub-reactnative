import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Chip, Icon, Text } from 'react-native-paper';
import { useAuth } from '@/lib/auth';
import { formatINR } from '@/lib/format';
import { useManagerDashboard } from '@/lib/queries/dashboard';
import { alpha, statusMeta, useAppTheme } from '@/ui/theme';
import { BarList, MiniBars } from '@/ui/Charts';
import { Banner, Card, ErrorState, Hero, ListSkeleton, SectionTitle, StatCard } from '@/ui/Parts';
import { Screen } from '@/ui/Screen';
import { BookingCard } from '../booking/BookingsList';
import type { BookingStatus } from '@/lib/types';

const SOURCE_LABEL = { ONLINE: 'Online', PHONE: 'Phone', WHATSAPP: 'WhatsApp', WALK_IN: 'Walk-in' };
const shortDay = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' });

// Owner / Manager home: what needs attention today. Every number is counted by the API (SQL), not by the app.
export function ManagerDashboard() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();
  const q = useManagerDashboard();

  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      {q.isPending ? <ListSkeleton rows={4} /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (() => {
        const d = q.data;
        const today = Object.entries(d.todayByStatus) as [BookingStatus, number][];
        return (
          <>
            <Hero>
              <Text variant="labelLarge" style={{ color: theme.app.onGradient, opacity: 0.85 }}>Hi {user?.name.split(' ')[0]} · revenue today</Text>
              <Text variant="displaySmall" style={{ color: theme.app.onGradient, fontWeight: '800' }}>{formatINR(d.revenue.today)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon source="chart-line" size={18} color={theme.app.onGradient} />
                <Text variant="bodyMedium" style={{ color: theme.app.onGradient, opacity: 0.9 }}>This month {formatINR(d.revenue.thisMonth)}</Text>
              </View>
            </Hero>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard label="Bookings today" value={today.reduce((sum, [, n]) => sum + n, 0)} icon="calendar-today" tone={theme.app.info} />
              <StatCard label="Need a technician" value={d.pendingAssignments.total} icon="account-clock" tone={d.pendingAssignments.total > 0 ? theme.app.warning : theme.app.success} />
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
                    <Chip key={status} icon={statusMeta[status].icon} style={{ backgroundColor: alpha(statusMeta[status].color, 0.12) }} textStyle={{ color: statusMeta[status].color, fontWeight: '700' }}>
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
