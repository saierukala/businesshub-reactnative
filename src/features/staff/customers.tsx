import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, FAB, Searchbar, Text, useTheme } from 'react-native-paper';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@/lib/api';
import { useDebounced } from '@/lib/debounce';
import { showApiError } from '@/lib/form';
import { formatDate, formatPhone } from '@/lib/format';
import { useInfiniteList } from '@/lib/infinite';
import { useBookings } from '@/lib/queries/bookings';
import { useCustomer, useInviteCustomer, useSaveCustomer } from '@/lib/queries/customers';
import { customerSchema, type CustomerInput, type CustomerOutput } from '@/lib/schemas/customer';
import type { Customer, PhoneMatch } from '@/lib/types';
import { FormAlert, SubmitButton, TextField } from '@/ui/Form';
import { FormModal } from '@/ui/FormModal';
import { Banner, Card, ErrorState, InfiniteList, InfoRows, ListSkeleton, SectionTitle } from '@/ui/Parts';
import { Screen } from '@/ui/Screen';
import { useToast } from '@/ui/toast';
import { BookingCard } from '../booking/BookingsList';
import { BookingWizard } from '../booking/BookingWizard';
import { AddressSection, ApplianceSection } from '../records';

// Create or edit a customer. On a duplicate phone the API answers 409 with the matching customers: we show them, and
// staff either open the existing one or confirm "save anyway".
export function CustomerForm({ customer, onSaved }: { customer?: Customer; onSaved: (c: Customer) => void }) {
  const theme = useTheme();
  const toast = useToast();
  const router = useRouter();
  const save = useSaveCustomer();
  const [duplicate, setDuplicate] = useState<{ phone: string; matches: PhoneMatch[] } | null>(null);
  const form = useForm<CustomerInput, unknown, CustomerOutput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: customer?.name ?? '', phone: customer?.phone ?? '', email: customer?.email ?? '' },
    mode: 'onTouched',
  });
  // The warning is about one specific number: once the phone field changes it disappears, so "Save anyway"
  // can't confirm a number staff never saw the warning for.
  const phone = useWatch({ control: form.control, name: 'phone' });
  const matches = duplicate?.phone === phone ? duplicate.matches : null;

  async function submit(values: CustomerOutput, allowDuplicatePhone = false) {
    try {
      const saved = await save.mutateAsync({ ...values, id: customer?.id, allowDuplicatePhone });
      toast.success(customer ? 'Customer updated' : 'Customer created');
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'DUPLICATE_PHONE') setDuplicate({ phone: values.phone, matches: err.details as PhoneMatch[] });
      else showApiError(form, err);
    }
  }

  return (
    <>
      <FormAlert message={form.formState.errors.root?.server?.message} />
      <TextField control={form.control} name="name" label="Full name" left="account-outline" />
      <TextField control={form.control} name="phone" label="Mobile number" keyboardType="phone-pad" maxLength={10} left="phone-outline" />
      <TextField control={form.control} name="email" label="Email (optional)" keyboardType="email-address" autoCapitalize="none" left="email-outline" hint="Needed only if they want to see bookings online." />
      {matches ? (
        <Banner tone="warn" title="This phone number is already used">
          <View style={{ gap: 8 }}>
            {matches.map((m) => (
              <Text key={m.id} variant="bodyMedium" onPress={() => router.push(`/staff/customers/${m.id}`)} style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}>
                {m.name} · {formatPhone(m.phone)}{m.email ? ` · ${m.email}` : ''}
              </Text>
            ))}
            <Text variant="bodySmall">Same person? Open their record. A different person (for example a family member)? Save anyway.</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button mode="outlined" compact disabled={save.isPending} onPress={form.handleSubmit((v) => submit(v, true))}>Save anyway</Button>
              <Button compact onPress={() => setDuplicate(null)}>Change number</Button>
            </View>
          </View>
        </Banner>
      ) : (
        // Stays disabled after success while we navigate away, so a second tap can't create a duplicate.
        <SubmitButton onPress={form.handleSubmit((v) => submit(v))} pending={save.isPending || save.isSuccess}>{customer ? 'Save changes' : 'Create customer'}</SubmitButton>
      )}
    </>
  );
}

function CustomerRow({ c, onPress }: { c: Customer; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Card onPress={onPress} style={{ gap: 2 }}>
      <Text variant="titleMedium" style={{ fontWeight: '700' }}>{c.name}</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{formatPhone(c.phone)}{c.email ? ` · ${c.email}` : ''}</Text>
      {!c.active && <Text variant="labelMedium" style={{ color: theme.colors.error }}>Inactive</Text>}
    </Card>
  );
}

export function CustomersList() {
  const router = useRouter();
  const [text, setText] = useState('');
  const q = useDebounced(text.trim());
  const [creating, setCreating] = useState(false);
  const list = useInfiniteList<Customer>('customers', '/customers', { q: q || undefined });

  return (
    <View style={{ flex: 1 }}>
      <InfiniteList
        query={list}
        emptyIcon="account-search-outline"
        emptyTitle={q ? 'No customer found' : 'No customers yet'}
        emptyDescription={q ? 'Check the spelling or number, or add a new customer.' : 'Add your first customer.'}
        header={<Searchbar placeholder="Search name, phone or email" value={text} onChangeText={setText} />}
        renderItem={(c) => <CustomerRow c={c} onPress={() => router.push(`/staff/customers/${c.id}`)} />}
      />
      <FAB icon="account-plus" label="New customer" onPress={() => setCreating(true)} style={{ position: 'absolute', right: 16, bottom: 16 }} />
      <FormModal visible={creating} onClose={() => setCreating(false)} title="New customer" subtitle="For customers who call, WhatsApp or walk in. Search first to avoid duplicates.">
        <CustomerForm onSaved={(c) => { setCreating(false); router.push(`/staff/customers/${c.id}`); }} />
      </FormModal>
    </View>
  );
}

function RecentBookings({ customerId }: { customerId: string }) {
  const router = useRouter();
  const q = useBookings({ customerId, pageSize: 5 });
  if (q.isPending) return <ListSkeleton rows={1} />;
  if (q.isError || q.data.items.length === 0) return <Text variant="bodyMedium" style={{ opacity: 0.6 }}>No bookings yet.</Text>;
  return <>{q.data.items.map((b) => <BookingCard key={b.id} booking={b} staff onPress={() => router.push(`/staff/bookings/${b.id}`)} />)}</>;
}

export function CustomerProfile({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const q = useCustomer(id);
  const invite = useInviteCustomer();
  const [editing, setEditing] = useState(false);

  if (q.isPending) return <Screen><ListSkeleton rows={3} /></Screen>;
  if (q.isError) return <Screen><ErrorState error={q.error} onRetry={() => q.refetch()} /></Screen>;
  const c = q.data;

  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <View style={{ gap: 4 }}>
        <Text variant="headlineSmall" style={{ fontWeight: '800' }}>{c.name}</Text>
        <Text variant="bodyMedium" style={{ opacity: 0.7 }}>Customer since {formatDate(c.createdAt)}{c.active ? '' : ' · Inactive'}</Text>
      </View>
      <InfoRows rows={[
        ['Phone', formatPhone(c.phone)],
        ['Email', c.email ? `${c.email}${c.emailVerified ? ' (verified)' : ' (not verified)'}` : 'None: phone-only customer'],
        ['App account', c.hasAccount ? 'Has an account' : 'No account yet'],
      ]} />
      <Button mode="contained" icon="calendar-plus" onPress={() => router.push(`/staff/bookings/new?customerId=${c.id}`)} contentStyle={{ height: 48 }}>Book for this customer</Button>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button mode="outlined" icon="pencil-outline" onPress={() => setEditing(true)} style={{ flex: 1 }}>Edit</Button>
        {c.email && !c.hasAccount && (
          <Button mode="outlined" icon="email-fast-outline" loading={invite.isPending} onPress={() => invite.mutate(c.id, { onSuccess: (r) => toast.success(r.message), onError: (e) => toast.error(e.message) })} style={{ flex: 1 }}>Invite</Button>
        )}
      </View>
      <AddressSection customerId={c.id} />
      <ApplianceSection customerId={c.id} />
      <View style={{ gap: 8 }}>
        <SectionTitle>Recent bookings</SectionTitle>
        <RecentBookings customerId={c.id} />
      </View>
      <FormModal visible={editing} onClose={() => setEditing(false)} title="Edit customer">
        <CustomerForm customer={c} onSaved={() => setEditing(false)} />
      </FormModal>
    </Screen>
  );
}

// ---------- Staff books on behalf of a customer: choose the customer, then the same wizard the customer uses ----------

function CustomerPicker({ onSelect }: { onSelect: (c: Customer) => void }) {
  const [text, setText] = useState('');
  const q = useDebounced(text.trim());
  const [creating, setCreating] = useState(false);
  const list = useInfiniteList<Customer>('customers', '/customers', { q: q || undefined });
  return (
    <View style={{ flex: 1 }}>
      <InfiniteList
        query={list}
        emptyIcon="account-search-outline"
        emptyTitle="No customer found"
        emptyDescription="Check the number, or create a new customer."
        header={
          <View style={{ gap: 12 }}>
            <Text variant="headlineSmall" style={{ fontWeight: '800' }}>Who is this for?</Text>
            <Searchbar placeholder="Search name, phone or email" value={text} onChangeText={setText} />
            <Button mode="outlined" icon="account-plus" onPress={() => setCreating(true)}>New customer</Button>
          </View>
        }
        renderItem={(c) => <CustomerRow c={c} onPress={() => onSelect(c)} />}
      />
      <FormModal visible={creating} onClose={() => setCreating(false)} title="New customer" subtitle="Search first to avoid duplicates.">
        <CustomerForm onSaved={(c) => { setCreating(false); onSelect(c); }} />
      </FormModal>
    </View>
  );
}

export function StaffBookingFlow() {
  const theme = useTheme();
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const [picked, setPicked] = useState<Customer | null>(null);
  const preset = useCustomer(customerId ?? '');
  const customer = picked ?? (customerId ? preset.data ?? null : null);

  if (!customer) {
    if (customerId && preset.isPending) return <Screen><ListSkeleton rows={2} /></Screen>;
    if (customerId && preset.isError) return <Screen><ErrorState error={preset.error} onRetry={() => preset.refetch()} /></Screen>;
    return <CustomerPicker onSelect={setPicked} />;
  }
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingHorizontal: 16, backgroundColor: theme.colors.primaryContainer }}>
        <View style={{ flex: 1 }}>
          <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>Booking for</Text>
          <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.onPrimaryContainer }} numberOfLines={1}>{customer.name} · {formatPhone(customer.phone)}</Text>
        </View>
        {!customerId && <Button compact onPress={() => setPicked(null)}>Change</Button>}
      </View>
      {/* key: switching customer starts a fresh wizard, so nothing from the previous customer is reused */}
      <BookingWizard key={customer.id} customerId={customer.id} />
    </View>
  );
}
