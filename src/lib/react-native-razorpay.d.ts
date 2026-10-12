// The Razorpay SDK ships no TypeScript types; this is the one call we use.
declare module 'react-native-razorpay' {
  const RazorpayCheckout: { open(options: object): Promise<unknown> };
  export default RazorpayCheckout;
}
