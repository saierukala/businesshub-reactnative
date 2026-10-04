import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, FAB, Switch, Text, useTheme } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { showApiError } from '@/lib/form';
import { formatPhone } from '@/lib/format';
import { useInfiniteList } from '@/lib/infinite';
import { useCreateUser, useResendInvite, useSetUserActive } from '@/lib/queries/users';
import { newUserSchema, type NewUserInput, type NewUserOutput } from '@/lib/schemas/user';
import type { StaffUser } from '@/lib/types';
import { FormAlert, PillGroup, SubmitButton, TextField } from '@/ui/Form';
import { FormModal } from '@/ui/FormModal';
import { Banner, Card, InfiniteList } from '@/ui/Parts';
import { useToast } from '@/ui/toast';

const ROLES = [{ value: 'MANAGER', label: 'Manager' }, { value: 'TECHNICIAN', label: 'Technician' }];
const FILTERS = [{ value: '', label: 'All' }, { value: 'OWNER', label: 'Owner' }, ...ROLES, { value: 'CUSTOMER', label: 'Customers' }];

function NewUserForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const create = useCreateUser();
  const form = useForm<NewUserInput, unknown, NewUserOutput>({ resolver: zodResolver(newUserSchema), defaultValues: { name: '', email: '', phone: '', role: 'TECHNICIAN' }, mode: 'onTouched' });
  const submit = form.handleSubmit((v) =>
    create.mutateAsync(v).then(
      () => { toast.success('User created. An invite email was sent.'); onDone(); },
      (err) => showApiError(form, err),
    ),
  );
  return (
    <>
      <Banner tone="info">They get an email with a link to set their own password. Nobody ever sees it.</Banner>
      <FormAlert message={form.formState.errors.root?.server?.message} />
      <Controller control={form.control} name="role" render={({ field }) => <PillGroup options={ROLES} value={field.value} onChange={field.onChange} />} />
      <TextField control={form.control} name="name" label="Full name" left="account-outline" />
      <TextField control={form.control} name="email" label="Email" keyboardType="email-address" autoCapitalize="none" left="email-outline" />
      <TextField control={form.control} name="phone" label="Mobile number" keyboardType="phone-pad" maxLength={10} left="phone-outline" />
      <SubmitButton onPress={submit} pending={create.isPending}>Create and send invite</SubmitButton>
    </>
  );
}

// Owner only: staff and customer accounts. Deactivating a user blocks them immediately.
export function UsersList() {
  const theme = useTheme();
  const toast = useToast();
  const [role, setRole] = useState('');
  const [creating, setCreating] = useState(false);
  const setActive = useSetUserActive();
  const resend = useResendInvite();
  const list = useInfiniteList<StaffUser>('users', '/users', { role: role || undefined });

  return (
    <View style={{ flex: 1 }}>
      <InfiniteList
        query={list}
        emptyIcon="account-group-outline"
        emptyTitle="No users here"
        emptyDescription="Try another filter."
        header={<ScrollView horizontal showsHorizontalScrollIndicator={false}><PillGroup options={FILTERS} value={role} onChange={setRole} /></ScrollView>}
        renderItem={(u) => (
          <Card style={{ gap: 4, opacity: u.active ? 1 : 0.6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '700' }}>{u.role}</Text>
              {u.role !== 'OWNER' && <Switch value={u.active} onValueChange={(active) => setActive.mutate({ id: u.id, active }, { onError: (e) => toast.error(e.message) })} />}
            </View>
            <Text variant="titleMedium" style={{ fontWeight: '700' }}>{u.name}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{[u.email, u.phone && formatPhone(u.phone)].filter(Boolean).join(' · ')}</Text>
            {!u.active && <Text variant="labelMedium" style={{ color: theme.colors.error }}>Deactivated: cannot log in</Text>}
            {!u.hasAccount && u.email && u.role !== 'CUSTOMER' && (
              <Button mode="outlined" compact icon="email-fast-outline" style={{ alignSelf: 'flex-start', marginTop: 6 }} loading={resend.isPending} onPress={() => resend.mutate(u.id, { onSuccess: (r) => toast.success(r.message), onError: (e) => toast.error(e.message) })}>
                Resend invite
              </Button>
            )}
          </Card>
        )}
      />
      <FAB icon="account-plus" label="New user" onPress={() => setCreating(true)} style={{ position: 'absolute', right: 16, bottom: 16 }} />
      <FormModal visible={creating} onClose={() => setCreating(false)} title="New user"><NewUserForm onDone={() => setCreating(false)} /></FormModal>
    </View>
  );
}
