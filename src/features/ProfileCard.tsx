import { useState } from 'react';
import { View } from 'react-native';
import { Avatar, Button, Text, useTheme } from 'react-native-paper';
import { useAppTheme } from '@/ui/theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatPhone } from '@/lib/format';
import { useResendVerification } from '@/lib/queries/auth';
import { Banner, Card } from '@/ui/Parts';
import { OtpInput } from '@/ui/OtpInput';
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
            <Text variant="bodyMedium">We sent an email to {user.email}. Enter the 6-digit code from it (or from our office) so booking updates reach you.</Text>
            <VerifyWithCode />
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

// Type the 6-digit code from the verification email. On success the account is reloaded and the banner goes away.
function VerifyWithCode() {
  const theme = useAppTheme();
  const toast = useToast();
  const { refresh } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Runs by itself as soon as the 6th digit is typed (or pasted); the button is there for a retry.
  async function verify(value = code) {
    if (!/^\d{6}$/.test(value)) return setError('Enter the 6-digit code');
    setBusy(true);
    setError('');
    try {
      await api('/auth/verify-email-code', { method: 'POST', body: { code: value } });
      await refresh();
      toast.success('Email verified. Booking updates will reach you.');
    } catch (e) {
      setError((e as Error).message);
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 10 }}>
      <OtpInput value={code} onChange={(c) => { setCode(c); setError(''); }} error={Boolean(error)} onComplete={(c) => void verify(c)} />
      {error ? <Text variant="bodySmall" style={{ color: theme.colors.error, textAlign: 'center' }}>{error}</Text> : null}
      <Button mode="contained" onPress={() => void verify()} loading={busy} disabled={busy}>Verify</Button>
    </View>
  );
}
