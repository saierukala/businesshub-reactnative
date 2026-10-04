import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Give it a name, e.g. Home").max(40),
  line1: z.string().trim().min(3, "Enter the house/flat and street").max(200),
  area: z.string().trim().min(2, "Enter the area, e.g. Kondapur").max(60),
  city: z.string().trim().min(2).max(60),
  pincode: z.union([z.literal(""), z.string().regex(/^\d{6}$/, "Enter a 6-digit PIN code")]),
});

export type AddressInput = z.input<typeof addressSchema>;
