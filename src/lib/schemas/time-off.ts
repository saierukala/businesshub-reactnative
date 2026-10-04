import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date");

// Whole days: the person picks first and last day off. The API takes exact times, so we send
// midnight to midnight in IST (the business timezone), never the browser's timezone.
export const timeOffSchema = z
  .object({
    startDate: day,
    endDate: day,
    reason: z.enum(["SICK", "LEAVE", "OTHER"]),
    note: z.string().trim().max(300),
  })
  .refine((v) => v.endDate >= v.startDate, { path: ["endDate"], message: "Last day can't be before the first day" });

export type TimeOffInput = z.input<typeof timeOffSchema>;

const IST_MIDNIGHT = "T00:00:00+05:30";

function nextDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

export function toTimeOffBody(v: TimeOffInput) {
  return {
    startAt: `${v.startDate}${IST_MIDNIGHT}`,
    endAt: `${nextDay(v.endDate)}${IST_MIDNIGHT}`,
    reason: v.reason,
    note: v.note.trim() || undefined,
  };
}
