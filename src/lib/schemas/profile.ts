import { z } from "zod";
import { name } from "./common";

// Same rules as the backend (src/routes/profile.schemas.ts). Phone may be left empty.
export const profileSchema = z.object({
  name,
  phone: z.string().regex(/^([6-9]\d{9})?$/, "Enter a 10-digit mobile number"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
