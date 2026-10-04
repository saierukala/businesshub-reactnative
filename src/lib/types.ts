// Only the fields this app uses. The backend (src/services/booking.view.ts) is the source of truth.
export type Status =
  | 'PENDING' | 'CONFIRMED' | 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type Booking = {
  id: string;
  bookingNumber: string;
  status: Status;
  startAt: string;
  endAt: string;
  problemDescription: string;
  paid: boolean;
  customer: { name: string; phone: string | null };
  service: { name: string; basePrice: string };
  appliance: { brand: string | null; model: string | null; category: { name: string } } | null;
  address: { line1: string; area: string; city: string; pincode: string };
};

export type Appointment = Booking & { nextStatus: Status | null; canComplete: boolean };

export type Visit = {
  diagnosis: string | null;
  workPerformed: string | null;
  extraCharge: { status: string | null; amount: string | null; reason: string | null };
  finalAmount: string;
};

export type BookingDetail = Booking & { visit: Visit | null; payment: { method: string; amount: string } | null };
