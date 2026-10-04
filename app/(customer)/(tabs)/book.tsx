import { BookingWizard } from '@/features/booking/BookingWizard';

// No customerId: the backend books for the logged-in customer.
export default function Book() {
  return <BookingWizard />;
}
