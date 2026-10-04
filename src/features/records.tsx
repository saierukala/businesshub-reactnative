import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { showApiError } from '@/lib/form';
import { formatDate, formatINR } from '@/lib/format';
import { useCategories } from '@/lib/queries/catalog';
import { useCustomerRecords, useDeleteCustomerRecord, useSaveCustomerRecord } from '@/lib/queries/customer-records';
import { useApplianceHistory } from '@/lib/queries/visits';
import { addressSchema, type AddressInput } from '@/lib/schemas/address';
import { applianceSchema, type ApplianceInput, type ApplianceOutput } from '@/lib/schemas/appliance';
import type { Address, Appliance } from '@/lib/types';
import { FormAlert, SelectField, SubmitButton, TextField } from '@/ui/Form';
import { FormModal } from '@/ui/FormModal';
import { Card, ConfirmDialog, EmptyState, ErrorState, ListSkeleton, SectionTitle } from '@/ui/Parts';
import { useToast } from '@/ui/toast';

type Props = { customerId?: string; onDone: () => void };

export function AddressForm({ customerId, address, onDone }: Props & { address?: Address }) {
  const toast = useToast();
  const save = useSaveCustomerRecord('addresses', customerId);
  const form = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: address?.label ?? 'Home', line1: address?.line1 ?? '', area: address?.area ?? '', city: address?.city ?? 'Hyderabad', pincode: address?.pincode ?? '' },
    mode: 'onTouched',
  });
  const submit = form.handleSubmit((v) =>
    save.mutateAsync({ ...v, id: address?.id }).then(
      () => {
        toast.success(address ? 'Address updated' : 'Address added');
        onDone();
      },
      (err) => showApiError(form, err),
    ),
  );
  return (
    <>
      <FormAlert message={form.formState.errors.root?.server?.message} />
      <TextField control={form.control} name="label" label="Label" placeholder="Home, Office, Mom's place" left="tag-outline" />
      <TextField control={form.control} name="line1" label="House / flat and street" autoComplete="street-address" left="home-outline" hint={address ? 'For a new home, add a new address instead: past visits keep this one.' : undefined} />
      <TextField control={form.control} name="area" label="Area (e.g. Kondapur)" left="map-marker-outline" />
      <TextField control={form.control} name="city" label="City" />
      <TextField control={form.control} name="pincode" label="PIN code (optional)" keyboardType="number-pad" maxLength={6} />
      <SubmitButton onPress={submit} pending={save.isPending}>{address ? 'Save address' : 'Add address'}</SubmitButton>
    </>
  );
}

export function ApplianceForm({ customerId, appliance, onDone }: Props & { appliance?: Appliance }) {
  const toast = useToast();
  const save = useSaveCustomerRecord('appliances', customerId);
  const categories = useCategories();
  const form = useForm<ApplianceInput, unknown, ApplianceOutput>({
    resolver: zodResolver(applianceSchema),
    defaultValues: {
      categoryId: appliance?.category.id ?? '',
      brand: appliance?.brand ?? '',
      model: appliance?.model ?? '',
      serialNumber: appliance?.serialNumber ?? '',
      purchaseYear: appliance?.purchaseYear ? String(appliance.purchaseYear) : '',
      description: appliance?.description ?? '',
    },
    mode: 'onTouched',
  });
  const submit = form.handleSubmit((v) =>
    save.mutateAsync({ ...v, id: appliance?.id }).then(
      () => {
        toast.success(appliance ? 'Appliance updated' : 'Appliance added');
        onDone();
      },
      (err) => showApiError(form, err),
    ),
  );
  return (
    <>
      <FormAlert message={form.formState.errors.root?.server?.message ?? categories.error?.message} />
      <SelectField control={form.control} name="categoryId" label="Appliance type" options={categories.data?.items.map((c) => ({ value: c.id, label: c.name })) ?? []} />
      <TextField control={form.control} name="brand" label="Brand (e.g. LG)" />
      <TextField control={form.control} name="model" label="Model (optional)" />
      <TextField control={form.control} name="serialNumber" label="Serial number (optional)" />
      <TextField control={form.control} name="purchaseYear" label="Year bought (optional)" keyboardType="number-pad" maxLength={4} />
      <TextField control={form.control} name="description" label="Notes (optional)" multiline lines={2} />
      <SubmitButton onPress={submit} pending={save.isPending}>{appliance ? 'Save appliance' : 'Add appliance'}</SubmitButton>
    </>
  );
}

function ApplianceHistory({ appliance, onClose }: { appliance: Appliance | null; onClose: () => void }) {
  const theme = useTheme();
  const q = useApplianceHistory(appliance?.id ?? '', appliance !== null);
  return (
    <FormModal visible={appliance !== null} onClose={onClose} title="Repair history" subtitle={appliance ? `${appliance.brand} ${appliance.category.name}` : undefined}>
      {q.isPending ? (
        <ListSkeleton rows={2} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : q.data.items.length === 0 ? (
        <EmptyState title="No repairs yet" description="Completed visits for this appliance appear here." icon="history" />
      ) : (
        q.data.items.map((h) => (
          <Card key={h.bookingId}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="titleSmall" style={{ fontWeight: '700' }}>{h.service.name}</Text>
              <Text variant="titleSmall" style={{ fontWeight: '700' }}>{formatINR(h.amount)}</Text>
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{formatDate(h.date)} · {h.bookingNumber}{h.technician ? ` · ${h.technician}` : ''}</Text>
            {h.diagnosis && <Text variant="bodyMedium">Found: {h.diagnosis}</Text>}
            {h.workPerformed && <Text variant="bodyMedium">Did: {h.workPerformed}</Text>}
          </Card>
        ))
      )}
    </FormModal>
  );
}

type Kind = 'addresses' | 'appliances';
type Item<K extends Kind> = K extends 'addresses' ? Address : Appliance;

// List + add + edit + delete for a customer's addresses or appliances.
// customerId undefined = the logged-in customer; set = staff acting for that customer.
function RecordsSection<K extends Kind>({
  kind, customerId, title, noun, emptyTitle, emptyDescription, icon, describe, renderForm,
}: {
  kind: K; customerId?: string; title: string; noun: string; emptyTitle: string; emptyDescription: string; icon: string;
  describe: (item: Item<K>) => { title: string; subtitle: string };
  renderForm: (item: Item<K> | undefined, onDone: () => void) => ReactNode;
}) {
  const theme = useTheme();
  const toast = useToast();
  const records = useCustomerRecords(kind, customerId);
  const remove = useDeleteCustomerRecord(kind, customerId);
  const [editing, setEditing] = useState<Item<K> | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Item<K> | null>(null);
  const [history, setHistory] = useState<Appliance | null>(null);
  const add = <Button compact icon="plus" onPress={() => setEditing('new')}>Add</Button>;
  const items = (records.data?.items ?? []) as Item<K>[];

  return (
    <View style={{ gap: 12 }}>
      <SectionTitle action={items.length > 0 ? add : undefined}>{title}</SectionTitle>
      {records.isPending ? (
        <ListSkeleton rows={2} />
      ) : records.isError ? (
        <ErrorState error={records.error} onRetry={() => records.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} action={<Button mode="contained-tonal" icon="plus" onPress={() => setEditing('new')}>Add {noun}</Button>} />
      ) : (
        items.map((item) => {
          const d = describe(item);
          return (
            <Card key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ flex: 1 }}>
                <Text variant="titleSmall" style={{ fontWeight: '700' }}>{d.title}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{d.subtitle}</Text>
              </View>
              {kind === 'appliances' && <IconButton icon="history" size={20} onPress={() => setHistory(item as Appliance)} accessibilityLabel="Repair history" />}
              <IconButton icon="pencil-outline" size={20} onPress={() => setEditing(item)} accessibilityLabel={`Edit ${noun}`} />
              <IconButton icon="trash-can-outline" size={20} iconColor={theme.colors.error} onPress={() => setDeleting(item)} accessibilityLabel={`Delete ${noun}`} />
            </Card>
          );
        })
      )}

      <FormModal visible={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? `Add ${noun}` : `Edit ${noun}`}>
        {editing !== null && renderForm(editing === 'new' ? undefined : editing, () => setEditing(null))}
      </FormModal>
      <ConfirmDialog
        visible={deleting !== null}
        title={`Delete this ${noun}?`}
        message="It will no longer be offered when booking. Past bookings keep it."
        confirmLabel="Delete"
        destructive
        busy={remove.isPending}
        onDismiss={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => { toast.success(`${noun[0].toUpperCase()}${noun.slice(1)} deleted`); setDeleting(null); }, onError: (e) => { toast.error(e.message); setDeleting(null); } })}
      />
      {kind === 'appliances' && <ApplianceHistory appliance={history} onClose={() => setHistory(null)} />}
    </View>
  );
}

export const AddressSection = ({ customerId }: { customerId?: string }) => (
  <RecordsSection
    kind="addresses" customerId={customerId} title="Addresses" noun="address" icon="map-marker-outline"
    emptyTitle="No addresses yet" emptyDescription="Add where the technician should come."
    describe={(a) => ({ title: a.label, subtitle: [a.line1, a.area, a.city, a.pincode].filter(Boolean).join(', ') })}
    renderForm={(a, onDone) => <AddressForm customerId={customerId} address={a} onDone={onDone} />}
  />
);

export const ApplianceSection = ({ customerId }: { customerId?: string }) => (
  <RecordsSection
    kind="appliances" customerId={customerId} title="Appliances" noun="appliance" icon="washing-machine"
    emptyTitle="No appliances yet" emptyDescription="Add what needs repair. It is saved for next time."
    describe={(a) => ({ title: `${a.brand} ${a.category.name}`, subtitle: [a.model, a.purchaseYear && `bought ${a.purchaseYear}`].filter(Boolean).join(' · ') || 'No details yet' })}
    renderForm={(a, onDone) => <ApplianceForm customerId={customerId} appliance={a} onDone={onDone} />}
  />
);
