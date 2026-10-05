import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type TextInputProps } from 'react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Button, HelperText, Icon, RadioButton, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { Banner } from './Parts';
import { OtpInput } from './OtpInput';

// Form building blocks that plug into react-hook-form. Each shows its own validation error under the field.

type FieldProps<T extends FieldValues> = { control: Control<T, any, any>; name: Path<T>; label: string; hint?: string };

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  ...input
}: FieldProps<T> & Pick<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'autoComplete' | 'placeholder' | 'maxLength' | 'inputMode' | 'textContentType'> & { multiline?: boolean; lines?: number; left?: string }) {
  const { multiline, lines, left, ...rest } = input;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View>
          <TextInput
            mode="outlined"
            label={label}
            value={String(field.value ?? '')}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.invalid}
            multiline={multiline}
            numberOfLines={multiline ? (lines ?? 3) : 1}
            left={left ? <TextInput.Icon icon={left} /> : undefined}
            style={multiline ? { minHeight: 24 * (lines ?? 3) } : undefined}
            {...rest}
          />
          {(fieldState.error || hint) && (
            <HelperText type={fieldState.error ? 'error' : 'info'} visible>
              {fieldState.error?.message ?? hint}
            </HelperText>
          )}
        </View>
      )}
    />
  );
}

export function PasswordField<T extends FieldValues>({ control, name, label, hint }: FieldProps<T>) {
  const [show, setShow] = useState(false);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View>
          <TextInput
            mode="outlined"
            label={label}
            value={String(field.value ?? '')}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.invalid}
            secureTextEntry={!show}
            autoCapitalize="none"
            autoComplete="password"
            left={<TextInput.Icon icon="lock-outline" />}
            right={<TextInput.Icon icon={show ? 'eye-off-outline' : 'eye-outline'} onPress={() => setShow((s) => !s)} />}
          />
          {(fieldState.error || hint) && (
            <HelperText type={fieldState.error ? 'error' : 'info'} visible>
              {fieldState.error?.message ?? hint}
            </HelperText>
          )}
        </View>
      )}
    />
  );
}

export type Option = { value: string; label: string };

// Looks like a text field but opens something when tapped (dropdown list, date or time picker).
// The icon is a plain picture, not a button: a button inside the tappable field would be invalid on the web.
export function PressableField({ label, value, icon, error, dense, expanded, onPress }: { label: string; value: string; icon: string; error?: boolean; dense?: boolean; expanded?: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={value ? `${label}: ${value}` : label} accessibilityState={expanded === undefined ? undefined : { expanded }}>
      <View pointerEvents="none">
        <TextInput mode="outlined" dense={dense} label={label} value={value} editable={false} error={error} style={{ paddingRight: 36 }} />
        <View style={styles.fieldIcon}>
          <Icon source={icon} size={22} color={error ? theme.colors.error : theme.colors.onSurfaceVariant} />
        </View>
      </View>
    </Pressable>
  );
}

// A "dropdown": tap the field, pick from the list that opens under it.
export function SelectField<T extends FieldValues>({ control, name, label, options, hint }: FieldProps<T> & { options: Option[] }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View>
          <PressableField
            label={label}
            value={options.find((o) => o.value === field.value)?.label ?? ''}
            icon={open ? 'chevron-up' : 'chevron-down'}
            error={fieldState.invalid}
            expanded={open}
            onPress={() => setOpen((o) => !o)}
          />
          {/* The list opens right under the field (not in a dialog), so it also works inside form sheets. */}
          {open && (
            <View style={[styles.options, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
              <RadioButton.Group
                value={String(field.value ?? '')}
                onValueChange={(v) => {
                  field.onChange(v);
                  field.onBlur();
                  setOpen(false);
                }}
              >
                {options.length === 0 && <Text style={{ padding: 16, opacity: 0.6 }}>Loading…</Text>}
                {options.map((o) => (
                  <RadioButton.Item key={o.value} value={o.value} label={o.label} labelStyle={{ color: theme.colors.onSurface }} />
                ))}
              </RadioButton.Group>
            </View>
          )}
          {(fieldState.error || hint) && (
            <HelperText type={fieldState.error ? 'error' : 'info'} visible>
              {fieldState.error?.message ?? hint}
            </HelperText>
          )}
        </View>
      )}
    />
  );
}

export function SwitchField<T extends FieldValues>({ control, name, label }: Omit<FieldProps<T>, 'hint'>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <View style={styles.switchRow}>
          <Text variant="bodyLarge">{label}</Text>
          <Switch value={Boolean(field.value)} onValueChange={field.onChange} />
        </View>
      )}
    />
  );
}

// Choose one of a few options with big tappable pills (better than a dropdown for 2 to 4 options).
export function PillGroup({ options, value, onChange }: { options: Option[]; value?: string; onChange: (v: string) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.pills}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={[styles.pill, { borderColor: on ? theme.colors.primary : theme.colors.outline, backgroundColor: on ? theme.colors.primaryContainer : theme.colors.surface }]}
          >
            <Text style={{ fontWeight: on ? '700' : '500', color: on ? theme.colors.onPrimaryContainer : theme.colors.onSurface }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SubmitButton({ children, onPress, pending, disabled, icon, mode = 'contained' }: { children: ReactNode; onPress: () => void; pending?: boolean; disabled?: boolean; icon?: string; mode?: 'contained' | 'outlined' | 'contained-tonal' }) {
  return (
    <Button mode={mode} onPress={onPress} loading={pending} disabled={pending || disabled} icon={icon} contentStyle={styles.btn} labelStyle={styles.btnLabel} style={{ borderRadius: 14 }}>
      {children}
    </Button>
  );
}

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return <Banner tone="error">{message}</Banner>;
}

// Label + pill/choice card helper for forms that pick one item from a list (appliance, address, service, technician...).
export type Choice = { id: string; title: string; subtitle?: string; aside?: string };

export function ChoiceList({ items, value, onChange, addLabel, onAdd }: { items: Choice[]; value?: string; onChange: (id: string) => void; addLabel?: string; onAdd?: () => void }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {items.map((c) => {
        const on = c.id === value;
        return (
          <Pressable
            key={c.id}
            onPress={() => onChange(c.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={[styles.choice, { borderColor: on ? theme.colors.primary : theme.colors.outlineVariant, backgroundColor: on ? theme.colors.primaryContainer : theme.colors.surface, borderWidth: on ? 2 : 1 }]}
          >
            <Icon source={on ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={on ? theme.colors.primary : theme.colors.outline} />
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={{ fontWeight: '700' }}>{c.title}</Text>
              {c.subtitle && <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{c.subtitle}</Text>}
            </View>
            {c.aside && <Text variant="titleSmall" style={{ fontWeight: '700' }}>{c.aside}</Text>}
          </Pressable>
        );
      })}
      {onAdd && (
        <Button mode="outlined" icon="plus" onPress={onAdd} style={{ borderRadius: 14 }}>
          {addLabel ?? 'Add'}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5 },
  btn: { height: 50 },
  btnLabel: { fontSize: 16, fontWeight: '700' },
  fieldIcon: { position: 'absolute', right: 12, top: 6, bottom: 0, justifyContent: 'center' },
  options: { borderWidth: 1, borderRadius: 12, marginTop: 6, overflow: 'hidden' },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14 },
});

// The 6-box code entry wired to react-hook-form, with a label above and the error below.
export function OtpField<T extends FieldValues>({ control, name, label, hint }: FieldProps<T>) {
  const theme = useTheme();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View style={{ gap: 8 }}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>{label}</Text>
          <OtpInput value={String(field.value ?? '')} onChange={field.onChange} error={fieldState.invalid} />
          {(fieldState.error || hint) && (
            <HelperText type={fieldState.error ? 'error' : 'info'} visible style={{ textAlign: 'center' }}>
              {fieldState.error?.message ?? hint}
            </HelperText>
          )}
        </View>
      )}
    />
  );
}
