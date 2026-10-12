import { useState } from 'react';
import { Button, Text } from 'react-native-paper';
import { usePaymentConfig, useOnlinePayment } from '@/lib/queries/payments';
import { canPayOnline, openCheckout } from '@/lib/razorpay';
import { Banner } from '@/ui/Parts';
import { useAppTheme } from '@/ui/theme';
import { useToast } from '@/ui/toast';

// The customer pays a completed visit with Razorpay: 1. the server makes the order (it decides the amount),
// 2. Razorpay's secure screen takes the card / UPI details, 3. the server checks the signature and marks it paid.
// Hidden when the server has no Razorpay keys, and on the web preview (no native SDK there).
export function PayOnline({ bookingId, due }: { bookingId: string; due: string }) {
  const theme = useAppTheme();
  const toast = useToast();
  const config = usePaymentConfig();
  const { start, confirm } = useOnlinePayment(bookingId);
  const [opening, setOpening] = useState(false);
  if (!canPayOnline || !config.data?.online.enabled) return null;
  const testMode = config.data.online.keyId?.startsWith('rzp_test_') ?? false;

  async function pay() {
    setOpening(true);
    try {
      const order = await start.mutateAsync();
      const result = await openCheckout({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountPaise,
        currency: order.currency,
        name: 'HomeFix',
        description: order.description,
        prefill: order.prefill,
        theme: { color: theme.colors.primary }, // Razorpay's screen in the app colour
      });
      await confirm.mutateAsync({ orderId: result.razorpay_order_id, paymentId: result.razorpay_payment_id, signature: result.razorpay_signature });
      toast.success('Payment successful. Your receipt is ready.');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setOpening(false);
    }
  }

  return (
    <>
      {testMode && (
        <Banner tone="warn" icon="flask-outline" title="Test mode: no real money moves">
          <Text variant="bodySmall">In the payment screen choose UPI and enter success@razorpay, or use a Razorpay test card.</Text>
        </Banner>
      )}
      <Button mode="contained" icon="lock-outline" loading={opening || confirm.isPending} disabled={opening || confirm.isPending} onPress={pay} testID="pay-online">
        Pay {due} online
      </Button>
    </>
  );
}
