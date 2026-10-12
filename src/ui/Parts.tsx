import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, FlatList, Pressable, RefreshControl, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ActivityIndicator, Button, Dialog, Icon, Portal, Text, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import type { UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import type { BookingStatus, Page } from '@/lib/types';
import { alpha, statusMeta, useAppTheme } from './theme';

// ---------- Layout bits ----------

// A soft, rounded surface with a light shadow. Tappable cards shrink a little while pressed.
export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const theme = useAppTheme();
  const base: StyleProp<ViewStyle> = [
    styles.card,
    { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, boxShadow: `0 2px 12px ${alpha(theme.app.shadow, theme.dark ? 0.35 : 0.07)}` },
    style,
  ];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && styles.pressed]} accessibilityRole="button">
      {children}
    </Pressable>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  const theme = useAppTheme();
  return (
    <View style={styles.sectionTitle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: theme.app.accent }} />
        <Text variant="titleMedium" style={{ fontWeight: '800', flexShrink: 1 }}>{children}</Text>
      </View>
      {action}
    </View>
  );
}

// "Label ......... value" rows inside a card.
export function InfoRows({ rows }: { rows: [string, ReactNode][] }) {
  const theme = useTheme();
  return (
    <Card style={{ padding: 0 }}>
      {rows.map(([k, v], i) => (
        <View key={k} style={[styles.infoRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant }]}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>{k}</Text>
          {typeof v === 'string' ? <Text variant="bodyLarge" style={{ fontWeight: '500' }}>{v}</Text> : v}
        </View>
      ))}
    </Card>
  );
}

// One bold number with a tinted icon. tone colours the whole card lightly.
export function StatCard({ label, value, icon, tone }: { label: string; value: string | number; icon: string; tone?: string }) {
  const theme = useTheme();
  const color = tone ?? theme.colors.primary;
  return (
    <Card style={[styles.stat, { backgroundColor: theme.dark ? alpha(color, 0.12) : alpha(color, 0.07), borderColor: alpha(color, 0.25) }]}>
      <View style={[styles.statIcon, { backgroundColor: alpha(color, 0.18) }]}>
        <Icon source={icon} size={20} color={color} />
      </View>
      <Text variant="headlineMedium" style={{ fontWeight: '800' }}>{value}</Text>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
    </Card>
  );
}

// A gradient card in the palette's colours, for the top of a screen (greeting, today, totals).
export function Hero({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useAppTheme();
  return (
    <LinearGradient
      colors={theme.app.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { boxShadow: `0 8px 24px ${alpha(theme.app.gradient[0], theme.dark ? 0.5 : 0.3)}` }, style]}
    >
      {children}
    </LinearGradient>
  );
}

// ---------- Small display components ----------

export function StatusChip({ status, small }: { status: BookingStatus; small?: boolean }) {
  const m = statusMeta[status];
  return (
    <View style={[styles.chip, { backgroundColor: m.color + '1f' }, small && { paddingVertical: 2 }]}>
      <Icon source={m.icon} size={small ? 12 : 14} color={m.color} />
      <Text style={{ color: m.color, fontWeight: '700', fontSize: small ? 11 : 12 }}>{m.label}</Text>
    </View>
  );
}

export function Stars({ rating, size = 18 }: { rating: number; size?: number }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: 'row' }} accessibilityLabel={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} source={n <= rating ? 'star' : 'star-outline'} size={size} color={n <= rating ? theme.app.star : theme.colors.outline} />
      ))}
    </View>
  );
}

export function StarInput({ value, onChange }: { value?: number; onChange: (n: number) => void }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}>
          <Icon source={value && n <= value ? 'star' : 'star-outline'} size={38} color={value && n <= value ? theme.app.star : theme.colors.outline} />
        </Pressable>
      ))}
    </View>
  );
}

// A coloured notice with an icon: warnings, info, errors.
export function Banner({ tone = 'info', icon, title, children }: { tone?: 'info' | 'warn' | 'error' | 'success'; icon?: string; title?: string; children?: ReactNode }) {
  const theme = useAppTheme();
  const color = { info: theme.app.info, warn: theme.app.warning, error: theme.app.danger, success: theme.app.success }[tone];
  return (
    <View style={[styles.banner, { backgroundColor: alpha(color, theme.dark ? 0.14 : 0.08), borderColor: alpha(color, 0.35) }]}>
      <Icon source={icon ?? { info: 'information', warn: 'alert', error: 'alert-circle', success: 'check-circle' }[tone]} size={22} color={color} />
      <View style={{ flex: 1, gap: 2 }}>
        {title && <Text variant="titleSmall" style={{ fontWeight: '700' }}>{title}</Text>}
        {typeof children === 'string' ? <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>{children}</Text> : children}
      </View>
    </View>
  );
}

// A small non-interactive label (use inside tappable cards, where a Chip would be a button inside a button).
export function Tag({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>{children}</Text>
    </View>
  );
}

// ---------- Loading / empty / error ----------

function Pulse({ style }: { style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const v = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }), Animated.timing(v, { toValue: 0.5, duration: 700, useNativeDriver: true })]));
    a.start();
    return () => a.stop();
  }, [v]);
  return <Animated.View style={[{ backgroundColor: theme.colors.surfaceVariant, opacity: v, borderRadius: 8 }, style]} />;
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View style={{ gap: 12 }} accessibilityLabel="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Card key={i} style={{ gap: 10 }}>
          <Pulse style={{ height: 16, width: '55%' }} />
          <Pulse style={{ height: 12, width: '85%' }} />
          <Pulse style={{ height: 12, width: '40%' }} />
        </Card>
      ))}
    </View>
  );
}

export function EmptyState({ title, description, icon = 'inbox-outline', action }: { title: string; description?: string; icon?: string; action?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primaryContainer }]}>
        <Icon source={icon} size={34} color={theme.colors.primary} />
      </View>
      <Text variant="titleMedium" style={{ fontWeight: '700', textAlign: 'center' }}>{title}</Text>
      {description && <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>{description}</Text>}
      {action}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof ApiError || error instanceof Error ? error.message : 'Something went wrong.';
  return (
    <EmptyState
      icon="cloud-alert-outline"
      title="Couldn't load this"
      description={message}
      action={onRetry && <Button mode="contained-tonal" icon="refresh" onPress={onRetry}>Try again</Button>}
    />
  );
}

// Shows skeleton / error for a useQuery result and renders children once data is there.
export function QueryBoundary<T>({ query, children, rows }: { query: { isPending: boolean; isError: boolean; error: unknown; data: T | undefined; refetch: () => unknown }; children: (data: T) => ReactNode; rows?: number }) {
  if (query.isPending) return <ListSkeleton rows={rows} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return <>{children(query.data as T)}</>;
}

// ---------- Infinite list (pull to refresh, load more on scroll) ----------

type Props<T> = {
  query: UseInfiniteQueryResult<InfiniteData<Page<T>>, Error>;
  renderItem: (item: T) => ReactNode;
  header?: ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon?: string;
};

export function InfiniteList<T extends { id: string }>({ query, renderItem, header, emptyTitle, emptyDescription, emptyIcon }: Props<T>) {
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
      renderItem={({ item }) => <>{renderItem(item)}</>}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          {header}
          {query.isSuccess && items.length > 0 && <Text variant="labelMedium" style={{ opacity: 0.6 }}>{total} {total === 1 ? 'result' : 'results'}</Text>}
        </View>
      }
      ListEmptyComponent={
        query.isPending ? <ListSkeleton /> : query.isError ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
      }
      ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={{ margin: 16 }} /> : null}
      onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
      onEndReachedThreshold={0.4}
      refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => query.refetch()} />}
      keyboardShouldPersistTaps="handled"
    />
  );
}

// ---------- Dialogs ----------

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  destructive,
  busy,
  onConfirm,
  onDismiss,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={busy ? undefined : onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={busy}>Keep</Button>
          <Button onPress={onConfirm} loading={busy} disabled={busy} textColor={destructive ? theme.colors.error : undefined}>
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 6 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  hero: { borderRadius: 24, padding: 20, gap: 12, overflow: 'hidden' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  infoRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 2 },
  stat: { flex: 1, gap: 4, minWidth: 140 },
  statIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  banner: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'flex-start' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
