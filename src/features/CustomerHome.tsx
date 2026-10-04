import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Icon, Text, useTheme } from 'react-native-paper';
import { useAuth } from '@/lib/auth';
import { formatDate, formatINR } from '@/lib/format';
import { useCustomerDashboard } from '@/lib/queries/dashboard';
import { Card, ErrorState, ListSkeleton, SectionTitle, Stars } from '@/ui/Parts';
import { Screen } from '@/ui/Screen';
import { BookingCard } from './booking/BookingsList';

export function CustomerHome() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const q = useCustomerDashboard();
  const first = user?.name.split(' ')[0];

  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <View style={{ backgroundColor: theme.colors.primary, borderRadius: 24, padding: 20, gap: 12 }}>
        <Text variant="headlineSmall" style={{ color: theme.colors.onPrimary, fontWeight: '800' }}>Hi {first} 👋</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onPrimary, opacity: 0.9 }}>Something not working? A verified technician can be at your door soon.</Text>
        <Button mode="contained" buttonColor="#ffffff" textColor={theme.colors.primary} icon="calendar-plus" onPress={() => router.push('/book')} contentStyle={{ height: 48 }} style={{ borderRadius: 14 }}>
          Book a repair
        </Button>
      </View>

      {q.isPending ? <ListSkeleton rows={3} /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
        <>
          <View style={{ gap: 8 }}>
            <SectionTitle>Upcoming visit</SectionTitle>
            {q.data.upcomingBooking ? (
              <BookingCard booking={q.data.upcomingBooking} onPress={() => router.push(`/bookings/${q.data.upcomingBooking!.id}`)} />
            ) : (
              <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 20 }}>
                <Icon source="calendar-blank-outline" size={32} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>No upcoming visit.</Text>
              </Card>
            )}
          </View>

          <View style={{ gap: 8 }}>
            <SectionTitle action={<Button compact onPress={() => router.push('/account')}>Manage</Button>}>My appliances</SectionTitle>
            {q.data.appliances.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>No appliances saved yet. Add one when you book.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {q.data.appliances.map((a) => (
                  <Card key={a.id} style={{ width: 150, gap: 4 }}>
                    <Icon source="washing-machine" size={26} color={theme.colors.primary} />
                    <Text variant="titleSmall" style={{ fontWeight: '700' }} numberOfLines={1}>{a.brand}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>{a.category.name}</Text>
                  </Card>
                ))}
              </ScrollView>
            )}
          </View>

          {q.data.recentHistory.length > 0 && (
            <View style={{ gap: 8 }}>
              <SectionTitle action={<Button compact onPress={() => router.push('/bookings')}>See all</Button>}>Recent bookings</SectionTitle>
              {q.data.recentHistory.map((b) => <BookingCard key={b.id} booking={b} onPress={() => router.push(`/bookings/${b.id}`)} />)}
            </View>
          )}

          {q.data.recentPayments.length > 0 && (
            <View style={{ gap: 8 }}>
              <SectionTitle>Recent payments</SectionTitle>
              {q.data.recentPayments.map((p) => (
                <Card key={p.id} onPress={() => router.push(`/bookings/${p.booking.id}/receipt`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Icon source="receipt-text-outline" size={24} color={theme.colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall" style={{ fontWeight: '700' }}>{formatINR(p.amount)} · {p.method}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{p.booking.bookingNumber}{p.paidAt ? ` · ${formatDate(p.paidAt)}` : ''}</Text>
                  </View>
                  <Icon source="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
                </Card>
              ))}
            </View>
          )}

          {q.data.recentReviews.length > 0 && (
            <View style={{ gap: 8 }}>
              <SectionTitle>Your reviews</SectionTitle>
              {q.data.recentReviews.map((r) => (
                <Card key={r.id} style={{ gap: 4 }}>
                  <Stars rating={r.rating} />
                  {r.comment && <Text variant="bodyMedium">{r.comment}</Text>}
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{r.booking.bookingNumber} · {formatDate(r.createdAt)}</Text>
                </Card>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
