import { z } from "zod";
import { optionalText } from "./common";

export const serviceSchema = z.object({
  categoryId: z.string().min(1, "Choose a category"),
  name: z.string().trim().min(2).max(100),
  description: optionalText(1000),
  durationMinutes: z
    .string()
    .regex(/^\d+$/, "Enter minutes")
    .transform(Number)
    .refine((v) => v >= 15 && v <= 480 && v % 15 === 0, "15 to 480 minutes, in steps of 15"),
  basePrice: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a price like 499 or 499.50")
    .transform(Number),
  active: z.boolean(),
});

export type ServiceInput = z.input<typeof serviceSchema>;
export type ServiceOutput = z.output<typeof serviceSchema>;
