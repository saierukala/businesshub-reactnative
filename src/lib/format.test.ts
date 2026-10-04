import { describe, expect, it } from 'vitest';
import { addDays, dayParts, formatDuration, formatINR, formatPhone, formatTime, istDay, istHour } from './format';
import { toTimeOffBody } from './schemas/time-off';

// The phone may be in any timezone; everything the business sees must be India time (spec rule 5).
describe('IST date helpers', () => {
  it('istDay gives the IST calendar day, not the UTC one', () => {
    // 20:00 UTC on 4 Oct is 01:30 on 5 Oct in India
    expect(istDay(new Date('2026-10-04T20:00:00Z'))).toBe('2026-10-05');
    expect(istDay(new Date('2026-10-04T18:29:00Z'))).toBe('2026-10-04');
  });

  it('istHour and formatTime use IST', () => {
    expect(istHour('2026-10-05T03:30:00Z')).toBe(9); // 09:00 IST
    expect(istHour('2026-10-05T12:30:00Z')).toBe(18);
    expect(formatTime('2026-10-05T03:30:00Z')).toBe('9:00 am');
  });

  it('addDays crosses month ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-10-05', -5)).toBe('2026-09-30');
  });

  it('dayParts labels the date strip', () => {
    expect(dayParts('2026-10-05')).toEqual({ weekday: 'Mon', day: '5', month: 'Oct' });
  });
});

describe('money and phone', () => {
  it('formats rupees without .00', () => {
    expect(formatINR('599.00')).toBe('₹599');
    expect(formatINR('649.50')).toBe('₹649.50');
  });
  it('formats durations and phones', () => {
    expect(formatDuration(90)).toBe('1 h 30 min');
    expect(formatPhone('9876543210')).toBe('+91 98765 43210');
    expect(formatPhone(null)).toBe('—');
  });
});

describe('time off', () => {
  it('sends whole IST days, end exclusive', () => {
    expect(toTimeOffBody({ startDate: '2026-10-05', endDate: '2026-10-06', reason: 'SICK', note: ' ' })).toEqual({
      startAt: '2026-10-05T00:00:00+05:30',
      endAt: '2026-10-07T00:00:00+05:30',
      reason: 'SICK',
      note: undefined,
    });
  });
});
