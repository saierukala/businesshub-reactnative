import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { ApiError } from '@/lib/api';
import { formatDuration, formatINR, formatSlot } from '@/lib/format';
import { useCreateBooking } from '@/lib/queries/bookings';
import { useServices } from '@/lib/queries/catalog';
import { useCustomerRecords } from '@/lib/queries/customer-records';
import type { SlotOption } from '@/lib/types';
import { ChoiceList, FormAlert, PillGroup } from '@/ui/Form';
import { FormModal } from '@/ui/FormModal';
import { Banner, EmptyState, ErrorState, InfoRows, ListSkeleton } from '@/ui/Parts';
import { Screen } from '@/ui/Screen';
import { useToast } from '@/ui/toast';
import { AddressForm, ApplianceForm } from '../records';
import { SlotPicker } from './SlotPicker';

const STEPS = ['Appliance', 'Problem and service', 'Address', 'Date and time', 'Review'];
const SOURCES = [
  { value: 'PHONE', label: 'Phone call' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'WALK_IN', label: 'Walk-in' },
];

type Draft = {
  applianceId?: string;
  problem: string;
  serviceId?: string;
  addressId?: string;
  date: string;
  slot?: SlotOption;
  technicianId?: string; // staff only
  source?: string; // staff only
  overrideReason: string; // staff only
};

// The booking flow (spec 9a for customers, 9b for staff). Both use this same component and the same API.
// customerId undefined = the logged-in customer books for themselves; set = staff booking for that customer.
// Every choice is validated again by the backend when you confirm.
export function BookingWizard({ customerId }: { customerId?: string }) {
  const theme = useTheme();
  const toast = useToast();
  const router = useRouter();
  const staff = customerId !== undefined;
  const create = useCreateBooking();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({ problem: '', date: '', overrideReason: '' });
  const [adding, setAdding] = useState<'appliance' | 'address' | null>(null);
  const [needsOverride, setNeedsOverride] = useState<string | null>(null); // the API's message, when staff must give a reason
  const [error, setError] = useState<string | null>(null);

  const appliances = useCustomerRecords('appliances', customerId);
  const addresses = useCustomerRecords('addresses', customerId);
  const appliance = appliances.data?.items.find((a) => a.id === draft.applianceId);
  const address = addresses.data?.items.find((a) => a.id === draft.addressId);
  const services = useServices({ categoryId: appliance?.category.id });
  const service = services.data?.items.find((s) => s.id === draft.serviceId);

  // Changing an earlier choice clears the later ones that depended on it.
  const set = (patch: Partial<Draft>, clear: (keyof Draft)[] = []) =>
    setDraft((d) => ({ ...d, ...patch, ...Object.fromEntries(clear.map((k) => [k, k === 'date' || k === 'problem' ? '' : undefined])) }));

  const canContinue = [Boolean(appliance), draft.problem.trim().length >= 3 && Boolean(service), Boolean(address), Boolean(draft.slot), true][step];
  const canConfirm = (!staff || Boolean(draft.source)) && (!needsOverride || draft.overrideReason.trim().length >= 3);
  const technicianName = draft.slot?.technicians?.find((t) => t.id === draft.technicianId)?.name;

  function confirm() {
    if (!draft.slot || !draft.applianceId || !draft.serviceId || !draft.addressId) return;
    setError(null);
    create.mutate(
      {
        applianceId: draft.applianceId,
        serviceId: draft.serviceId,
        addressId: draft.addressId,
        problemDescription: draft.problem.trim(),
        startAt: draft.slot.startAt,
        ...(staff && { customerId, source: draft.source, technicianId: draft.technicianId, overrideReason: needsOverride ? draft.overrideReason.trim() : undefined }),
      },
      {
        onSuccess: (booking) => {
          toast.success(`Booked. Booking number ${booking.bookingNumber}`);
          router.replace(staff ? `/staff/bookings/${booking.id}` : `/bookings/${booking.id}`);
        },
        onError: (err) => {
          const e = err as ApiError;
          if (e.code === 'OVERRIDE_REASON_REQUIRED') return setNeedsOverride(e.message); // staff: show the reason field, keep everything else
          setError(e.message);
          if (e.status === 409) {
            set({ slot: undefined, technicianId: undefined }); // that time is gone: pick again from the refreshed list
            setStep(3);
          }
        },
      },
    );
  }

  const last = step === STEPS.length - 1;
  return (
    <Screen
      footer={
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button mode="outlined" disabled={step === 0 || create.isPending} onPress={() => setStep(step - 1)} style={{ flex: 1, borderRadius: 14 }} contentStyle={{ height: 50 }}>Back</Button>
          <Button
            mode="contained"
            loading={create.isPending}
            disabled={create.isPending || (last ? !canConfirm : !canContinue)}
            onPress={last ? confirm : () => setStep(step + 1)}
            style={{ flex: 2, borderRadius: 14 }}
            contentStyle={{ height: 50 }}
            labelStyle={{ fontWeight: '700', fontSize: 16 }}
          >
            {last ? 'Confirm booking' : 'Continue'}
          </Button>
        </View>
      }
    >
      <View style={{ gap: 8 }}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Step {step + 1} of {STEPS.length}</Text>
        <Text variant="headlineSmall" style={{ fontWeight: '800' }}>{STEPS[step]}</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {STEPS.map((s, i) => <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? theme.colors.primary : theme.colors.surfaceVariant }} />)}
        </View>
      </View>

      <FormAlert message={error ?? undefined} />

      {step === 0 &&
        (appliances.isPending ? <ListSkeleton rows={2} /> : appliances.isError ? <ErrorState error={appliances.error} onRetry={() => appliances.refetch()} /> : (
          <>
            {appliances.data.items.length === 0 && <EmptyState icon="washing-machine" title="No appliances yet" description="Add the appliance that needs repair. It is saved for next time." />}
            <ChoiceList
              items={appliances.data.items.map((a) => ({ id: a.id, title: `${a.brand} ${a.category.name}`, subtitle: [a.model, a.purchaseYear && `bought ${a.purchaseYear}`].filter(Boolean).join(' · ') || undefined }))}
              value={draft.applianceId}
              onChange={(id) => set({ applianceId: id }, ['serviceId', 'slot', 'date', 'technicianId'])}
              addLabel={appliances.data.items.length ? 'Add another appliance' : 'Add an appliance'}
              onAdd={() => setAdding('appliance')}
            />
          </>
        ))}

      {step === 1 && (
        <View style={{ gap: 20 }}>
          <TextInput mode="outlined" label="What is wrong?" accessibilityLabel="What is wrong?" placeholder="e.g. Not cooling, makes a loud noise at night" value={draft.problem} onChangeText={(t) => set({ problem: t })} multiline numberOfLines={3} maxLength={1000} style={{ minHeight: 90 }} />
          {services.isPending ? <ListSkeleton rows={2} /> : services.isError ? <ErrorState error={services.error} onRetry={() => services.refetch()} /> : services.data.items.length === 0 ? (
            <EmptyState icon="tools" title="No repair service for this appliance yet" description="Please call us to help with this booking." />
          ) : (
            <View style={{ gap: 8 }}>
              <Text variant="titleSmall" style={{ fontWeight: '700' }}>Service</Text>
              <ChoiceList
                items={services.data.items.map((s) => ({ id: s.id, title: s.name, subtitle: `About ${formatDuration(s.durationMinutes)}`, aside: formatINR(s.basePrice) }))}
                value={draft.serviceId}
                onChange={(id) => set({ serviceId: id }, ['slot', 'date', 'technicianId'])}
              />
            </View>
          )}
        </View>
      )}

      {step === 2 &&
        (addresses.isPending ? <ListSkeleton rows={2} /> : addresses.isError ? <ErrorState error={addresses.error} onRetry={() => addresses.refetch()} /> : (
          <>
            {addresses.data.items.length === 0 && <EmptyState icon="map-marker-outline" title="No addresses yet" description="Add where the technician should come." />}
            <ChoiceList
              items={addresses.data.items.map((a) => ({ id: a.id, title: a.label, subtitle: [a.line1, a.area, a.city, a.pincode].filter(Boolean).join(', ') }))}
              value={draft.addressId}
              onChange={(id) => set({ addressId: id }, ['slot', 'date', 'technicianId'])}
              addLabel={addresses.data.items.length ? 'Add another address' : 'Add an address'}
              onAdd={() => setAdding('address')}
            />
          </>
        ))}

      {step === 3 && service && address && (
        <>
          <SlotPicker serviceId={service.id} area={address.area} date={draft.date} slot={draft.slot} onChange={(date, slot) => set({ date, slot, technicianId: undefined })} />
          {staff && draft.slot?.technicians && (
            <View style={{ gap: 8 }}>
              <Text variant="titleSmall" style={{ fontWeight: '700' }}>Technician</Text>
              <ChoiceList
                items={[{ id: 'auto', title: 'Assign automatically' }, ...draft.slot.technicians.map((t) => ({ id: t.id, title: t.name, subtitle: 'Free at this time' }))]}
                value={draft.technicianId ?? 'auto'}
                onChange={(id) => set({ technicianId: id === 'auto' ? undefined : id })}
              />
            </View>
          )}
        </>
      )}

      {last && appliance && service && address && draft.slot && (
        <View style={{ gap: 16 }}>
          <InfoRows
            rows={[
              ['Appliance', `${appliance.brand} ${appliance.category.name}${appliance.model ? ` (${appliance.model})` : ''}`],
              ['Problem', draft.problem.trim()],
              ['Service', `${service.name}, about ${formatDuration(service.durationMinutes)}`],
              ['Visit charge', `${formatINR(service.basePrice)}, paid after the visit`],
              ['Address', [address.line1, address.area, address.city, address.pincode].filter(Boolean).join(', ')],
              ['When', formatSlot(draft.slot.startAt, draft.slot.endAt)],
              ...(staff ? ([['Technician', technicianName ?? 'Assigned automatically']] as [string, string][]) : []),
            ]}
          />
          {!staff && <Banner tone="info">Any extra work found at the visit needs your approval first.</Banner>}
          {staff && (
            <View style={{ gap: 8 }}>
              <Text variant="titleSmall" style={{ fontWeight: '700' }}>Where did this booking come from?</Text>
              <PillGroup options={SOURCES} value={draft.source} onChange={(v) => set({ source: v })} />
            </View>
          )}
          {needsOverride && (
            <View style={{ gap: 8 }}>
              <FormAlert message={needsOverride} />
              <TextInput mode="outlined" label="Reason for booking inside the cutoff" accessibilityLabel="Reason for booking inside the cutoff" value={draft.overrideReason} onChangeText={(t) => set({ overrideReason: t })} multiline numberOfLines={2} maxLength={300} />
              <Text variant="bodySmall" style={{ opacity: 0.7 }}>Saved in the audit log.</Text>
            </View>
          )}
        </View>
      )}

      <FormModal visible={adding !== null} onClose={() => setAdding(null)} title={adding === 'appliance' ? 'Add appliance' : 'Add address'}>
        {adding === 'appliance' && <ApplianceForm customerId={customerId} onDone={() => setAdding(null)} />}
        {adding === 'address' && <AddressForm customerId={customerId} onDone={() => setAdding(null)} />}
      </FormModal>
    </Screen>
  );
}

