import { Share, View } from 'react-native';
import { Button, Divider, Icon, Text, useTheme } from 'react-native-paper';
import { formatDate, formatINR, formatPhone, formatTime } from '@/lib/format';
import { useReceipt } from '@/lib/queries/payments';
import { Card, ErrorState, ListSkeleton } from '@/ui/Parts';
import { Screen } from '@/ui/Screen';

// The receipt for a paid booking, with a Share button (WhatsApp, email, ...).
export function Receipt({ bookingId }: { bookingId: string }) {
  const theme = useTheme();
  const q = useReceipt(bookingId);
  if (q.isPending) return <Screen><ListSkeleton rows={3} /></Screen>;
  if (q.isError) return <Screen><ErrorState error={q.error} onRetry={() => q.refetch()} /></Screen>;
  const r = q.data;
  const muted = { color: theme.colors.onSurfaceVariant };

  const share = () =>
    Share.share({
      message: [`${r.business} receipt ${r.receiptNumber}`, `Booking ${r.bookingNumber}`, ...r.lines.map((l) => `${l.label}: ${formatINR(l.amount)}`), `Total paid: ${formatINR(r.total)} (${r.method.toLowerCase()})`].join('\n'),
    });

  return (
    <Screen footer={<Button mode="contained" icon="share-variant" onPress={share} contentStyle={{ height: 50 }}>Share receipt</Button>}>
      <Card style={{ gap: 14, padding: 20 }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Icon source="check-decagram" size={44} color="#16a34a" />
          <Text variant="titleLarge" style={{ fontWeight: '800' }}>Payment received</Text>
          <Text variant="displaySmall" style={{ fontWeight: '800' }}>{formatINR(r.total)}</Text>
          <Text variant="bodySmall" style={muted}>{r.method}{r.reference ? ` · Ref ${r.reference}` : ''}</Text>
        </View>
        <Divider />
        <Row k="Receipt no." v={r.receiptNumber} />
        <Row k="Paid on" v={`${formatDate(r.paidAt)}, ${formatTime(r.paidAt)}`} />
        <Row k="Booking" v={r.bookingNumber} />
        <Row k="Visit date" v={formatDate(r.visitDate)} />
        <Row k="Customer" v={`${r.customer.name}${r.customer.phone ? ` · ${formatPhone(r.customer.phone)}` : ''}`} />
        <Row k="Address" v={r.address} />
        {r.technician && <Row k="Technician" v={r.technician} />}
        <Divider />
        {r.lines.map((l) => (
          <View key={l.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="bodyMedium" style={{ flex: 1 }}>{l.label}</Text>
            <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{formatINR(l.amount)}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="titleMedium" style={{ fontWeight: '800' }}>Total</Text>
          <Text variant="titleMedium" style={{ fontWeight: '800' }}>{formatINR(r.total)}</Text>
        </View>
        <Text variant="bodySmall" style={[muted, { textAlign: 'center' }]}>{r.business}</Text>
      </Card>
    </Screen>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{k}</Text>
      <Text variant="bodyMedium" style={{ fontWeight: '500', flex: 1, textAlign: 'right' }}>{v}</Text>
    </View>
  );
}
