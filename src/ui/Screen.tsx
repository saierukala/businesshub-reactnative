import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  top?: boolean; // add top safe-area padding (only for screens without a header)
  onRefresh?: () => void;
  refreshing?: boolean;
  footer?: ReactNode; // sticky bar at the bottom, e.g. the main action button
  contentStyle?: StyleProp<ViewStyle>;
};

// The standard page: themed background, safe areas, keyboard handling, pull-to-refresh and an optional sticky footer.
export function Screen({ children, scroll = true, top, onRefresh, refreshing = false, footer, contentStyle }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingTop: top ? insets.top + 16 : 16, paddingBottom: footer ? 16 : insets.bottom + 24 }, contentStyle]}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, contentStyle]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView style={[styles.fill, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {body}
      {footer && (
        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant, paddingBottom: insets.bottom + 12 }]}>
          {footer}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16, flexGrow: 1 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
});
