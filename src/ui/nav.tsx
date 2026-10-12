import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, type ColorValue } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge, IconButton } from 'react-native-paper';
import { useAuth, type Role } from '@/lib/auth';
import { useUnreadCount } from '@/lib/queries/notifications';
import { alpha, useAppTheme } from './theme';

export const notificationsHref = (role: Role) => (role === 'CUSTOMER' ? '/notifications' : role === 'TECHNICIAN' ? '/tech/notifications' : '/staff/notifications');

// The bell in the top bar: how many are unread. Tapping opens the notifications screen.
export function BellButton() {
  const t = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const unread = useUnreadCount().data ?? 0;
  if (!user) return null;
  return (
    <View>
      <IconButton icon="bell-outline" iconColor={t.app.onBar} onPress={() => router.push(notificationsHref(user.role))} accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'} />
      {unread > 0 && <Badge style={{ position: 'absolute', top: 6, right: 6, backgroundColor: t.app.accent, color: t.app.onAccent }} size={16}>{unread > 99 ? '99+' : unread}</Badge>}
    </View>
  );
}

// Header look shared by every stack in the app: the palette's bar colour, like the website's sidebar.
export function useStackOptions() {
  const t = useAppTheme();
  return {
    headerStyle: { backgroundColor: t.app.bar },
    headerTintColor: t.app.onBar,
    headerTitleStyle: { fontWeight: '700' as const },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: t.colors.background },
  };
}

// Header + bottom bar look shared by every tab navigator. The active tab gets the palette's accent.
export function useTabOptions() {
  const t = useAppTheme();
  return {
    headerStyle: { backgroundColor: t.app.bar },
    headerTintColor: t.app.onBar,
    headerTitleStyle: { fontWeight: '800' as const, fontSize: 20 },
    headerShadowVisible: false,
    headerRight: () => <BellButton />,
    tabBarActiveTintColor: t.app.barDark ? t.app.accent : t.colors.primary,
    tabBarInactiveTintColor: alpha(t.app.onBar, 0.6),
    tabBarStyle: { backgroundColor: t.app.bar, borderTopWidth: 0, height: 64, paddingTop: 6, paddingBottom: 8 },
    tabBarLabelStyle: { fontWeight: '700' as const, fontSize: 11 },
    sceneStyle: { backgroundColor: t.colors.background },
  };
}

// Tab bar icon from the Material Community Icons set: <Tabs.Screen options={{ tabBarIcon: tabIcon("home") }} />
export const tabIcon = (name: keyof typeof MaterialCommunityIcons.glyphMap) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <MaterialCommunityIcons name={name} color={color as string} size={size} />;
  };
