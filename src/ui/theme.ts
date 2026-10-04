import { StyleSheet } from 'react-native';
import type { Status } from '../lib/types';

export const colors = { bg: '#f5f6f8', card: '#fff', text: '#111827', muted: '#6b7280', primary: '#2563eb', danger: '#dc2626', border: '#e5e7eb' };

export const statusColor: Record<Status, string> = {
  PENDING: '#6b7280', CONFIRMED: '#6b7280', ASSIGNED: '#2563eb', EN_ROUTE: '#d97706', ARRIVED: '#d97706',
  IN_PROGRESS: '#7c3aed', COMPLETED: '#16a34a', CANCELLED: '#dc2626', NO_SHOW: '#dc2626',
};

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 16, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, gap: 4, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  bold: { fontWeight: '600', color: colors.text, fontSize: 16 },
  muted: { color: colors.muted },
  label: { fontWeight: '600', color: colors.text, marginTop: 8 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: colors.danger },
});
