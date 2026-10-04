import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import { HelperText, TextInput } from 'react-native-paper';
import { formatDay } from '@/lib/format';

// "2026-10-05" <-> Date at local midnight (the pickers work with local dates; we only ever store the calendar day).
const toDate = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const toDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// A calendar day picker that looks like a text field. value is YYYY-MM-DD ("" = not chosen).
export function DateField({ label, value, onChange, min, max, error }: { label: string; value: string; onChange: (day: string) => void; min?: string; max?: string; error?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={label}>
        <View pointerEvents="none">
          <TextInput mode="outlined" label={label} value={value ? formatDay(value) : ''} editable={false} error={Boolean(error)} left={<TextInput.Icon icon="calendar" />} right={<TextInput.Icon icon="chevron-down" />} />
        </View>
      </Pressable>
      {error && <HelperText type="error" visible>{error}</HelperText>}
      <DatePickerModal
        locale="en"
        mode="single"
        visible={open}
        onDismiss={() => setOpen(false)}
        date={value ? toDate(value) : undefined}
        validRange={{ startDate: min ? toDate(min) : undefined, endDate: max ? toDate(max) : undefined }}
        onConfirm={({ date }) => {
          setOpen(false);
          if (date) onChange(toDay(date));
        }}
      />
    </View>
  );
}

// A time-of-day picker that looks like a text field. value is "HH:MM" in 24-hour form (IST for working hours).
export function TimeField({ label, value, onChange, error }: { label: string; value: string; onChange: (time: string) => void; error?: boolean }) {
  const [open, setOpen] = useState(false);
  const [h, m] = (value || '09:00').split(':').map(Number);
  return (
    <View style={{ flex: 1 }}>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={label}>
        <View pointerEvents="none">
          <TextInput mode="outlined" dense label={label} value={value} editable={false} error={error} right={<TextInput.Icon icon="clock-outline" />} />
        </View>
      </Pressable>
      <TimePickerModal
        visible={open}
        onDismiss={() => setOpen(false)}
        hours={h}
        minutes={m}
        use24HourClock
        onConfirm={({ hours, minutes }) => {
          setOpen(false);
          onChange(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
        }}
      />
    </View>
  );
}
