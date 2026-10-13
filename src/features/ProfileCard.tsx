import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ActivityIndicator, Avatar, Button, Dialog, Icon, List, Portal, Text, useTheme } from 'react-native-paper';
import { useAppTheme } from '@/ui/theme';
import { api } from '@/lib/api';
import { useAuth, type User } from '@/lib/auth';
import { showApiError } from '@/lib/form';
import { formatDate, formatPhone } from '@/lib/format';
import { pickPhoto } from '@/lib/photo';
import { useResendVerification } from '@/lib/queries/auth';
import { useProfile, useRemoveAvatar, useSetAvatar, useUpdateProfile } from '@/lib/queries/profile';
import { profileSchema, type ProfileInput } from '@/lib/schemas/profile';
import { FormAlert, SubmitButton, TextField } from '@/ui/Form';
import { FormModal } from '@/ui/FormModal';
import { Banner, Card } from '@/ui/Parts';
import { OtpInput } from '@/ui/OtpInput';
import { useToast } from '@/ui/toast';

const ROLE_LABEL = { OWNER: 'Owner', MANAGER: 'Manager', TECHNICIAN: 'Technician', CUSTOMER: 'Customer' };

// Who is logged in (photo, name, phone, email), editing your own profile, the email-verification prompt, and log out.
// Shown on every role's account screen.
export function ProfileCard({ showLogout = true }: { showLogout?: boolean }) {
  const theme = useTheme();
  const toast = useToast();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const resend = useResendVerification();
  const [editing, setEditing] = useState(false);
  // Created here, not in ProfileForm: the modal renders in a Portal outside AuthProvider, where useAuth() is null.
  const update = useUpdateProfile();
  if (!user) return null;

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 24 }}>
        <ProfilePhoto name={user.name} avatar={profile?.avatar ?? null} />
        <Text variant="titleLarge" style={{ fontWeight: '800' }}>{user.name}</Text>
        <Text variant="labelLarge" style={{ color: theme.colors.primary }}>{ROLE_LABEL[user.role]}</Text>
        {user.email && <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{user.email}</Text>}
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{user.phone ? formatPhone(user.phone) : 'No mobile number yet'}</Text>
        {profile && <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Member since {formatDate(profile.memberSince)}</Text>}
        <Button mode="contained-tonal" icon="account-edit-outline" onPress={() => setEditing(true)} style={{ marginTop: 8 }}>
          Edit profile
        </Button>
      </Card>
      <FormModal visible={editing} onClose={() => setEditing(false)} title="Edit profile" subtitle="Your name and mobile number. Email can't be changed here.">
        <ProfileForm user={user} update={update} onSaved={() => { setEditing(false); toast.success('Profile saved'); }} />
      </FormModal>
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

const initialsOf = (name: string) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

// Tap the photo to choose a new one (gallery or camera) or remove it. Initials until a photo is uploaded.
function ProfilePhoto({ name, avatar }: { name: string; avatar: string | null }) {
  const theme = useAppTheme();
  const toast = useToast();
  const setAvatar = useSetAvatar();
  const removeAvatar = useRemoveAvatar();
  const [menu, setMenu] = useState(false);
  const busy = setAvatar.isPending || removeAvatar.isPending;

  async function choose(source: 'library' | 'camera') {
    setMenu(false);
    try {
      const image = await pickPhoto(source);
      if (!image) return; // cancelled
      await setAvatar.mutateAsync(image);
      toast.success('Photo updated');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function remove() {
    setMenu(false);
    removeAvatar.mutate(undefined, { onSuccess: () => toast.success('Photo removed'), onError: (e) => toast.error(e.message) });
  }

  return (
    <>
      <Pressable onPress={() => setMenu(true)} disabled={busy} accessibilityRole="button" accessibilityLabel={avatar ? 'Change profile photo' : 'Add profile photo'}>
        {avatar ? <Avatar.Image size={88} source={{ uri: avatar }} /> : <Avatar.Text size={88} label={initialsOf(name)} />}
        <View style={{ position: 'absolute', right: -2, bottom: -2, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, borderWidth: 3, borderColor: theme.colors.surface }}>
          {busy ? <ActivityIndicator size={14} color={theme.colors.onPrimary} /> : <Icon source="camera" size={16} color={theme.colors.onPrimary} />}
        </View>
      </Pressable>
      <Portal>
        <Dialog visible={menu} onDismiss={() => setMenu(false)}>
          <Dialog.Title>Profile photo</Dialog.Title>
          <Dialog.Content style={{ paddingHorizontal: 8 }}>
            <List.Item title="Choose from gallery" left={(p) => <List.Icon {...p} icon="image-outline" />} onPress={() => void choose('library')} />
            {Platform.OS !== 'web' && <List.Item title="Take a photo" left={(p) => <List.Icon {...p} icon="camera-outline" />} onPress={() => void choose('camera')} />}
            {avatar && <List.Item title="Remove photo" titleStyle={{ color: theme.colors.error }} left={(p) => <List.Icon {...p} icon="delete-outline" color={theme.colors.error} />} onPress={remove} />}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMenu(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

// Name and mobile number. Email and role are not editable (a new email would need verifying again).
function ProfileForm({ user, update, onSaved }: { user: User; update: ReturnType<typeof useUpdateProfile>; onSaved: () => void }) {
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: { name: user.name, phone: user.phone ?? '' }, mode: 'onTouched' });
  const submit = (values: ProfileInput) => update.mutate(values, { onSuccess: onSaved, onError: (e) => showApiError(form, e) });

  return (
    <View style={{ gap: 12 }}>
      <FormAlert message={form.formState.errors.root?.server?.message} />
      <TextField control={form.control} name="name" label="Full name" autoComplete="name" left="account-outline" />
      <TextField control={form.control} name="phone" label="Mobile number" keyboardType="phone-pad" maxLength={10} left="phone-outline" hint="10 digits. Leave empty to remove it." />
      <SubmitButton onPress={form.handleSubmit(submit)} pending={update.isPending}>Save changes</SubmitButton>
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
