import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_PALETTE, isPalette, type PaletteId } from '@/ui/theme';

export type Mode = 'light' | 'dark' | 'system';

// Light / dark / follow the phone, and the app colour (palette). Saved on this device only
// (like the website saves them per browser), not on the account.
const MODE_KEY = 'appearance';
const PALETTE_KEY = 'palette';
const web = Platform.OS === 'web';
const load = async (key: string) => (web ? localStorage.getItem(key) : SecureStore.getItemAsync(key));
const save = async (key: string, v: string) => (web ? localStorage.setItem(key, v) : SecureStore.setItemAsync(key, v));
const isMode = (v: unknown): v is Mode => v === 'light' || v === 'dark' || v === 'system';

type Appearance = { mode: Mode; dark: boolean; setMode: (m: Mode) => void; palette: PaletteId; setPalette: (p: PaletteId) => void };
const Ctx = createContext<Appearance | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Mode>('system');
  const [palette, setPaletteState] = useState<PaletteId>(DEFAULT_PALETTE);

  useEffect(() => {
    load(MODE_KEY).then((v) => isMode(v) && setModeState(v)).catch(() => {});
    load(PALETTE_KEY).then((v) => isPalette(v) && setPaletteState(v)).catch(() => {});
  }, []);

  // If saving fails, the choice still works until the app closes.
  const setMode = (m: Mode) => {
    setModeState(m);
    save(MODE_KEY, m).catch(() => {});
  };
  const setPalette = (p: PaletteId) => {
    setPaletteState(p);
    save(PALETTE_KEY, p).catch(() => {});
  };
  const dark = mode === 'system' ? system === 'dark' : mode === 'dark';
  return <Ctx.Provider value={{ mode, dark, setMode, palette, setPalette }}>{children}</Ctx.Provider>;
}

export function useAppearance() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppearance must be used inside AppearanceProvider');
  return v;
}
