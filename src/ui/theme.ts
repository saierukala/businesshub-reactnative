import { MD3DarkTheme, MD3LightTheme, useTheme, type MD3Theme } from 'react-native-paper';
import type { BookingStatus } from '@/lib/types';

// ---------- Colour palettes (the website's sidebar palettes, lib/sidebar-themes.ts) ----------
// On the phone the "sidebar" colours become the top header, the bottom tab bar and the hero cards.
// brand = buttons and links in light mode; accent = highlights (chips, badges, progress); darkPrimary = buttons in dark mode.
export const PALETTES = [
  { id: 'navy', label: 'Navy', bar: '#232f57', onBar: '#f1f4f2', brand: '#232f57', accent: '#ee8888', darkPrimary: '#a9b8e6' },
  { id: 'khaki', label: 'Khaki', bar: '#d3d1b9', onBar: '#151f24', brand: '#151f24', accent: '#e82339', darkPrimary: '#d3d1b9' },
  { id: 'teal', label: 'Teal', bar: '#284e55', onBar: '#f2f3f3', brand: '#284e55', accent: '#a95641', darkPrimary: '#6fc3d1' },
  { id: 'snow', label: 'Snow', bar: '#fbfcfc', onBar: '#292c41', brand: '#2f7fc4', accent: '#8d746c', darkPrimary: '#6fb6ee' },
  { id: 'slate', label: 'Slate', bar: '#2e3f47', onBar: '#f4f1f1', brand: '#2e3f47', accent: '#716452', darkPrimary: '#a3c7e1' },
  { id: 'midnight', label: 'Midnight', bar: '#292c41', onBar: '#fefefe', brand: '#292c41', accent: '#ef6b41', darkPrimary: '#f4906d' },
  { id: 'dusk', label: 'Dusk', bar: '#373f55', onBar: '#f7f8f7', brand: '#373f55', accent: '#9d6759', darkPrimary: '#a2bad4' },
  { id: 'mist', label: 'Mist', bar: '#f9f9f9', onBar: '#28282a', brand: '#3c3a45', accent: '#bdbd61', darkPrimary: '#d6d68f' },
] as const;

export type PaletteId = (typeof PALETTES)[number]['id'];
export const DEFAULT_PALETTE: PaletteId = 'navy';
export const isPalette = (v: unknown): v is PaletteId => PALETTES.some((p) => p.id === v);

// ---------- Small colour helpers ----------
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
/** a blended toward b by t (0 = a, 1 = b). */
export const mix = (a: string, b: string, t: number) => toHex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
/** The same colour with an alpha (hex 00-ff) for tints: alpha('#2563eb', 0.12). */
export const alpha = (hex: string, a: number) => hex + Math.round(a * 255).toString(16).padStart(2, '0');
const isDark = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b < 150;
};

// ---------- The app theme: Paper's Material 3 theme plus our own colours ----------
export type AppColors = {
  bar: string; // header and tab bar
  onBar: string;
  barDark: boolean; // light status bar icons on a dark bar
  accent: string;
  onAccent: string;
  gradient: [string, string]; // hero cards
  onGradient: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  star: string;
  chart: string[];
  shadow: string;
};
export type AppTheme = MD3Theme & { app: AppColors };
export const useAppTheme = () => useTheme<AppTheme>();

export function buildTheme(id: PaletteId, dark: boolean): AppTheme {
  const p = PALETTES.find((x) => x.id === id) ?? PALETTES[0];
  const tones = dark
    ? { success: '#4ade80', warning: '#fbbf24', danger: '#f87171', info: '#60a5fa', star: '#fbbf24' }
    : { success: '#16a34a', warning: '#d97706', danger: '#dc2626', info: '#2563eb', star: '#f59e0b' };

  if (!dark) {
    const bar = p.bar;
    return {
      ...MD3LightTheme,
      roundness: 3,
      colors: {
        ...MD3LightTheme.colors,
        primary: p.brand,
        onPrimary: '#ffffff',
        primaryContainer: mix(p.brand, '#ffffff', 0.86),
        onPrimaryContainer: mix(p.brand, '#000000', 0.15),
        secondary: p.accent,
        onSecondary: isDark(p.accent) ? '#ffffff' : '#151515',
        secondaryContainer: mix(p.accent, '#ffffff', 0.8),
        onSecondaryContainer: mix(p.accent, '#000000', 0.55),
        tertiary: p.accent,
        background: mix(p.brand, '#ffffff', 0.955),
        surface: '#ffffff',
        surfaceVariant: mix(p.brand, '#ffffff', 0.92),
        onSurface: '#161a23',
        onSurfaceVariant: mix('#5b6478', p.brand, 0.25),
        outline: mix(p.brand, '#ffffff', 0.7),
        outlineVariant: mix(p.brand, '#ffffff', 0.88),
        error: tones.danger,
        elevation: { ...MD3LightTheme.colors.elevation, level1: '#ffffff', level2: mix(p.brand, '#ffffff', 0.96), level3: mix(p.brand, '#ffffff', 0.94) },
      },
      app: {
        bar,
        onBar: p.onBar,
        barDark: isDark(bar),
        accent: p.accent,
        onAccent: isDark(p.accent) ? '#ffffff' : '#151515',
        gradient: [p.brand, mix(p.brand, p.accent, 0.55)],
        onGradient: '#ffffff',
        ...tones,
        chart: [p.brand, p.accent, mix(p.brand, '#ffffff', 0.45), tones.success, tones.warning],
        shadow: mix(p.brand, '#000000', 0.4),
      },
    };
  }

  // Dark: a light bar (Khaki, Snow, Mist) turns into its dark text colour, like the website's dark mode.
  const base = isDark(p.bar) ? p.bar : p.onBar;
  const bar = mix(base, '#000000', 0.3);
  return {
    ...MD3DarkTheme,
    roundness: 3,
    colors: {
      ...MD3DarkTheme.colors,
      primary: p.darkPrimary,
      onPrimary: mix(p.darkPrimary, '#000000', 0.82),
      primaryContainer: mix(p.darkPrimary, '#0b0c10', 0.68),
      onPrimaryContainer: mix(p.darkPrimary, '#ffffff', 0.6),
      secondary: mix(p.accent, '#ffffff', 0.2),
      onSecondary: '#151515',
      secondaryContainer: mix(p.accent, '#0b0c10', 0.65),
      onSecondaryContainer: mix(p.accent, '#ffffff', 0.6),
      tertiary: mix(p.accent, '#ffffff', 0.2),
      background: mix(base, '#08090c', 0.78),
      surface: mix(base, '#111318', 0.72),
      surfaceVariant: mix(base, '#1b1e26', 0.6),
      onSurface: '#eef0f4',
      onSurfaceVariant: mix('#a7afc2', p.darkPrimary, 0.15),
      outline: mix(base, '#6b7280', 0.6),
      outlineVariant: mix(base, '#2a2f3b', 0.55),
      error: tones.danger,
      elevation: { ...MD3DarkTheme.colors.elevation, level1: mix(base, '#111318', 0.72), level2: mix(base, '#181b22', 0.65), level3: mix(base, '#1d212a', 0.6) },
    },
    app: {
      bar,
      onBar: isDark(p.bar) ? p.onBar : p.bar,
      barDark: true,
      accent: mix(p.accent, '#ffffff', 0.15),
      onAccent: '#151515',
      gradient: [mix(base, '#000000', 0.1), mix(base, p.accent, 0.45)],
      onGradient: '#ffffff',
      ...tones,
      chart: [p.darkPrimary, mix(p.accent, '#ffffff', 0.15), mix(p.darkPrimary, '#000000', 0.35), tones.success, tones.warning],
      shadow: '#000000',
    },
  };
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

// Status colours: readable on both themes, always paired with a text label and an icon (never colour alone).
// Confirmed blue, on its way sky/teal, in progress amber, completed green, cancelled red.
export const statusMeta: Record<BookingStatus, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Pending', color: '#6b7280', icon: 'clock-outline' },
  CONFIRMED: { label: 'Confirmed', color: '#2563eb', icon: 'calendar-check' },
  ASSIGNED: { label: 'Assigned', color: '#4f46e5', icon: 'account-check' },
  EN_ROUTE: { label: 'On the way', color: '#0284c7', icon: 'motorbike' },
  ARRIVED: { label: 'Arrived', color: '#0d9488', icon: 'map-marker-check' },
  IN_PROGRESS: { label: 'In progress', color: '#d97706', icon: 'tools' },
  COMPLETED: { label: 'Completed', color: '#16a34a', icon: 'check-circle' },
  CANCELLED: { label: 'Cancelled', color: '#dc2626', icon: 'close-circle' },
  NO_SHOW: { label: 'No-show', color: '#b91c1c', icon: 'account-off' },
};
