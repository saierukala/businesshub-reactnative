import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import type { Availability, Booking, BookingDetail, Page } from "@/lib/types";

export type BookingFilters = {
  page?: number;
  pageSize?: number;
  sort?: "newest" | "soonest"; // soonest = earliest visit first (the reassignment queue)
  hideCancelled?: boolean; // leave out cancelled and no-show, so the total matches what is shown
  status?: string;
  customerId?: string;
  technicianId?: string;
  needsReassignment?: boolean;
  from?: string;
  to?: string;
};

export function useBookings(params: BookingFilters) {
  return useQuery({
    queryKey: ["bookings", params],
    queryFn: () => api<Page<Booking>>(`/bookings${qs(params)}`),
    placeholderData: keepPreviousData,
  });
}

// While the work is in progress, poll every 10 s: the customer sees the technician's extra-charge request,
// and the technician sees the answer, without reloading.
export function useBooking(id: string) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: () => api<BookingDetail>(`/bookings/${id}`),
    refetchInterval: (query) => (query.state.data?.status === "IN_PROGRESS" ? 10_000 : false),
  });
}

// Slots are always asked from the backend; the UI never works out availability itself.
// excludeBookingId: when rescheduling, so the booking's own slot does not block small shifts.
export function useAvailability(p: { serviceId?: string; date?: string; area?: string; excludeBookingId?: string }) {
  return useQuery({
    queryKey: ["availability", p],
    queryFn: () => api<Availability>(`/availability${qs(p)}`),
    enabled: Boolean(p.serviceId && p.date && p.area),
    staleTime: 0, // slots go stale fast; always refetch when shown
  });
}

export type CreateBookingInput = {
  applianceId: string;
  serviceId: string;
  addressId: string;
  problemDescription: string;
  startAt: string;
  // staff only
  customerId?: string;
  source?: string;
  technicianId?: string;
  overrideReason?: string;
};

// After any booking change, lists, the booking itself and slot lists are out of date.
function useRefreshBookings() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["report"] });
    queryClient.invalidateQueries({ queryKey: ["booking"] });
    queryClient.invalidateQueries({ queryKey: ["availability"] });
  };
}

export function useCreateBooking() {
  const refresh = useRefreshBookings();
  return useMutation({
    mutationFn: (body: CreateBookingInput) => api<Booking>("/bookings", { method: "POST", body }),
    onSuccess: refresh,
    onError: refresh, // a 409 means our slot list was stale: refresh it
  });
}

export function useRescheduleBooking(id: string) {
  const refresh = useRefreshBookings();
  return useMutation({
    mutationFn: (body: { startAt: string; overrideReason?: string }) =>
      api<Booking>(`/bookings/${id}/reschedule`, { method: "POST", body }),
    onSuccess: refresh,
    onError: refresh,
  });
}

export function useCancelBooking(id: string) {
  const refresh = useRefreshBookings();
  return useMutation({
    mutationFn: (body: { reason?: string; overrideReason?: string }) =>
      api<Booking>(`/bookings/${id}/cancel`, { method: "POST", body }),
    onSuccess: refresh,
  });
}

// How many bookings are waiting for a new technician (shown next to the nav link).
export function useReassignmentCount() {
  const q = useBookings({ needsReassignment: true, pageSize: 1 });
  return q.data?.total ?? 0;
}

// Free qualified technicians for a booking's time. Only asked for when the dialog is open.
export function useAssignableTechnicians(bookingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["assignable", bookingId],
    queryFn: () => api<{ items: { id: string; name: string; isCurrent: boolean }[] }>(`/bookings/${bookingId}/technicians`),
    enabled,
    staleTime: 0,
  });
}

export function useAssignTechnician(id: string) {
  const refresh = useRefreshBookings();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { technicianId: string; note?: string }) => api<Booking>(`/bookings/${id}/assign`, { method: "POST", body }),
    onSuccess: refresh,
    onError: () => queryClient.invalidateQueries({ queryKey: ["assignable", id] }), // the list was stale: reload it
  });
}

export function useMarkNoShow(id: string) {
  const refresh = useRefreshBookings();
  return useMutation({
    mutationFn: (body: { note?: string }) => api<Booking>(`/bookings/${id}/no-show`, { method: "POST", body }),
    onSuccess: refresh,
  });
}
