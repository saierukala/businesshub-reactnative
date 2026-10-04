import { useState } from 'react';
import { Alert, Linking, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { day, rupees, time } from '../../src/lib/format';
import type { BookingDetail, Status } from '../../src/lib/types';
import { Button, QueryState, StatusBadge } from '../../src/ui/Parts';
import { s } from '../../src/ui/theme';

// The next button to show. The server enforces the real rules (a wrong move returns 409),
// this only decides which button to draw.
const NEXT: Partial<Record<Status, 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS'>> = {
  ASSIGNED: 'EN_ROUTE',
  EN_ROUTE: 'ARRIVED',
  ARRIVED: 'IN_PROGRESS',
};
const NEXT_LABEL = { EN_ROUTE: 'Start travelling', ARRIVED: 'I have arrived', IN_PROGRESS: 'Start work' };

export default function VisitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const key = ['booking', id];
  const q = useQuery({ queryKey: key, queryFn: () => api<BookingDetail>(`/bookings/${id}`) });

  const [diagnosis, setDiagnosis] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [partsNote, setPartsNote] = useState('');

  // One helper for every action: call the API, show the server's message on error, refresh the screens.
  const act = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: unknown }) => api(`/bookings/${id}${path}`, { method: 'POST', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e: Error) => Alert.alert('Could not do that', e.message),
  });

  const b = q.data;
  const next = b && NEXT[b.status];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <QueryState loading={q.isLoading} error={q.error} onRetry={q.refetch} />
      {b && (
        <>
          <View style={s.card}>
            <Text style={s.title}>{b.service.name}</Text>
            <StatusBadge status={b.status} />
            <Text>{day(b.startAt)}, {time(b.startAt)} to {time(b.endAt)}</Text>
            <Text style={s.muted}>{b.bookingNumber}</Text>
          </View>

          <View style={s.card}>
            <Text style={s.bold}>{b.customer.name}</Text>
            <Text>{b.address.line1}, {b.address.area}, {b.address.city} {b.address.pincode}</Text>
            {b.appliance && <Text style={s.muted}>{b.appliance.category.name} {b.appliance.brand ?? ''} {b.appliance.model ?? ''}</Text>}
            <Text style={s.label}>Problem</Text>
            <Text>{b.problemDescription}</Text>
            {b.customer.phone && <Button title={`Call ${b.customer.phone}`} outline onPress={() => Linking.openURL(`tel:${b.customer.phone}`)} />}
          </View>

          {next && <Button title={NEXT_LABEL[next]} busy={act.isPending} onPress={() => act.mutate({ path: '/status', body: { to: next } })} />}

          {b.status === 'IN_PROGRESS' && (
            <View style={s.card}>
              <Text style={s.bold}>Complete the visit</Text>
              <Text style={s.label}>Diagnosis</Text>
              <TextInput style={[s.input, s.multiline]} multiline value={diagnosis} onChangeText={setDiagnosis} />
              <Text style={s.label}>Work performed</Text>
              <TextInput style={[s.input, s.multiline]} multiline value={workPerformed} onChangeText={setWorkPerformed} />
              <Text style={s.label}>Parts used (optional)</Text>
              <TextInput style={s.input} value={partsNote} onChangeText={setPartsNote} />
              <Button
                title="Mark completed"
                busy={act.isPending}
                onPress={() =>
                  act.mutate({ path: '/visit/complete', body: { diagnosis, workPerformed, ...(partsNote && { partsNote }) } })
                }
              />
            </View>
          )}

          {b.visit && (
            <View style={s.card}>
              <Text style={s.bold}>Visit report</Text>
              <Text>Diagnosis: {b.visit.diagnosis}</Text>
              <Text>Work: {b.visit.workPerformed}</Text>
              <Text style={s.bold}>Amount due: {rupees(b.visit.finalAmount)}</Text>
            </View>
          )}

          {b.status === 'COMPLETED' && !b.payment && (
            <View style={s.card}>
              <Text style={s.bold}>Collect payment</Text>
              <Text style={s.muted}>The server works out the amount.</Text>
              <Button title="Cash received" busy={act.isPending} onPress={() => act.mutate({ path: '/payment', body: { method: 'CASH' } })} />
              <Button title="Paid by UPI" outline busy={act.isPending} onPress={() => act.mutate({ path: '/payment', body: { method: 'UPI' } })} />
            </View>
          )}
          {b.payment && <Text style={s.bold}>Paid: {rupees(b.payment.amount)} by {b.payment.method}</Text>}
        </>
      )}
    </ScrollView>
  );
}
