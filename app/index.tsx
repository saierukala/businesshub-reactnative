import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../src/lib/api';
import { useAuth } from '../src/lib/auth';
import { time } from '../src/lib/format';
import type { Appointment } from '../src/lib/types';
import { Button, QueryState, StatusBadge } from '../src/ui/Parts';
import { s } from '../src/ui/theme';

type Dashboard = { appointments: Appointment[]; counts: { total: number; done: number; remaining: number } };

export default function Today() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const q = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/dashboard/technician') });

  return (
    <View style={s.screen}>
      <QueryState loading={q.isLoading} error={q.error} onRetry={q.refetch} />
      {q.data && (
        <FlatList
          contentContainerStyle={s.pad}
          data={q.data.appointments}
          keyExtractor={(a) => a.id}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} />}
          ListHeaderComponent={
            <Text style={s.muted}>
              Hi {user?.name}. {q.data.counts.done} done, {q.data.counts.remaining} remaining.
            </Text>
          }
          ListEmptyComponent={<Text style={s.muted}>No visits today.</Text>}
          ListFooterComponent={<Button title="Log out" onPress={logout} outline />}
          renderItem={({ item: a }) => (
            <Pressable style={s.card} onPress={() => router.push(`/visit/${a.id}`)}>
              <Text style={s.bold}>{time(a.startAt)} · {a.service.name}</Text>
              <Text>{a.customer.name} · {a.address.area}</Text>
              <StatusBadge status={a.status} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
