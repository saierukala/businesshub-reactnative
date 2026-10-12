import type { CheckoutOptions, CheckoutResult } from './razorpay.types';

// Web preview (Expo web): the Razorpay native SDK does not exist here. Pay online works in the phone app only.
export const canPayOnline = false;

export async function openCheckout(_options: CheckoutOptions): Promise<CheckoutResult> {
  throw new Error('Pay online works in the phone app only.');
}
