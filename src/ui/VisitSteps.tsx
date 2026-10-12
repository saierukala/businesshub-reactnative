import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import type { BookingStatus } from '@/lib/types';
import { StatusChip } from './Parts';
import { alpha, useAppTheme } from './theme';

// Where the visit is, for the top of a booking or job (drawn on a Hero gradient): done steps are filled,
// the current one has an accent ring. A cancelled or no-show booking shows its status instead.
const STEPS: { status: BookingStatus; label: string; icon: string }[] = [
  { status: 'CONFIRMED', label: 'Booked', icon: 'calendar-check' },
  { status: 'ASSIGNED', label: 'Assigned', icon: 'account-check' },
  { status: 'EN_ROUTE', label: 'On way', icon: 'motorbike' },
  { status: 'ARRIVED', label: 'Arrived', icon: 'map-marker-check' },
  { status: 'IN_PROGRESS', label: 'Working', icon: 'tools' },
  { status: 'COMPLETED', label: 'Done', icon: 'check-bold' },
];

export function VisitSteps({ status }: { status: BookingStatus }) {
  const theme = useAppTheme();
  if (status === 'CANCELLED' || status === 'NO_SHOW') return <StatusChip status={status} />;
  const at = STEPS.findIndex((s) => s.status === status); // PENDING = -1: nothing done yet
  const on = theme.app.onGradient;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} accessibilityLabel={`Visit step: ${STEPS[at]?.label ?? 'waiting'}`}>
      {STEPS.map((s, i) => {
        const done = i <= at;
        return (
          <View key={s.status} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
              <View style={{ flex: 1, height: 3, backgroundColor: i === 0 ? 'transparent' : alpha(on, done ? 0.9 : 0.25) }} />
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done ? on : alpha(on, 0.18),
                  borderWidth: i === at ? 3 : 0,
                  borderColor: theme.app.accent,
                }}
              >
                <Icon source={s.icon} size={14} color={done ? theme.app.gradient[0] : alpha(on, 0.75)} />
              </View>
              <View style={{ flex: 1, height: 3, backgroundColor: i === STEPS.length - 1 ? 'transparent' : alpha(on, i < at ? 0.9 : 0.25) }} />
            </View>
            <Text variant="labelSmall" style={{ color: on, opacity: done ? 1 : 0.7, fontWeight: i === at ? '800' : '500', fontSize: 10 }} numberOfLines={1}>
              {s.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
