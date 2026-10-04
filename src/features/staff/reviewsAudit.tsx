import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Chip, Text, useTheme } from 'react-native-paper';
import { formatDate, formatTime } from '@/lib/format';
import { useInfiniteList } from '@/lib/infinite';
import { useAuditActions, type AuditEntry } from '@/lib/queries/audit';
import type { ReviewRow } from '@/lib/queries/reviews';
import { PillGroup } from '@/ui/Form';
import { Card, InfiniteList, Stars } from '@/ui/Parts';

const RATINGS = [{ value: '', label: 'All' }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} ★` }))];

// What customers said about completed repairs, with the average.
export function ReviewsList() {
  const theme = useTheme();
  const router = useRouter();
  const [rating, setRating] = useState('');
  const list = useInfiniteList<ReviewRow>('reviews', '/reviews', { rating: rating || undefined });
  const average = (list.data?.pages[0] as { average?: number | null } | undefined)?.average;
  return (
    <InfiniteList
      query={list}
      emptyIcon="star-outline"
      emptyTitle="No reviews yet"
      emptyDescription={rating ? 'No reviews with this rating.' : 'Reviews appear after customers rate a completed repair.'}
      header={
        <View style={{ gap: 12 }}>
          {average != null && (
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text variant="displaySmall" style={{ fontWeight: '800' }}>{average.toFixed(1)}</Text>
              <View><Stars rating={Math.round(average)} size={22} /><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>average rating</Text></View>
            </Card>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}><PillGroup options={RATINGS} value={rating} onChange={setRating} /></ScrollView>
        </View>
      }
      renderItem={(r) => (
        <Card onPress={() => router.push(`/staff/bookings/${r.booking.id}`)} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stars rating={r.rating} />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{formatDate(r.createdAt)}</Text>
          </View>
          {r.comment && <Text variant="bodyMedium">{r.comment}</Text>}
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{r.booking.service} · {r.booking.bookingNumber}{r.customer ? ` · ${r.customer}` : ''}{r.technician ? ` · ${r.technician.name}` : ''}</Text>
        </Card>
      )}
    />
  );
}

// Owner only: who did what, and when. Every booking change and every staff override is here.
export function AuditList() {
  const theme = useTheme();
  const [action, setAction] = useState('');
  const actions = useAuditActions();
  const list = useInfiniteList<AuditEntry>('audit', '/audit-logs', { action: action || undefined });
  return (
    <InfiniteList
      query={list}
      emptyIcon="clipboard-text-clock-outline"
      emptyTitle="Nothing logged here"
      emptyDescription="Try another action filter."
      header={
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
          <Chip selected={action === ''} onPress={() => setAction('')}>All</Chip>
          {(actions.data ?? []).map((a) => <Chip key={a} selected={action === a} onPress={() => setAction(a)}>{a}</Chip>)}
        </ScrollView>
      }
      renderItem={(e) => (
        <Card style={{ gap: 3 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Text variant="titleSmall" style={{ fontWeight: '700', flex: 1 }}>{e.action}</Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{formatDate(e.createdAt)}, {formatTime(e.createdAt)}</Text>
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{e.user ? `${e.user.name} (${e.user.role})` : 'System'} · {e.entityType}</Text>
          {e.metadata && Object.keys(e.metadata).length > 0 && (
            <Text variant="bodySmall" style={{ fontFamily: undefined }} numberOfLines={4}>{Object.entries(e.metadata).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join('\n')}</Text>
          )}
        </Card>
      )}
    />
  );
}
