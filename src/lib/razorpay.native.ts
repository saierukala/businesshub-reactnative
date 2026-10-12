import { NativeModules, TurboModuleRegistry } from 'react-native';
import type { CheckoutOptions, CheckoutResult } from './razorpay.types';

// The Razorpay native module exists only in a development/production build, not in Expo Go.
// Without it the button is hidden, and the SDK is never loaded (loading it there can crash the screen).
export const canPayOnline = TurboModuleRegistry.get('RNRazorpayCheckout') != null || NativeModules.RNRazorpayCheckout != null;

// Razorpay's own secure screen takes the card / UPI details; they never touch our app.
export async function openCheckout(options: CheckoutOptions): Promise<CheckoutResult> {
  const RazorpayCheckout = (await import('react-native-razorpay')).default;
  try {
    return (await RazorpayCheckout.open(options)) as CheckoutResult;
  } catch (e) {
    const err = e as { code?: number; description?: string };
    throw new Error(err.description || 'The payment did not go through. You can try again.');
  }
}
