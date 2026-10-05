import { useState } from 'react';
import { View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { formatTime } from '@/lib/format';
import { useCreateAppCode, type AppCode } from '@/lib/queries/customers';
import type { Customer } from '@/lib/types';
import { FormModal } from '@/ui/FormModal';
import { Banner, Card } from '@/ui/Parts';
import { useToast } from '@/ui/toast';

const WHAT = {
  ACCOUNT_INVITE: 'In the HomeFix app they tap "I have a code from HomeFix", then enter their email, this code and a new password.',
  EMAIL_VERIFY: 'They log in to the HomeFix app, open My account and enter this code under "Verify your email".',
};

// "Device connect": the office helps a customer set up the app over the phone. The API allows it only for customers,
// only for an invite or email-verification code, and logs who asked. The code is shown once and never stored here.
export function DeviceConnect({ customer: c }: { customer: Customer }) {
  const theme = useTheme();
  const toast = useToast();
  const create = useCreateAppCode();
  const [shown, setShown] = useState<AppCode | null>(null);
  if (!c.email || !c.active || (c.hasAccount && c.emailVerified)) return null;

  return (
    <View style={{ gap: 6 }}>
      <Button mode="outlined" icon="cellphone-key" loading={create.isPending} disabled={create.isPending} onPress={() => create.mutate(c.id, { onSuccess: setShown, onError: (e) => toast.error(e.message) })}>
        Create app code
      </Button>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        A one-time code to read to the customer, to {c.hasAccount ? 'verify their email' : 'set up their account'} in the app.
      </Text>
      <FormModal visible={shown !== null} onClose={() => setShown(null)} title="App code" subtitle="Read it to the customer. It is shown only once.">
        {shown && (
          <>
            <Banner tone="warn" icon="account-alert-outline">{`Make sure you are talking to ${c.name} before you read it out.`}</Banner>
            <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Text style={{ fontSize: 40, fontWeight: '800', letterSpacing: 10 }} accessibilityLabel={`Code ${shown.code.split('').join(' ')}`}>{shown.code}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Valid until {formatTime(shown.expiresAt)} (15 minutes), once.</Text>
            </Card>
            <Text variant="bodyMedium">{WHAT[shown.type]} Email to use: {shown.email}.</Text>
            <Button mode="contained" onPress={() => setShown(null)}>Done</Button>
          </>
        )}
      </FormModal>
    </View>
  );
}
