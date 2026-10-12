import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Payment, Receipt } from "@/lib/types";

// There is no amount to send: the server works it out. We only say how the customer paid.
export function useRecordPayment(bookingId: string) {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["booking"] });
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["report"] });
    queryClient.invalidateQueries({ queryKey: ["receipt"] });
  };
  return useMutation({
    mutationFn: (body: { method: "CASH" | "UPI"; reference?: string }) =>
      api<Payment>(`/bookings/${bookingId}/payment`, { method: "POST", body }),
    onSuccess: refresh,
    onError: refresh, // e.g. "already paid": show the current state
  });
}

export function useReceipt(bookingId: string) {
  return useQuery({ queryKey: ["receipt", bookingId], queryFn: () => api<Receipt>(`/bookings/${bookingId}/receipt`) });
}

// Is "Pay online" switched on (Razorpay keys set on the server)?
export function usePaymentConfig() {
  return useQuery({
    queryKey: ["payment-config"],
    queryFn: () => api<{ online: { enabled: boolean; keyId: string | null } }>("/payments/config"),
    staleTime: 5 * 60_000,
  });
}

export type OnlineOrder = {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  description: string;
  prefill: { name?: string; email?: string; contact?: string };
};

// Online payment: the server makes the Razorpay order (and the amount), then checks Razorpay's signed answer.
export function useOnlinePayment(bookingId: string) {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["booking"] });
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["receipt"] });
  };
  const start = useMutation({ mutationFn: () => api<OnlineOrder>(`/bookings/${bookingId}/payment/online`, { method: "POST" }) });
  const confirm = useMutation({
    mutationFn: (body: { orderId: string; paymentId: string; signature: string }) =>
      api<Payment>(`/bookings/${bookingId}/payment/online/confirm`, { method: "POST", body }),
    onSuccess: refresh,
    onError: refresh,
  });
  return { start, confirm };
}
