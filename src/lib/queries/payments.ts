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
