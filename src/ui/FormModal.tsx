import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// A full-screen sheet for forms and pickers (reschedule, assign, add address...). Built on Paper's Modal so dropdowns
// and dialogs opened from inside it appear on top. `children` is remounted each time it opens (fresh fields, no old error).
export function FormModal({ visible, title, subtitle, onClose, busy, children }: { visible: boolean; title: string; subtitle?: string; onClose: () => void; busy?: boolean; children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Portal>
      <Modal visible={visible} onDismiss={busy ? undefined : onClose} dismissable={!busy} style={styles.modal} contentContainerStyle={[styles.sheet, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={{ fontWeight: '700' }} numberOfLines={1}>{title}</Text>
            {subtitle && <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={2}>{subtitle}</Text>}
          </View>
          <IconButton icon="close" onPress={onClose} disabled={busy} accessibilityLabel="Close" />
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}>
            {visible ? children : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: { margin: 0, justifyContent: 'flex-start' },
  sheet: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
});
