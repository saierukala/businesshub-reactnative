import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { showApiError } from '@/lib/form';
import { formatDate, formatINR, formatTime } from '@/lib/format';
import { useRecordPayment } from '@/lib/queries/payments';
import { useCreateReview } from '@/lib/queries/reviews';
import { useDecideExtraCharge } from '@/lib/queries/visits';
import { reviewSchema, type ReviewValues } from '@/lib/schemas/review';
import type { BookingDetail, Visit } from '@/lib/types';
import { FormAlert, PillGroup, SubmitButton, TextField } from '@/ui/Form';
import { Banner, Card, InfoRows, SectionTitle, StarInput, Stars } from '@/ui/Parts';
import { Controller } from 'react-hook-form';
import { useToast } from '@/ui/toast';

// The technician found extra work and asked for more money. Nothing beyond the base service happens until this is
// approved. The customer answers here; staff use it to record the customer's answer from a phone call.
export function ExtraChargeDecision({ booking, staff = false }: { booking: BookingDetail; staff?: boolean }) {
  const toast = useToast();
  const decide = useDecideExtraCharge(booking.id);
  const extra = booking.visit?.extraCharge;
  if (!extra || extra.status !== 'PROPOSED' || booking.status !== 'IN_PROGRESS') return null;
  const amount = extra.amount ? formatINR(extra.amount) : '';

  const answer = (d: 'APPROVED' | 'DECLINED') =>
    decide.mutate(d, { onSuccess: () => toast.success(d === 'APPROVED' ? 'Extra charge approved' : 'Extra charge declined'), onError: (e) => toast.error(e.message) });

  return (
    <Banner tone="warn" title={staff ? 'Extra charge waiting for the customer' : 'The technician needs your approval'}>
      <View style={{ gap: 10 }}>
        <Text variant="bodyMedium"><Text style={{ fontWeight: '800' }}>{amount} extra</Text>: {extra.reason}</Text>
        <Text variant="bodySmall">
          {staff
            ? "If the customer told you their answer by phone, record it here. It is saved with your name."
            : `Visit charge ${formatINR(booking.service.basePrice)} + extra ${amount}. The extra work only starts if you approve.`}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button mode="contained" icon="check" onPress={() => answer('APPROVED')} loading={decide.isPending} disabled={decide.isPending} style={{ flex: 1 }}>Approve</Button>
          <Button mode="outlined" icon="close" onPress={() => answer('DECLINED')} disabled={decide.isPending} style={{ flex: 1 }}>Decline</Button>
        </View>
      </View>
    </Banner>
  );
}

// What the technician found and did, and what it costs.
export function VisitSummary({ visit }: { visit: Visit }) {
  const rows: [string, string][] = [
    ['Diagnosis', visit.diagnosis],
    ['Work performed', visit.workPerformed],
    ['Parts used', visit.partsNote],
    ['Result', visit.result],
    ['Notes', visit.notes],
  ].filter((r): r is [string, string] => Boolean(r[1]));
  const extra = visit.extraCharge;
  if (extra.status !== 'NONE' && extra.amount) {
    rows.push(['Extra charge', `${formatINR(extra.amount)} · ${extra.status.toLowerCase()}${extra.reason ? ` (${extra.reason})` : ''}`]);
  }
  if (rows.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>Visit report</SectionTitle>
      <InfoRows rows={[...rows, ['Total', formatINR(visit.finalAmount)]]} />
    </View>
  );
}

const METHOD_LABEL = { CASH: 'cash', UPI: 'UPI', CARD: 'card', ONLINE: 'online' };

// Payment for a completed visit. The amount comes from the API (price + approved extra charge); we only record HOW it was paid.
export function PaymentSection({ booking, canRecord, receiptHref }: { booking: BookingDetail; canRecord: boolean; receiptHref: string }) {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();
  const record = useRecordPayment(booking.id);
  const [method, setMethod] = useState<'CASH' | 'UPI'>('CASH');
  const [reference, setReference] = useState('');
  if (booking.status !== 'COMPLETED') return null;
  const due = formatINR(booking.visit?.finalAmount ?? booking.service.basePrice);

  if (booking.payment) {
    const p = booking.payment;
    return (
      <View style={{ gap: 8 }}>
        <SectionTitle>Payment</SectionTitle>
        <Card style={{ gap: 10 }}>
          <Text variant="titleMedium" style={{ fontWeight: '800', color: '#16a34a' }}>Paid {formatINR(p.amount)} by {METHOD_LABEL[p.method]}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {p.paidAt && `${formatDate(p.paidAt)}, ${formatTime(p.paidAt)}`}{p.reference && ` · Ref ${p.reference}`}{p.recordedBy && ` · Recorded by ${p.recordedBy}`}
          </Text>
          <Button mode="contained-tonal" icon="receipt-text-outline" onPress={() => router.push(receiptHref)}>View receipt{p.receiptNumber ? ` (${p.receiptNumber})` : ''}</Button>
        </Card>
      </View>
    );
  }

  if (!canRecord) {
    return (
      <View style={{ gap: 8 }}>
        <SectionTitle>Payment</SectionTitle>
        <Banner tone="info" icon="cash"><Text variant="bodyMedium"><Text style={{ fontWeight: '800' }}>{due} to pay.</Text> You can pay the technician in cash or by UPI. A receipt appears here once it is recorded.</Text></Banner>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <SectionTitle>Collect payment</SectionTitle>
      <Card>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Amount to collect</Text>
        <Text variant="displaySmall" style={{ fontWeight: '800' }}>{due}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Visit charge{booking.visit?.extraCharge.status === 'APPROVED' ? ' + approved extra charge' : ''}.</Text>
      </Card>
      <PillGroup value={method} onChange={(v) => setMethod(v as 'CASH' | 'UPI')} options={[{ value: 'CASH', label: '💵 Cash' }, { value: 'UPI', label: '📱 UPI' }]} />
      {method === 'UPI' && <TextInput mode="outlined" label="UPI transaction ID (optional)" value={reference} onChangeText={setReference} maxLength={100} />}
      <SubmitButton
        icon="check-circle-outline"
        pending={record.isPending}
        onPress={() =>
          record.mutate({ method, reference: method === 'UPI' ? reference.trim() || undefined : undefined }, {
            onSuccess: (p) => toast.success(`Payment recorded. Receipt ${p.receiptNumber}`),
            onError: (e) => toast.error(e.message),
          })
        }
      >
        Payment received
      </SubmitButton>
    </View>
  );
}

const WORDS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function ReviewForm({ bookingId }: { bookingId: string }) {
  const toast = useToast();
  const theme = useTheme();
  const create = useCreateReview(bookingId);
  const form = useForm<ReviewValues>({ resolver: zodResolver(reviewSchema), mode: 'onTouched', defaultValues: { comment: '' } });
  const submit = form.handleSubmit((v) =>
    create.mutateAsync({ rating: v.rating, comment: v.comment || undefined }).then(
      () => toast.success('Thanks for your review'),
      (err) => showApiError(form, err),
    ),
  );
  return (
    <Card style={{ gap: 12 }}>
      <FormAlert message={form.formState.errors.root?.server?.message} />
      <Controller
        control={form.control}
        name="rating"
        render={({ field, fieldState }) => (
          <View style={{ gap: 6 }}>
            <Text variant="titleSmall" style={{ fontWeight: '700' }}>How was the repair?</Text>
            <StarInput value={field.value} onChange={field.onChange} />
            {field.value > 0 && <Text style={{ color: theme.colors.onSurfaceVariant }}>{WORDS[field.value - 1]}</Text>}
            {fieldState.error && <Text style={{ color: theme.colors.error }}>{fieldState.error.message}</Text>}
          </View>
        )}
      />
      <TextField control={form.control} name="comment" label="Comment (optional)" multiline lines={3} maxLength={1000} />
      <SubmitButton onPress={submit} pending={create.isPending}>Submit review</SubmitButton>
    </Card>
  );
}

// After a completed repair: the customer rates it once; everyone else just sees the rating.
export function ReviewSection({ booking, canReview }: { booking: BookingDetail; canReview: boolean }) {
  if (booking.status !== 'COMPLETED') return null;
  if (booking.review) {
    const r = booking.review;
    return (
      <View style={{ gap: 8 }}>
        <SectionTitle>{canReview ? 'Your review' : 'Customer review'}</SectionTitle>
        <Card style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Stars rating={r.rating} />
            <Text variant="bodySmall" style={{ opacity: 0.6 }}>{formatDate(r.createdAt)}</Text>
          </View>
          {r.comment && <Text variant="bodyMedium">{r.comment}</Text>}
        </Card>
      </View>
    );
  }
  if (!canReview) return null;
  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>Rate this repair</SectionTitle>
      <ReviewForm bookingId={booking.id} />
    </View>
  );
}
