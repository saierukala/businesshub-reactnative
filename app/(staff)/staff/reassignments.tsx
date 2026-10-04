import { BookingsList } from '@/features/booking/BookingsList';

// Bookings that lost their technician (for example to sick leave): open one to assign someone else, or reschedule.
export default function Reassignments() {
  return <BookingsList staff queue />;
}
