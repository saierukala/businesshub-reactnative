import { useState } from 'react';
import { Text, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ApiError } from '@/lib/api';
import { formatSlot } from '@/lib/format';
import { useAssignableTechnicians, useAssignTechnician, useCancelBooking, useRescheduleBooking } from '@/lib/queries/bookings';
import { useCreateFollowUp } from '@/lib/queries/visits';
import type { Booking, SlotOption } from '@/lib/types';
import { ChoiceList, FormAlert, SubmitButton } from '@/ui/Form';
import { FormModal } from '@/ui/FormModal';
import { EmptyState, ErrorState, ListSkeleton } from '@/ui/Parts';
import { useToast } from '@/ui/toast';
import { SlotPicker } from './SlotPicker';

type Props = { booking: Booking; visible: boolean; onClose: () => void };

// Staff inside the cutoff / cancellation window: the API answers OVERRIDE_REASON_REQUIRED, then we show a reason field.
function OverrideField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <>
      <TextInput mode="outlined" label={label} accessibilityLabel={label} value={value} onChangeText={onChange} multiline numberOfLines={2} maxLength={300} />
      <Text variant="bodySmall" style={{ opacity: 0.7 }}>Saved in the audit log.</Text>
    </>
  );
}

function RescheduleForm({ booking, onClose }: Omit<Props, 'visible'>) {
  const toast = useToast();
  const reschedule = useRescheduleBooking(booking.id);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<SlotOption>();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const needsOverride = error?.code === 'OVERRIDE_REASON_REQUIRED';

  const submit = () => {
    if (!slot) return;
    setError(null);
    reschedule.mutate({ startAt: slot.startAt, overrideReason: needsOverride ? reason.trim() : undefined }, {
      onSuccess: () => { toast.success('Booking rescheduled'); onClose(); },
      onError: (err) => { setError(err as ApiError); if ((err as ApiError).status === 409) setSlot(undefined); },
    });
  };

  return (
    <>
      <FormAlert message={error?.message} />
      <SlotPicker serviceId={booking.service.id} area={booking.address.area} date={date} slot={slot} onChange={(d, s) => { setDate(d); setSlot(s); }} reschedule={{ bookingId: booking.id, currentStartAt: booking.startAt }} />
      {needsOverride && <OverrideField label="Reason for the exception" value={reason} onChange={setReason} />}
      <SubmitButton onPress={submit} pending={reschedule.isPending} disabled={!slot || (needsOverride && reason.trim().length < 3)}>Move booking</SubmitButton>
    </>
  );
}

export const RescheduleModal = ({ booking, visible, onClose }: Props) => (
  <FormModal visible={visible} onClose={onClose} title="Reschedule" subtitle={`${booking.bookingNumber} is now ${formatSlot(booking.startAt, booking.endAt)}.`}>
    <RescheduleForm booking={booking} onClose={onClose} />
  </FormModal>
);

function CancelForm({ booking, onClose }: Omit<Props, 'visible'>) {
  const toast = useToast();
  const cancel = useCancelBooking(booking.id);
  const [reason, setReason] = useState('');
  const [override, setOverride] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const needsOverride = error?.code === 'OVERRIDE_REASON_REQUIRED';

  const submit = () => {
    setError(null);
    cancel.mutate({ reason: reason.trim() || undefined, overrideReason: needsOverride ? override.trim() : undefined }, {
      onSuccess: () => { toast.success('Booking cancelled'); onClose(); },
      onError: (err) => setError(err as ApiError),
    });
  };

  return (
    <>
      <FormAlert message={error?.message} />
      <TextInput mode="outlined" label="Reason (optional)" accessibilityLabel="Reason (optional)" value={reason} onChangeText={setReason} multiline numberOfLines={2} maxLength={300} />
      {needsOverride && <OverrideField label="Reason for cancelling late" value={override} onChange={setOverride} />}
      <SubmitButton onPress={submit} pending={cancel.isPending} disabled={needsOverride && override.trim().length < 3}>Cancel booking</SubmitButton>
    </>
  );
}

export const CancelModal = ({ booking, visible, onClose }: Props) => (
  <FormModal visible={visible} onClose={onClose} title="Cancel this booking?" subtitle={`${booking.bookingNumber} will be cancelled and the time slot released.`}>
    <CancelForm booking={booking} onClose={onClose} />
  </FormModal>
);

// Pick who goes to the customer. The list is from the API: only qualified technicians who are free at this time.
function AssignForm({ booking, onClose }: Omit<Props, 'visible'>) {
  const toast = useToast();
  const options = useAssignableTechnicians(booking.id, true);
  const assign = useAssignTechnician(booking.id);
  const [choice, setChoice] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const reassigning = booking.status === 'ASSIGNED';
  const items = options.data?.items ?? [];

  const submit = () => {
    if (!choice) return;
    setError(null);
    assign.mutate({ technicianId: choice }, {
      onSuccess: () => { toast.success(reassigning ? 'Technician changed' : 'Technician assigned'); onClose(); },
      onError: (err) => { setError(err.message); setChoice(undefined); },
    });
  };

  return (
    <>
      <FormAlert message={error ?? undefined} />
      {options.isPending ? (
        <ListSkeleton rows={3} />
      ) : options.isError ? (
        <ErrorState error={options.error} onRetry={() => options.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon="account-off-outline" title="Nobody is free at this time" description="No qualified technician is available. Reschedule with the customer instead." />
      ) : (
        <ChoiceList items={items.map((t) => ({ id: t.id, title: t.name, subtitle: t.isCurrent ? 'Currently assigned' : undefined }))} value={choice} onChange={setChoice} />
      )}
      <SubmitButton onPress={submit} pending={assign.isPending} disabled={!choice || (reassigning && choice === booking.technician?.id)}>{reassigning ? 'Change technician' : 'Assign'}</SubmitButton>
    </>
  );
}

export const AssignModal = ({ booking, visible, onClose }: Props) => (
  <FormModal visible={visible} onClose={onClose} title={booking.status === 'ASSIGNED' ? 'Change technician' : 'Assign technician'} subtitle={`${booking.bookingNumber} · ${formatSlot(booking.startAt, booking.endAt)}`}>
    <AssignForm booking={booking} onClose={onClose} />
  </FormModal>
);

// A second visit for the same repair: same customer, appliance, address and service, linked to this booking.
function FollowUpForm({ booking, staff, onClose }: Omit<Props, 'visible'> & { staff: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const create = useCreateFollowUp(booking.id);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<SlotOption>();
  const [technicianId, setTechnicianId] = useState<string>();
  const [note, setNote] = useState('');
  const [override, setOverride] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const needsOverride = error?.code === 'OVERRIDE_REASON_REQUIRED';
  const techs = slot?.technicians ?? [];

  const submit = () => {
    if (!slot) return;
    setError(null);
    create.mutate({ startAt: slot.startAt, problemDescription: note.trim() || undefined, ...(staff && { technicianId, overrideReason: needsOverride ? override.trim() : undefined }) }, {
      onSuccess: (next) => {
        toast.success(`Follow-up booked: ${next.bookingNumber}`);
        onClose();
        if (staff) router.push(`/staff/bookings/${next.id}`);
      },
      onError: (err) => { setError(err as ApiError); if ((err as ApiError).status === 409) setSlot(undefined); },
    });
  };

  return (
    <>
      <FormAlert message={error?.message} />
      <SlotPicker serviceId={booking.service.id} area={booking.address.area} date={date} slot={slot} onChange={(d, s) => { setDate(d); setSlot(s); setTechnicianId(undefined); }} />
      {staff && techs.length > 0 && (
        <ChoiceList
          items={[{ id: 'auto', title: 'Assign automatically' }, ...techs.map((t) => ({ id: t.id, title: t.name }))]}
          value={technicianId ?? 'auto'}
          onChange={(id) => setTechnicianId(id === 'auto' ? undefined : id)}
        />
      )}
      <TextInput mode="outlined" label="What is the follow-up for? (optional)" accessibilityLabel="What is the follow-up for? (optional)" value={note} onChangeText={setNote} multiline numberOfLines={2} maxLength={1000} />
      {needsOverride && <OverrideField label="Reason for booking inside the cutoff" value={override} onChange={setOverride} />}
      <SubmitButton onPress={submit} pending={create.isPending} disabled={!slot || (needsOverride && override.trim().length < 3)}>Book follow-up</SubmitButton>
    </>
  );
}

export const FollowUpModal = ({ booking, visible, onClose, staff = false }: Props & { staff?: boolean }) => (
  <FormModal visible={visible} onClose={onClose} title="Book a follow-up visit" subtitle={`Continues ${booking.bookingNumber}: ${booking.service.name} for ${booking.customer.name}.`}>
    <FollowUpForm booking={booking} staff={staff} onClose={onClose} />
  </FormModal>
);
