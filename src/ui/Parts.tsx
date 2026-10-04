import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors, s, statusColor } from './theme';
import type { Status } from '../lib/types';

export function Button({ title, onPress, busy, outline }: { title: string; onPress: () => void; busy?: boolean; outline?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={[s.button, outline && { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary }, busy && { opacity: 0.6 }]}
    >
      {busy ? (
        <ActivityIndicator color={outline ? colors.primary : '#fff'} />
      ) : (
        <Text style={[s.buttonText, outline && { color: colors.primary }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return <Text style={{ color: statusColor[status], fontWeight: '700', fontSize: 12 }}>{status.replace('_', ' ')}</Text>;
}

// Loading / error / retry in one place, so each screen stays small.
export function QueryState({ loading, error, onRetry }: { loading: boolean; error: Error | null; onRetry: () => void }) {
  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!error) return null;
  return (
    <View style={[s.pad, { alignItems: 'center' }]}>
      <Text style={s.error}>{error.message}</Text>
      <Button title="Retry" onPress={onRetry} />
    </View>
  );
}
