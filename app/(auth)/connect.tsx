import { useState } from 'react';
import { Link } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'react-native-paper';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { showApiError } from '@/lib/form';
import { codeField, newPassword } from '@/lib/schemas/auth';
import { email } from '@/lib/schemas/common';
import { AuthShell } from '@/ui/AuthShell';
import { FormAlert, OtpField, PasswordField, SubmitButton, TextField } from '@/ui/Form';
import { useToast } from '@/ui/toast';

const schema = z.object({ email, code: codeField, password: newPassword });
type Values = z.input<typeof schema>;

// "I have a code": a customer the office created (or invited) sets up the app with the 6-digit code
// from their invite email or read to them by HomeFix staff, then is logged in straight away.
export default function Connect() {
  const { login } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', code: '', password: '' }, mode: 'onTouched' });

  const submit = form.handleSubmit(async (v) => {
    setBusy(true);
    try {
      await api('/auth/accept-invite-code', { method: 'POST', body: v });
      await login(v.email, v.password); // the Gate then opens their home screen
      toast.success('Your account is ready. Welcome to HomeFix!');
    } catch (err) {
      showApiError(form, err);
      setBusy(false);
    }
  });

  return (
    <AuthShell title="Set up your account" subtitle="Enter the 6-digit code from your HomeFix email or from our office, and choose a password.">
      <FormAlert message={form.formState.errors.root?.server?.message} />
      <TextField control={form.control} name="email" label="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" left="email-outline" />
      <OtpField control={form.control} name="code" label="6-digit code" />
      <PasswordField control={form.control} name="password" label="New password" hint="At least 8 characters." />
      <SubmitButton onPress={submit} pending={busy}>Set password and log in</SubmitButton>
      <Link href="/login" asChild>
        <Button icon="arrow-left">Back to log in</Button>
      </Link>
    </AuthShell>
  );
}
