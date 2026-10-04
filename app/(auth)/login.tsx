import { useState } from 'react';
import { View } from 'react-native';
import { Link } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Text, useTheme } from 'react-native-paper';
import { useAuth } from '@/lib/auth';
import { showApiError } from '@/lib/form';
import { loginSchema, type LoginInput } from '@/lib/schemas/auth';
import { AuthShell } from '@/ui/AuthShell';
import { FormAlert, PasswordField, SubmitButton, TextField } from '@/ui/Form';

// Dev only: tap to fill the seeded demo logins (password is the same for all, see the backend seed).
const DEMO = [
  { label: 'Customer', email: 'ravi@example.test' },
  { label: 'Technician', email: 'rahul@homefix.test' },
  { label: 'Manager', email: 'manager@homefix.test' },
  { label: 'Owner', email: 'owner@homefix.test' },
];

export default function Login() {
  const theme = useTheme();
  const { login } = useAuth();
  const [busy, setBusy] = useState(false);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' }, mode: 'onTouched' });

  const submit = form.handleSubmit(async (v) => {
    setBusy(true);
    try {
      await login(v.email, v.password); // the Gate then moves us to this role's home
    } catch (err) {
      showApiError(form, err);
      setBusy(false);
    }
  });

  return (
    <AuthShell title="Welcome back" subtitle="Log in to book and track your repairs.">
      <FormAlert message={form.formState.errors.root?.server?.message} />
      <TextField control={form.control} name="email" label="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" left="email-outline" />
      <PasswordField control={form.control} name="password" label="Password" />
      <View style={{ alignItems: 'flex-end', marginTop: -8 }}>
        <Link href="/forgot-password" asChild>
          <Button compact>Forgot password?</Button>
        </Link>
      </View>
      <SubmitButton onPress={submit} pending={busy}>Log in</SubmitButton>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>New customer?</Text>
        <Link href="/register" asChild>
          <Button compact>Create an account</Button>
        </Link>
      </View>
      {__DEV__ && (
        <View style={{ gap: 6, marginTop: 4 }}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>DEMO LOGINS (dev only)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {DEMO.map((d) => (
              <Button key={d.label} compact mode="outlined" onPress={() => { form.setValue('email', d.email); form.setValue('password', 'Password@123'); }}>
                {d.label}
              </Button>
            ))}
          </View>
        </View>
      )}
    </AuthShell>
  );
}
