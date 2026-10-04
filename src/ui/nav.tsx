import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, type ColorValue } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge, IconButton, useTheme } from 'react-native-paper';
import { useAuth, type Role } from '@/lib/auth';
import { useUnreadCount } from '@/lib/queries/notifications';

export const notificationsHref = (role: Role) => (role === 'CUSTOMER' ? '/notifications' : role === 'TECHNICIAN' ? '/tech/notifications' : '/staff/notifications');

// The bell in the top bar: how many are unread. Tapping opens the notifications screen.
export function BellButton() {
  const router = useRouter();
  const { user } = useAuth();
  const unread = useUnreadCount().data ?? 0;
  if (!user) return null;
  return (
    <View>
      <IconButton icon="bell-outline" onPress={() => router.push(notificationsHref(user.role))} accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'} />
      {unread > 0 && <Badge style={{ position: 'absolute', top: 6, right: 6 }} size={16}>{unread > 99 ? '99+' : unread}</Badge>}
    </View>
  );
}

// Header look shared by every stack in the app.
export function useStackOptions() {
  const t = useTheme();
  return {
    headerStyle: { backgroundColor: t.colors.surface },
    headerTintColor: t.colors.onSurface,
    headerTitleStyle: { fontWeight: '700' as const },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: t.colors.background },
  };
}

// Header + bottom bar look shared by every tab navigator.
export function useTabOptions() {
  const t = useTheme();
  return {
    headerStyle: { backgroundColor: t.colors.surface },
    headerTintColor: t.colors.onSurface,
    headerTitleStyle: { fontWeight: '800' as const },
    headerShadowVisible: false,
    headerRight: () => <BellButton />,
    tabBarActiveTintColor: t.colors.primary,
    tabBarInactiveTintColor: t.colors.onSurfaceVariant,
    tabBarStyle: { backgroundColor: t.colors.surface, borderTopColor: t.colors.outlineVariant },
    tabBarLabelStyle: { fontWeight: '600' as const, fontSize: 11 },
    sceneStyle: { backgroundColor: t.colors.background },
  };
}

// Tab bar icon from the Material Community Icons set: <Tabs.Screen options={{ tabBarIcon: tabIcon("home") }} />
export const tabIcon = (name: keyof typeof MaterialCommunityIcons.glyphMap) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <MaterialCommunityIcons name={name} color={color as string} size={size} />;
  };
