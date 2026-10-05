import { useState } from 'react';
import { Link } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'react-native-paper';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { showApiError } from '@/lib/form';
import { useForgotPassword } from '@/lib/queries/auth';
import { codeField, forgotPasswordSchema, newPassword, type ForgotPasswordInput } from '@/lib/schemas/auth';
import { AuthShell } from '@/ui/AuthShell';
import { FormAlert, OtpField, PasswordField, SubmitButton, TextField } from '@/ui/Form';
import { useToast } from '@/ui/toast';
import { Banner } from '@/ui/Parts';

const resetSchema = z.object({ code: codeField, password: newPassword });
type ResetValues = z.input<typeof resetSchema>;

// Step 2: the 6-digit code from the email and a new password, then straight into the app.
function ResetWithCode({ email, message, onBack }: { email: string; message: string; onBack: () => void }) {
  const { login } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const form = useForm<ResetValues>({ resolver: zodResolver(resetSchema), defaultValues: { code: '', password: '' }, mode: 'onTouched' });

  const submit = form.handleSubmit(async (v) => {
    setBusy(true);
    try {
      await api('/auth/reset-password-code', { method: 'POST', body: { email, ...v } });
      await login(email, v.password);
      toast.success('Password updated. You are logged in.');
    } catch (err) {
      showApiError(form, err);
      setBusy(false);
    }
  });

  return (
    <>
      <Banner tone="success" title="Check your email">{`${message} Enter the 6-digit code from the email below. It works for 15 minutes.`}</Banner>
      <FormAlert message={form.formState.errors.root?.server?.message} />
      <OtpField control={form.control} name="code" label="Code from the email" />
      <PasswordField control={form.control} name="password" label="New password" hint="At least 8 characters." />
      <SubmitButton onPress={submit} pending={busy}>Set new password</SubmitButton>
      <Button onPress={onBack}>Use a different email or send again</Button>
    </>
  );
}

export default function ForgotPassword() {
  const toast = useToast();
  const forgot = useForgotPassword();
  const [sent, setSent] = useState<{ email: string; message: string } | null>(null);
  const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' }, mode: 'onTouched' });

  const submit = form.handleSubmit((v) =>
    forgot.mutateAsync(v).then(
      (r) => {
        setSent({ email: v.email, message: r.message });
        toast.success('Code sent. Check your email.');
      },
      (err) => showApiError(form, err),
    ),
  );

  return (
    <AuthShell title="Forgot your password?" subtitle="We will email you a 6-digit code to set a new one.">
      {sent ? (
        <ResetWithCode email={sent.email} message={sent.message} onBack={() => setSent(null)} />
      ) : (
        <>
          <FormAlert message={form.formState.errors.root?.server?.message} />
          <TextField control={form.control} name="email" label="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" left="email-outline" />
          <SubmitButton onPress={submit} pending={forgot.isPending}>Send code</SubmitButton>
        </>
      )}
      <Link href="/login" asChild>
        <Button icon="arrow-left">Back to log in</Button>
      </Link>
    </AuthShell>
  );
}
