import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Portal, Snackbar, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// A small message at the bottom: toast.success("Saved"), toast.error(err.message).
type Toast = { success: (m: string) => void; error: (m: string) => void };
const Ctx = createContext<Toast>({ success: () => {}, error: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // `key` changes for every message, so the Portal mounts fresh and lands ON TOP of any open sheet or dialog
  // (Paper stacks portals in the order they mount).
  const [msg, setMsg] = useState<{ text: string; kind: 'success' | 'error'; key: number } | null>(null);
  const show = useCallback((kind: 'success' | 'error') => (text: string) => setMsg({ text, kind, key: Date.now() }), []);
  const value = useMemo(() => ({ success: show('success'), error: show('error') }), [show]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {msg && (
        <Portal key={msg.key}>
          <Snackbar
            visible
            onDismiss={() => setMsg(null)}
            duration={msg.kind === 'error' ? 6000 : 3500}
            action={{ label: 'OK', onPress: () => setMsg(null) }}
            // Above the bottom tab bar and the phone's own navigation bar.
            wrapperStyle={{ bottom: insets.bottom + 64 }}
            style={{ backgroundColor: msg.kind === 'error' ? theme.colors.error : '#166534' }}
            theme={{ colors: { inversePrimary: '#fff', inverseOnSurface: '#fff' } }}
            icon={msg.kind === 'error' ? 'alert-circle' : 'check-circle'}
            onIconPress={() => setMsg(null)}
          >
            {msg.text}
          </Snackbar>
        </Portal>
      )}
    </Ctx.Provider>
  );
}
