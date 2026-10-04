import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import type { Booking, Page } from "@/lib/types";

// Everything on the visit changes the booking (status, notes, extra charge), so refresh all booking data.
function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["booking"] });
    queryClient.invalidateQueries({ queryKey: ["availability"] });
    queryClient.invalidateQueries({ queryKey: ["appliance-history"] });
  };
}

const post = <T,>(path: string, body: unknown, method = "POST") => api<T>(path, { method, body });

// The technician's forward moves: on the way, arrived, start work.
export function useAdvanceBooking(id: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (to: "EN_ROUTE" | "ARRIVED" | "IN_PROGRESS") => post<Booking>(`/bookings/${id}/status`, { to }),
    onSuccess: refresh,
    onError: refresh,
  });
}

export type VisitNotes = { diagnosis?: string; workPerformed?: string; partsNote?: string; notes?: string; result?: string };

export function useSaveVisit(id: string) {
  const refresh = useRefresh();
  return useMutation({ mutationFn: (body: VisitNotes) => post<Booking>(`/bookings/${id}/visit`, body, "PATCH"), onSuccess: refresh });
}

export function useCompleteVisit(id: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (body: VisitNotes & { diagnosis: string; workPerformed: string }) => post<Booking>(`/bookings/${id}/visit/complete`, body),
    onSuccess: refresh,
    onError: refresh,
  });
}

export function useProposeExtraCharge(id: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (body: { amount: number; reason: string }) => post<Booking>(`/bookings/${id}/visit/extra-charge`, body),
    onSuccess: refresh,
    onError: refresh,
  });
}

// The customer answers in the app; staff can record the customer's phone answer. Same endpoint.
export function useDecideExtraCharge(id: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (decision: "APPROVED" | "DECLINED") => post<Booking>(`/bookings/${id}/visit/extra-charge/decision`, { decision }),
    onSuccess: refresh,
    onError: refresh,
  });
}

export type FollowUpInput = { startAt: string; serviceId?: string; problemDescription?: string; technicianId?: string; overrideReason?: string };

export function useCreateFollowUp(id: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (body: FollowUpInput) => post<Booking>(`/bookings/${id}/follow-up`, body),
    onSuccess: refresh,
    onError: refresh,
  });
}

export type HistoryItem = {
  bookingId: string;
  bookingNumber: string;
  date: string;
  service: { id: string; name: string };
  technician: string | null;
  diagnosis: string | null;
  workPerformed: string | null;
  amount: string;
  followUpOf: { id: string; bookingNumber: string } | null;
};

export function useApplianceHistory(applianceId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["appliance-history", applianceId],
    queryFn: () => api<Page<HistoryItem>>(`/appliances/${applianceId}/history${qs({ pageSize: 50 })}`),
    enabled,
  });
}
