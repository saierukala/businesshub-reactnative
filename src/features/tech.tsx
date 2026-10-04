import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Icon, ProgressBar, Text, useTheme } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth';
import { showApiError } from '@/lib/form';
import { formatDuration, formatINR, formatPhone, formatSlot, formatTime } from '@/lib/format';
import { useBooking } from '@/lib/queries/bookings';
import { useTechnicianDashboard } from '@/lib/queries/dashboard';
import { useAdvanceBooking, useCompleteVisit, useProposeExtraCharge, useSaveVisit } from '@/lib/queries/visits';
import { extraChargeSchema, visitSchema, type ExtraChargeInput, type VisitInput } from '@/lib/schemas/visit';
import type { BookingDetail, BookingStatus } from '@/lib/types';
import { FormAlert, SubmitButton, TextField } from '@/ui/Form';
import { FormModal } from '@/ui/FormModal';
import { Banner, Card, EmptyState, ErrorState, InfoRows, ListSkeleton, SectionTitle, StatusChip } from '@/ui/Parts';
import { Screen } from '@/ui/Screen';
import { useToast } from '@/ui/toast';
import { FollowUpModal } from './booking/dialogs';
import { PaymentSection } from './booking/sections';
import { VisitSummary } from './booking/sections';

// ---------- The technician's day ----------

export function TechJobs() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const q = useTechnicianDashboard();
  const first = user?.name.split(' ')[0];

  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Text variant="headlineSmall" style={{ fontWeight: '800' }}>Hi {first}</Text>
      {q.isPending ? <ListSkeleton /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
        <>
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="titleSmall" style={{ fontWeight: '700' }}>Today</Text>
              <Text variant="bodyMedium">{q.data.counts.done} of {q.data.counts.total} done</Text>
            </View>
            <ProgressBar progress={q.data.counts.total ? q.data.counts.done / q.data.counts.total : 0} color="#16a34a" style={{ height: 8, borderRadius: 4 }} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{q.data.counts.remaining} remaining</Text>
          </Card>
          {q.data.appointments.length === 0 && <EmptyState icon="coffee-outline" title="No jobs today" description="New assignments appear here. Pull down to refresh." />}
          {q.data.appointments.map((a) => (
            <Card key={a.id} onPress={() => router.push(`/tech/jobs/${a.id}`)} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="titleLarge" style={{ fontWeight: '800' }}>{formatTime(a.startAt)}</Text>
                <StatusChip status={a.status} small />
              </View>
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>{a.service.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon source="account-outline" size={16} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodyMedium">{a.customer.name}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon source="map-marker-outline" size={16} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }} numberOfLines={1}>{a.address.line1}, {a.address.area}</Text>
              </View>
              {a.nextStatus && <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '700' }}>Next: {NEXT[a.status]?.label ?? 'open job'}</Text>}
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

// ---------- One job ----------

// The big button for the next step. Completing is done from the visit form.
const NEXT: Partial<Record<BookingStatus, { to: 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS'; label: string }>> = {
  ASSIGNED: { to: 'EN_ROUTE', label: "I'm on my way" },
  EN_ROUTE: { to: 'ARRIVED', label: "I've arrived" },
  ARRIVED: { to: 'IN_PROGRESS', label: 'Start work' },
};

export function TechJob({ id }: { id: string }) {
  const query = useBooking(id);
  if (query.isPending) return <Screen><ListSkeleton rows={4} /></Screen>;
  if (query.isError) return <Screen><ErrorState error={query.error} onRetry={() => query.refetch()} /></Screen>;
  return <JobBody b={query.data} refreshing={query.isRefetching} onRefresh={() => query.refetch()} />;
}

function JobBody({ b, refreshing, onRefresh }: { b: BookingDetail; refreshing: boolean; onRefresh: () => void }) {
  const toast = useToast();
  const advance = useAdvanceBooking(b.id);
  const save = useSaveVisit(b.id);
  const complete = useCompleteVisit(b.id);
  const [followUp, setFollowUp] = useState(false);
  const visit = b.visit;
  const waiting = visit?.extraCharge.status === 'PROPOSED'; // the customer has not answered yet
  const inProgress = b.status === 'IN_PROGRESS';
  const next = NEXT[b.status];

  const form = useForm<VisitInput>({
    resolver: zodResolver(visitSchema),
    defaultValues: { diagnosis: visit?.diagnosis ?? '', workPerformed: visit?.workPerformed ?? '', partsNote: visit?.partsNote ?? '', notes: visit?.notes ?? '', result: visit?.result ?? '' },
    mode: 'onTouched',
  });

  const saveDraft = () => {
    const v = form.getValues();
    save.mutate(
      { diagnosis: v.diagnosis.trim(), workPerformed: v.workPerformed.trim(), partsNote: v.partsNote.trim(), notes: v.notes.trim(), result: v.result.trim() },
      { onSuccess: () => toast.success('Notes saved'), onError: (e) => toast.error(e.message) },
    );
  };
  const onComplete = form.handleSubmit((v) =>
    complete.mutateAsync({ ...v, diagnosis: v.diagnosis.trim(), workPerformed: v.workPerformed.trim() }).then(
      () => toast.success('Visit completed'),
      (err) => showApiError(form, err),
    ),
  );

  const address = [b.address.line1, b.address.area, b.address.city, b.address.pincode].filter(Boolean).join(', ');
  const rows: [string, string][] = [
    ['When', formatSlot(b.startAt, b.endAt)],
    ['Job', `${b.service.name}, about ${formatDuration(b.service.durationMinutes)}`],
    ['Appliance', `${b.appliance.brand} ${b.appliance.category.name}${b.appliance.model ? ` (${b.appliance.model})` : ''}`],
    ['Problem', b.problemDescription],
  ];

  const footer = next ? (
    <SubmitButton pending={advance.isPending} onPress={() => advance.mutate(next.to, { onError: (e) => toast.error(e.message) })}>{next.label}</SubmitButton>
  ) : inProgress ? (
    <>
      {waiting && <Text variant="bodySmall" style={{ textAlign: 'center', opacity: 0.7 }}>Waiting for the customer to answer the extra charge.</Text>}
      <SubmitButton pending={complete.isPending} disabled={waiting} onPress={onComplete} icon="check-circle-outline">Complete visit</SubmitButton>
    </>
  ) : undefined;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing} footer={footer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="headlineSmall" style={{ fontWeight: '800', flex: 1 }}>{b.customer.name}</Text>
        <StatusChip status={b.status} />
      </View>

      <View style={{ gap: 8 }}>
        {b.customer.phone && <Button mode="outlined" icon="phone" onPress={() => Linking.openURL(`tel:+91${b.customer.phone}`)}>Call {formatPhone(b.customer.phone)}</Button>}
        <Button mode="outlined" icon="map-marker" onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`)} contentStyle={{ justifyContent: 'flex-start' }}>
          {address}
        </Button>
      </View>

      {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
        <Banner tone="info" icon="clock-outline" title="Not assigned to you yet">The office still has to confirm this job. The start button appears once it is assigned to you.</Banner>
      )}

      <InfoRows rows={rows} />

      {inProgress && (
        <>
          <ExtraChargeCard booking={b} />
          <View style={{ gap: 12 }}>
            <SectionTitle>Visit notes</SectionTitle>
            <FormAlert message={form.formState.errors.root?.server?.message} />
            <TextField control={form.control} name="diagnosis" label="What did you find?" multiline lines={3} />
            <TextField control={form.control} name="workPerformed" label="What did you do?" multiline lines={3} />
            <TextField control={form.control} name="partsNote" label="Parts used (optional)" multiline lines={2} />
            <TextField control={form.control} name="result" label="Result (optional)" multiline lines={2} />
            <TextField control={form.control} name="notes" label="Other notes (optional)" multiline lines={2} />
            <Button mode="outlined" icon="content-save-outline" loading={save.isPending} disabled={save.isPending} onPress={saveDraft}>Save notes</Button>
          </View>
        </>
      )}

      {b.status === 'COMPLETED' && b.visit && <VisitSummary visit={b.visit} />}
      <PaymentSection booking={b} canRecord receiptHref={`/tech/jobs/${b.id}/receipt`} />

      {(inProgress || b.status === 'COMPLETED') && <Button mode="outlined" icon="calendar-plus" onPress={() => setFollowUp(true)}>Needs a second visit</Button>}
      <FollowUpModal booking={b} visible={followUp} onClose={() => setFollowUp(false)} />
    </Screen>
  );
}

function ProposeForm({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const toast = useToast();
  const propose = useProposeExtraCharge(bookingId);
  const form = useForm<ExtraChargeInput>({ resolver: zodResolver(extraChargeSchema), defaultValues: { amount: '', reason: '' }, mode: 'onTouched' });
  const submit = form.handleSubmit((v) =>
    propose.mutateAsync({ amount: Number(v.amount), reason: v.reason.trim() }).then(
      () => { toast.success('Sent to the customer for approval'); onDone(); },
      (err) => showApiError(form, err),
    ),
  );
  return (
    <>
      <FormAlert message={form.formState.errors.root?.server?.message} />
      <TextField control={form.control} name="amount" label="Extra amount (₹)" keyboardType="decimal-pad" left="currency-inr" />
      <TextField control={form.control} name="reason" label="What is the extra work?" multiline lines={3} hint="e.g. Gas refill and leak sealing" />
      <SubmitButton onPress={submit} pending={propose.isPending}>Ask the customer to approve</SubmitButton>
    </>
  );
}

// The technician's side of the extra charge: ask, wait for the answer, see the result.
// The answer arrives on its own (the booking refreshes every few seconds while the work is in progress).
function ExtraChargeCard({ booking }: { booking: BookingDetail }) {
  const [open, setOpen] = useState(false);
  const extra = booking.visit?.extraCharge;
  if (!extra || booking.status !== 'IN_PROGRESS') return null;
  const amount = extra.amount ? formatINR(extra.amount) : '';

  return (
    <View style={{ gap: 12 }}>
      <SectionTitle>Extra work</SectionTitle>
      {extra.status === 'PROPOSED' && <Banner tone="info" icon="clock-outline" title={`Waiting for the customer to approve ${amount}`}>{`${extra.reason}. Do not start the extra work until it is approved. You can finish the visit after they answer.`}</Banner>}
      {extra.status === 'APPROVED' && <Banner tone="success" title={`${amount} approved`}>{`${extra.reason}. Total to collect: ${formatINR(booking.visit!.finalAmount)}.`}</Banner>}
      {extra.status === 'DECLINED' && <Banner tone="error" title={`The customer declined ${amount}`}>Do only the base service. You can offer a different amount if needed.</Banner>}
      {(extra.status === 'NONE' || extra.status === 'DECLINED') && (
        <Button mode="outlined" icon="plus" onPress={() => setOpen(true)}>{extra.status === 'DECLINED' ? 'Offer a different amount' : 'Extra work needed'}</Button>
      )}
      <FormModal visible={open} onClose={() => setOpen(false)} title="Ask for an extra charge" subtitle="The customer approves or declines in the app. Nothing beyond the base service happens until they approve.">
        <ProposeForm bookingId={booking.id} onDone={() => setOpen(false)} />
      </FormModal>
    </View>
  );
}
