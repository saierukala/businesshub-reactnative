import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type Mode = 'light' | 'dark' | 'system';

// Light / dark / follow the phone. Saved on this device only (like the web saves it per browser), not on the account.
const KEY = 'appearance';
const web = Platform.OS === 'web';
const load = async () => (web ? localStorage.getItem(KEY) : SecureStore.getItemAsync(KEY));
const save = async (m: Mode) => (web ? localStorage.setItem(KEY, m) : SecureStore.setItemAsync(KEY, m));
const isMode = (v: unknown): v is Mode => v === 'light' || v === 'dark' || v === 'system';

const Ctx = createContext<{ mode: Mode; dark: boolean; setMode: (m: Mode) => void } | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Mode>('system');

  useEffect(() => {
    load().then((v) => isMode(v) && setModeState(v)).catch(() => {});
  }, []);

  const setMode = (m: Mode) => {
    setModeState(m);
    save(m).catch(() => {}); // if saving fails, the choice still works until the app closes
  };
  const dark = mode === 'system' ? system === 'dark' : mode === 'dark';
  return <Ctx.Provider value={{ mode, dark, setMode }}>{children}</Ctx.Provider>;
}

export function useAppearance() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppearance must be used inside AppearanceProvider');
  return v;
}
