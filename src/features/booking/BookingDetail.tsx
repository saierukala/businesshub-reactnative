import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text } from 'react-native-paper';
import { formatDate, formatDuration, formatINR, formatPhone, formatSlot, formatTime } from '@/lib/format';
import { useBooking, useMarkNoShow } from '@/lib/queries/bookings';
import type { BookingStatus } from '@/lib/types';
import { Banner, Card, ConfirmDialog, ErrorState, Hero, InfoRows, ListSkeleton, SectionTitle, StatusChip } from '@/ui/Parts';
import { useAppTheme } from '@/ui/theme';
import { VisitSteps } from '@/ui/VisitSteps';
import { Screen } from '@/ui/Screen';
import { useToast } from '@/ui/toast';
import { AssignModal, CancelModal, FollowUpModal, RescheduleModal } from './dialogs';
import { ExtraChargeDecision, PaymentSection, ReviewSection, VisitSummary } from './sections';

// Statuses where the visit can still be moved or cancelled. (The API enforces this and the time windows.)
const OPEN: BookingStatus[] = ['PENDING', 'CONFIRMED', 'ASSIGNED'];
// Staff can mark no-show once a technician is on the job.
const NO_SHOW_FROM: BookingStatus[] = ['ASSIGNED', 'EN_ROUTE', 'ARRIVED'];

type Dialog = 'reschedule' | 'cancel' | 'noshow' | 'assign' | 'followup' | null;

// One booking, for a customer (staff = false) or for Owner/Manager (staff = true). Every action is decided and checked by the API.
export function BookingDetail({ id, staff = false }: { id: string; staff?: boolean }) {
  const theme = useAppTheme();
  const router = useRouter();
  const toast = useToast();
  const query = useBooking(id);
  const noShow = useMarkNoShow(id);
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);

  if (query.isPending) return <Screen><ListSkeleton rows={4} /></Screen>;
  if (query.isError) return <Screen><ErrorState error={query.error} onRetry={() => query.refetch()} /></Screen>;

  const b = query.data;
  const isOpen = OPEN.includes(b.status);
  const base = staff ? '/staff/bookings' : '/bookings';
  const phone = b.customer.phone;
  const address = [b.address.label, b.address.line1, b.address.area, b.address.city].filter(Boolean).join(', ');

  const rows: [string, string][] = [
    ['When', formatSlot(b.startAt, b.endAt)],
    ['Service', `${b.service.name}, about ${formatDuration(b.service.durationMinutes)}`],
    ['Visit charge', formatINR(b.service.basePrice)],
    ['Appliance', `${b.appliance.brand} ${b.appliance.category.name}${b.appliance.model ? ` (${b.appliance.model})` : ''}`],
    ['Problem', b.problemDescription],
    ['Address', address],
    ['Technician', b.technician?.name ?? 'Not assigned yet'],
    ...(staff ? ([['Customer', `${b.customer.name} · ${formatPhone(b.customer.phone)}`], ['Source', b.source]] as [string, string][]) : []),
  ];

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <Hero style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="headlineSmall" style={{ fontWeight: '800', color: theme.app.onGradient }}>{b.bookingNumber}</Text>
            <Text variant="bodyMedium" style={{ color: theme.app.onGradient, opacity: 0.9 }} numberOfLines={1}>{b.service.name} · {formatTime(b.startAt)}</Text>
          </View>
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 999 }}><StatusChip status={b.status} /></View>
        </View>
        <VisitSteps status={b.status} />
      </Hero>
      <View style={{ gap: 8 }}>
        {b.needsReassignment && <Text style={{ color: theme.colors.error, fontWeight: '700' }}>Needs a new technician</Text>}
        {b.followUpOf && <Button compact style={{ alignSelf: 'flex-start' }} onPress={() => router.push(`${base}/${b.followUpOf!.id}`)}>Follow-up to {b.followUpOf.bookingNumber}</Button>}
      </View>

      {/* No email on file: the app cannot message this customer, so staff must phone them. */}
      {staff && !b.customer.email && [...OPEN, 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(b.status) && (
        <Banner tone="warn" icon="phone-alert" title="Phone-only customer: call to keep them informed">
          {`${b.customer.name} has no email, so they get no messages. Call ${formatPhone(b.customer.phone)} about changes, and to remind them before the visit.${b.visit?.extraCharge.status === 'PROPOSED' ? ' Their approval of the extra charge is waiting: ask them and record the answer below.' : ''}`}
        </Banner>
      )}

      <ExtraChargeDecision booking={b} staff={staff} />

      {staff && phone && <Button mode="outlined" icon="phone" onPress={() => Linking.openURL(`tel:+91${phone}`)}>Call {formatPhone(phone)}</Button>}

      {(isOpen || (staff && (NO_SHOW_FROM.includes(b.status) || b.status === 'IN_PROGRESS' || b.status === 'COMPLETED'))) && (
        <View style={{ gap: 8 }}>
          {staff && (b.status === 'CONFIRMED' || b.status === 'ASSIGNED') && (
            <Button mode={b.needsReassignment || b.status === 'CONFIRMED' ? 'contained' : 'outlined'} icon="account-check" onPress={() => setDialog('assign')}>
              {b.status === 'ASSIGNED' ? 'Change technician' : 'Assign technician'}
            </Button>
          )}
          {isOpen && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button mode="outlined" icon="calendar-clock" onPress={() => setDialog('reschedule')} style={{ flex: 1 }}>Reschedule</Button>
              <Button mode="outlined" icon="cancel" textColor={theme.colors.error} onPress={() => setDialog('cancel')} style={{ flex: 1 }}>Cancel</Button>
            </View>
          )}
          {staff && NO_SHOW_FROM.includes(b.status) && <Button mode="outlined" icon="account-off" onPress={() => setDialog('noshow')}>Mark no-show</Button>}
          {staff && (b.status === 'IN_PROGRESS' || b.status === 'COMPLETED') && <Button mode="outlined" icon="calendar-plus" onPress={() => setDialog('followup')}>Book follow-up</Button>}
        </View>
      )}

      <InfoRows rows={rows} />

      {b.visit && <VisitSummary visit={b.visit} />}
      <PaymentSection booking={b} canRecord={staff} receiptHref={`${base}/${b.id}/receipt`} />
      <ReviewSection booking={b} canReview={!staff} />

      <View style={{ gap: 8 }}>
        <SectionTitle>History</SectionTitle>
        <Card style={{ gap: 14 }}>
          {[...b.history].reverse().map((h, i) => (
            <View key={i} style={{ gap: 4 }}>
              <StatusChip status={h.toStatus} small />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {formatDate(h.createdAt)}, {formatTime(h.createdAt)}{h.changedBy ? ` · ${h.changedBy.name}` : ''}
              </Text>
              {h.note && <Text variant="bodySmall">{h.note}</Text>}
            </View>
          ))}
        </Card>
      </View>

      <RescheduleModal booking={b} visible={dialog === 'reschedule'} onClose={close} />
      <CancelModal booking={b} visible={dialog === 'cancel'} onClose={close} />
      {staff && <AssignModal booking={b} visible={dialog === 'assign'} onClose={close} />}
      {staff && <FollowUpModal booking={b} staff visible={dialog === 'followup'} onClose={close} />}
      <ConfirmDialog
        visible={dialog === 'noshow'}
        title="Mark as no-show?"
        message={`The customer was not there for ${b.bookingNumber}. The technician's time is not released.`}
        confirmLabel="Mark no-show"
        destructive
        busy={noShow.isPending}
        onDismiss={close}
        onConfirm={() => noShow.mutate({}, { onSuccess: () => { toast.success('Marked as no-show'); close(); }, onError: (e) => { toast.error(e.message); close(); } })}
      />
    </Screen>
  );
}
