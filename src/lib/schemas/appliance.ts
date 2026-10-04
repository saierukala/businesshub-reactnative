import { z } from "zod";
import { optionalText } from "./common";

export const applianceSchema = z.object({
  categoryId: z.string().min(1, "Choose the appliance type"),
  brand: z.string().trim().min(1, "Enter the brand, e.g. LG").max(60),
  model: optionalText(60),
  serialNumber: optionalText(60),
  // Text box -> number or null. The server checks it isn't in the future (IST).
  purchaseYear: z
    .string()
    .trim()
    .regex(/^(\d{4})?$/, "Enter a year like 2021")
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || v >= 1980, "Enter a year from 1980"),
  description: optionalText(500),
});

export type ApplianceInput = z.input<typeof applianceSchema>;
export type ApplianceOutput = z.output<typeof applianceSchema>;
