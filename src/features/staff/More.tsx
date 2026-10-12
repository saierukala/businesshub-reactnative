import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge, Icon, Text, useTheme } from 'react-native-paper';
import { useAuth } from '@/lib/auth';
import { useReassignmentCount } from '@/lib/queries/bookings';
import { Card, SectionTitle } from '@/ui/Parts';
import { Screen } from '@/ui/Screen';
import { ProfileCard } from '../ProfileCard';

type Item = { label: string; hint: string; icon: string; href: string; ownerOnly?: boolean; badge?: boolean };

// Everything that does not fit in the bottom bar. (Hiding items is UX only: the API checks the role on every request.)
const ITEMS: Item[] = [
  { label: 'Needs reassignment', hint: 'Bookings that lost their technician', icon: 'account-alert-outline', href: '/staff/reassignments', badge: true },
  { label: 'Technicians', hint: 'Skills, areas, hours and time off', icon: 'account-wrench-outline', href: '/staff/technicians' },
  { label: 'Reports', hint: 'Bookings, revenue, services, technicians', icon: 'chart-box-outline', href: '/staff/reports' },
  { label: 'Reviews', hint: 'What customers said', icon: 'star-outline', href: '/staff/reviews' },
  { label: 'Notifications', hint: 'Updates from the system', icon: 'bell-outline', href: '/staff/notifications' },
  { label: 'Services', hint: 'Prices and durations', icon: 'tools', href: '/staff/services', ownerOnly: true },
  { label: 'Users', hint: 'Managers, technicians and customers', icon: 'account-group-outline', href: '/staff/users', ownerOnly: true },
  { label: 'Audit log', hint: 'Who changed what', icon: 'clipboard-text-clock-outline', href: '/staff/audit', ownerOnly: true },
  { label: 'Roles & permissions', hint: 'What each role can do', icon: 'shield-account-outline', href: '/staff/roles', ownerOnly: true },
  { label: 'Settings', hint: 'Light or dark mode', icon: 'cog-outline', href: '/staff/settings' },
];

export function StaffMore() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const waiting = useReassignmentCount();
  const items = ITEMS.filter((i) => !i.ownerOnly || user?.role === 'OWNER');

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <SectionTitle>Manage</SectionTitle>
        {items.map((i) => (
          <Card key={i.href} onPress={() => router.push(i.href)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
              <Icon source={i.icon} size={22} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={{ fontWeight: '700' }}>{i.label}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{i.hint}</Text>
            </View>
            {i.badge && waiting > 0 && <Badge size={22}>{waiting}</Badge>}
            <Icon source="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
          </Card>
        ))}
      </View>
      <ProfileCard />
    </Screen>
  );
}
