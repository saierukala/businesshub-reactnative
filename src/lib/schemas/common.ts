import { z } from "zod";

// Shared form rules (mirror ../BusinessHub-backend/src/validation/common.ts).
export const name = z.string().trim().min(2, "Enter at least 2 characters").max(100);
export const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));
export const optionalEmail = z.union([z.literal(""), email]);
export const phone = z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number");
// Optional text box: "" is allowed and clears the value on the server.
export const optionalText = (max: number) => z.string().trim().max(max);
