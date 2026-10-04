import { View } from 'react-native';
import { Avatar, Button, Text, useTheme } from 'react-native-paper';
import { useAuth } from '@/lib/auth';
import { formatPhone } from '@/lib/format';
import { useResendVerification } from '@/lib/queries/auth';
import { Banner, Card } from '@/ui/Parts';
import { useToast } from '@/ui/toast';

const ROLE_LABEL = { OWNER: 'Owner', MANAGER: 'Manager', TECHNICIAN: 'Technician', CUSTOMER: 'Customer' };

// Who is logged in, the email-verification prompt, and log out. Shown on every role's account screen.
export function ProfileCard({ showLogout = true }: { showLogout?: boolean }) {
  const theme = useTheme();
  const toast = useToast();
  const { user } = useAuth();
  const resend = useResendVerification();
  if (!user) return null;
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 24 }}>
        <Avatar.Text size={72} label={initials} />
        <Text variant="titleLarge" style={{ fontWeight: '800' }}>{user.name}</Text>
        <Text variant="labelLarge" style={{ color: theme.colors.primary }}>{ROLE_LABEL[user.role]}</Text>
        {user.email && <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{user.email}</Text>}
        {user.phone && <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{formatPhone(user.phone)}</Text>}
      </Card>
      {user.email && !user.emailVerified && (
        <Banner tone="warn" icon="email-alert-outline" title="Verify your email">
          <View style={{ gap: 8 }}>
            <Text variant="bodyMedium">We sent a link to {user.email}. Open it to confirm your address so booking updates reach you.</Text>
            <Button mode="outlined" compact loading={resend.isPending} onPress={() => resend.mutate(undefined, { onSuccess: (r) => toast.success(r.message), onError: (e) => toast.error(e.message) })}>
              Resend email
            </Button>
          </View>
        </Banner>
      )}
      {showLogout && <LogoutButton />}
    </View>
  );
}

// Separate so a long account screen can put it last, away from the other buttons.
export function LogoutButton() {
  const theme = useTheme();
  const { logout } = useAuth();
  return (
    <Button mode="outlined" icon="logout" textColor={theme.colors.error} onPress={() => void logout()} contentStyle={{ height: 48 }} style={{ borderRadius: 14 }}>
      Log out
    </Button>
  );
}
