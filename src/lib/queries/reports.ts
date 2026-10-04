import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import type { Booking, Page } from "@/lib/types";

export type ReportRange = { from?: string; to?: string; page?: number; pageSize?: number };

export type BookingReport = {
  summary: { total: number; completed: number; cancelled: number; noShow: number; rescheduled: number };
  bookings: Page<Booking>;
};
export type RevenueRow = { period: string; payments: number; revenue: string };
export type RevenueReport = Page<RevenueRow> & { totals: { payments: number; revenue: string } };
export type BreakdownRow = { id: string; name: string; bookings: number; completed: number; cancelled: number; noShow: number; revenue: string; avgRating?: number | null };

function useReport<T>(path: string, params: object) {
  return useQuery({ queryKey: ["report", path, params], queryFn: () => api<T>(`${path}${qs(params as Record<string, string>)}`), placeholderData: keepPreviousData });
}

export const useBookingReport = (p: ReportRange) => useReport<BookingReport>("/reports/bookings", p);
export const useRevenueReport = (p: ReportRange & { groupBy: "day" | "week" | "month" }) => useReport<RevenueReport>("/reports/revenue", p);
export const useServiceReport = (p: ReportRange) => useReport<Page<BreakdownRow>>("/reports/services", p);
export const useTechnicianReport = (p: ReportRange) => useReport<Page<BreakdownRow>>("/reports/technicians", p);
