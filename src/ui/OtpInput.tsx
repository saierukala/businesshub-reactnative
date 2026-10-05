import { useRef, useState } from 'react';
import { StyleSheet, TextInput as RNTextInput, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

type Props = { value: string; onChange: (code: string) => void; length?: number; error?: boolean; autoFocus?: boolean; onComplete?: (code: string) => void };

// A code entry that looks like separate boxes ("OTP" style). It is ONE real text input laid invisibly over the boxes,
// so typing, deleting, pasting the whole code and the phone's "fill code from SMS/email" all just work.
export function OtpInput({ value, onChange, length = 6, error, autoFocus, onComplete }: Props) {
  const theme = useTheme();
  const input = useRef<RNTextInput>(null);
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1); // the box the next digit goes into

  function change(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, length);
    onChange(digits);
    if (digits.length === length) onComplete?.(digits);
  }

  return (
    <View style={styles.row}>
      {Array.from({ length }, (_, i) => {
        const digit = value[i] ?? '';
        const isActive = focused && i === active;
        const color = error ? theme.colors.error : isActive ? theme.colors.primary : digit ? theme.colors.onSurfaceVariant : theme.colors.outline;
        return (
          <View key={i} style={[styles.box, { borderColor: color, borderWidth: isActive || error ? 2 : 1.5, backgroundColor: theme.colors.surface }]}>
            {digit ? (
              <Text style={[styles.digit, { color: theme.colors.onSurface }]}>{digit}</Text>
            ) : isActive ? (
              <View style={[styles.caret, { backgroundColor: theme.colors.primary }]} />
            ) : null}
          </View>
        );
      })}
      <RNTextInput
        ref={input}
        value={value}
        onChangeText={change}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={length}
        autoFocus={autoFocus}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        caretHidden
        accessibilityLabel={`${length}-digit code`}
        style={styles.hidden}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  box: { width: 46, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  digit: { fontSize: 24, fontWeight: '700' },
  caret: { width: 2, height: 26, borderRadius: 1 },
  // Covers the boxes so a tap anywhere focuses it, but is invisible.
  hidden: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, color: 'transparent' },
});
