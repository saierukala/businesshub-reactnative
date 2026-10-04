import { useState } from 'react';
import { Link } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'react-native-paper';
import { showApiError } from '@/lib/form';
import { useForgotPassword } from '@/lib/queries/auth';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/schemas/auth';
import { AuthShell } from '@/ui/AuthShell';
import { FormAlert, SubmitButton, TextField } from '@/ui/Form';
import { Banner } from '@/ui/Parts';

export default function ForgotPassword() {
  const forgot = useForgotPassword();
  const [sent, setSent] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' }, mode: 'onTouched' });

  const submit = form.handleSubmit((v) =>
    forgot.mutateAsync(v).then(
      (r) => setSent(r.message),
      (err) => showApiError(form, err),
    ),
  );

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we will send you a reset link.">
      {sent ? (
        <Banner tone="success" title="Check your email">
          {sent} Open the link in the email to choose a new password, then log in here.
        </Banner>
      ) : (
        <>
          <FormAlert message={form.formState.errors.root?.server?.message} />
          <TextField control={form.control} name="email" label="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" left="email-outline" />
          <SubmitButton onPress={submit} pending={forgot.isPending}>Send reset link</SubmitButton>
        </>
      )}
      <Link href="/login" asChild>
        <Button icon="arrow-left">Back to log in</Button>
      </Link>
    </AuthShell>
  );
}
