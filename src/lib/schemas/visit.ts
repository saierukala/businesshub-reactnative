import { z } from "zod";

// The visit notes. Diagnosis and work performed are needed to complete the visit (the API checks again).
export const visitSchema = z.object({
  diagnosis: z.string().trim().min(3, "Write what you found"),
  workPerformed: z.string().trim().min(3, "Write what you did"),
  partsNote: z.string().trim().max(1000),
  notes: z.string().trim().max(2000),
  result: z.string().trim().max(500),
});
export type VisitInput = z.input<typeof visitSchema>;

// Extra charge: rupees with at most 2 decimals, typed in a text box.
export const extraChargeSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter an amount like 250 or 250.50")
    .refine((v) => Number(v) > 0, "Enter the extra amount"),
  reason: z.string().trim().min(3, "Say what the extra work is").max(500),
});
export type ExtraChargeInput = z.input<typeof extraChargeSchema>;
