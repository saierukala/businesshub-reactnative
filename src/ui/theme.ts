import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import type { BookingStatus } from '@/lib/types';

// One blue brand colour, soft surfaces, rounded corners. Paper (Material 3) does the rest.
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563eb',
    onPrimary: '#ffffff',
    primaryContainer: '#dbeafe',
    onPrimaryContainer: '#1e3a8a',
    secondary: '#0f766e',
    secondaryContainer: '#ccfbf1',
    onSecondaryContainer: '#134e4a',
    background: '#f4f6fb',
    surface: '#ffffff',
    surfaceVariant: '#eef1f8',
    onSurfaceVariant: '#5b6478',
    outline: '#c7cdda',
    outlineVariant: '#e3e7f0',
    error: '#dc2626',
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 3,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6ea0ff',
    onPrimary: '#0b1b44',
    primaryContainer: '#1e3a8a',
    onPrimaryContainer: '#dbeafe',
    secondary: '#5eead4',
    secondaryContainer: '#134e4a',
    onSecondaryContainer: '#ccfbf1',
    background: '#0f1320',
    surface: '#171c2c',
    surfaceVariant: '#202638',
    onSurfaceVariant: '#a7afc2',
    outline: '#3a4258',
    outlineVariant: '#2a3147',
    error: '#f87171',
  },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

// Status colours: readable on both themes, always paired with a text label and an icon (never colour alone).
export const statusMeta: Record<BookingStatus, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Pending', color: '#6b7280', icon: 'clock-outline' },
  CONFIRMED: { label: 'Confirmed', color: '#2563eb', icon: 'calendar-check' },
  ASSIGNED: { label: 'Assigned', color: '#0891b2', icon: 'account-check' },
  EN_ROUTE: { label: 'On the way', color: '#d97706', icon: 'motorbike' },
  ARRIVED: { label: 'Arrived', color: '#d97706', icon: 'map-marker-check' },
  IN_PROGRESS: { label: 'In progress', color: '#7c3aed', icon: 'tools' },
  COMPLETED: { label: 'Completed', color: '#16a34a', icon: 'check-circle' },
  CANCELLED: { label: 'Cancelled', color: '#dc2626', icon: 'close-circle' },
  NO_SHOW: { label: 'No-show', color: '#b91c1c', icon: 'account-off' },
};
