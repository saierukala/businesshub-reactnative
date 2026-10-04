// All business time is Asia/Kolkata (spec rule 5), so format in IST whatever the phone's timezone is.
const tz = 'Asia/Kolkata';
export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: tz });
export const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz });
export const rupees = (amount: string) => `₹${Number(amount).toLocaleString('en-IN')}`;
