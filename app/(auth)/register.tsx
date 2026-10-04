import { useState } from 'react';
import { View } from 'react-native';
import { Link } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Text, useTheme } from 'react-native-paper';
import { useAuth } from '@/lib/auth';
import { showApiError } from '@/lib/form';
import { registerSchema, type RegisterInput } from '@/lib/schemas/auth';
import { AuthShell } from '@/ui/AuthShell';
import { FormAlert, PasswordField, SubmitButton, TextField } from '@/ui/Form';

export default function Register() {
  const theme = useTheme();
  const { register } = useAuth();
  const [busy, setBusy] = useState(false);
  const form = useForm<RegisterInput>({ resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', phone: '', password: '' }, mode: 'onTouched' });

  const submit = form.handleSubmit(async ({ phone, ...rest }) => {
    setBusy(true);
    try {
      await register({ ...rest, phone: phone || undefined });
    } catch (err) {
      showApiError(form, err);
      setBusy(false);
    }
  });

  return (
    <AuthShell title="Create your account" subtitle="Book a technician in a few taps.">
      <FormAlert message={form.formState.errors.root?.server?.message} />
      <TextField control={form.control} name="name" label="Full name" autoComplete="name" left="account-outline" />
      <TextField control={form.control} name="email" label="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" left="email-outline" />
      <TextField control={form.control} name="phone" label="Mobile number (optional)" keyboardType="phone-pad" maxLength={10} left="phone-outline" hint="10 digits. The technician may call you on this number." />
      <PasswordField control={form.control} name="password" label="Password" hint="At least 8 characters." />
      <SubmitButton onPress={submit} pending={busy}>Create account</SubmitButton>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Already have an account?</Text>
        <Link href="/login" asChild>
          <Button compact>Log in</Button>
        </Link>
      </View>
    </AuthShell>
  );
}
