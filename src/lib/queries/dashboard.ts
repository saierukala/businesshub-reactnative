import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Appliance, Booking, BookingStatus, Category } from "@/lib/types";

// Shapes of GET /dashboard/* (see docs/dashboards-reports.md). All numbers are counted by the API.

export type ManagerDashboard = {
  todayByStatus: Partial<Record<BookingStatus, number>>;
  pendingAssignments: { total: number; items: Booking[] };
  needsReassignment: { total: number; items: Booking[] };
  availableTechnicians: { id: string; name: string }[];
  revenue: { today: string; thisMonth: string };
  popularServices: { serviceId: string; name: string; bookings: number }[];
  bookingTrend: { date: string; count: number }[];
  bookingsBySource: Partial<Record<Booking["source"], number>>;
  technicianWorkload: { technicianId: string; name: string; today: number; next7Days: number }[];
};

export type CustomerDashboard = {
  upcomingBooking: Booking | null;
  appliances: (Pick<Appliance, "id" | "brand" | "model"> & { category: Category })[];
  recentHistory: Booking[];
  recentPayments: { id: string; amount: string; method: string; receiptNumber: string | null; paidAt: string | null; booking: { id: string; bookingNumber: string } }[];
  recentReviews: { id: string; rating: number; comment: string | null; createdAt: string; booking: { id: string; bookingNumber: string } }[];
};

export type TechnicianDashboard = {
  appointments: (Booking & { nextStatus: BookingStatus | null; canComplete: boolean })[];
  counts: { total: number; done: number; remaining: number };
};

// Dashboards change as work happens, so they refresh every minute while open.
const live = { refetchInterval: 60_000 };

export const useManagerDashboard = () =>
  useQuery({ queryKey: ["dashboard", "manager"], queryFn: () => api<ManagerDashboard>("/dashboard/manager"), ...live });

export const useCustomerDashboard = () =>
  useQuery({ queryKey: ["dashboard", "customer"], queryFn: () => api<CustomerDashboard>("/dashboard/customer"), ...live });

export const useTechnicianDashboard = () =>
  useQuery({ queryKey: ["dashboard", "technician"], queryFn: () => api<TechnicianDashboard>("/dashboard/technician"), ...live });
