import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Snackbar, useTheme } from 'react-native-paper';

// A small message at the bottom: toast.success("Saved"), toast.error(err.message).
type Toast = { success: (m: string) => void; error: (m: string) => void };
const Ctx = createContext<Toast>({ success: () => {}, error: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const [msg, setMsg] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);
  const show = useCallback((kind: 'success' | 'error') => (text: string) => setMsg({ text, kind }), []);
  const value = useMemo(() => ({ success: show('success'), error: show('error') }), [show]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <Snackbar
        visible={msg !== null}
        onDismiss={() => setMsg(null)}
        duration={msg?.kind === 'error' ? 6000 : 3000}
        action={{ label: 'OK', onPress: () => setMsg(null) }}
        style={{ backgroundColor: msg?.kind === 'error' ? theme.colors.error : '#166534' }}
        theme={{ colors: { inversePrimary: '#fff', inverseOnSurface: '#fff' } }}
      >
        {msg?.text}
      </Snackbar>
    </Ctx.Provider>
  );
}
