import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Icon, Text, useTheme } from 'react-native-paper';
import { useAuth, type Role } from '@/lib/auth';
import { formatDate, formatTime } from '@/lib/format';
import { useInfiniteList } from '@/lib/infinite';
import { useMarkAllRead, useMarkRead, useUnreadCount, type AppNotification } from '@/lib/queries/notifications';
import { Card, InfiniteList } from '@/ui/Parts';

// Where a notification leads, for this person's area of the app.
function target(role: Role, n: AppNotification): string | null {
  if (n.type === 'NEEDS_REASSIGNMENT') return '/staff/reassignments';
  if (!n.bookingId) return null;
  if (role === 'CUSTOMER') return `/bookings/${n.bookingId}`;
  if (role === 'TECHNICIAN') return `/tech/jobs/${n.bookingId}`;
  return `/staff/bookings/${n.bookingId}`;
}

// The same messages that are emailed, inside the app. Tap one to open the booking.
export function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const unread = useUnreadCount().data ?? 0;
  const list = useInfiniteList<AppNotification>('notifications', '/notifications');
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  return (
    <InfiniteList
      query={list}
      emptyIcon="bell-sleep-outline"
      emptyTitle="Nothing yet"
      emptyDescription="Updates about your bookings appear here."
      header={unread > 0 ? <Button mode="contained-tonal" icon="check-all" onPress={() => markAll.mutate()} loading={markAll.isPending}>Mark all read ({unread})</Button> : undefined}
      renderItem={(n) => (
        <Card
          style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: n.read ? theme.colors.surface : theme.colors.primaryContainer }}
          onPress={() => {
            if (!n.read) markRead.mutate(n.id);
            const to = user && target(user.role, n);
            if (to) router.push(to);
          }}
        >
          <Icon source={n.type === 'CALL_CUSTOMER' ? 'phone-alert' : 'bell-ring-outline'} size={22} color={n.read ? theme.colors.onSurfaceVariant : theme.colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyMedium" style={{ fontWeight: n.read ? '400' : '700' }}>{n.message}</Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{formatDate(n.createdAt)}, {formatTime(n.createdAt)}</Text>
          </View>
        </Card>
      )}
    />
  );
}
