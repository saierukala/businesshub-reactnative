import { z } from "zod";
import { email, name, phone } from "./common";

export const newUserSchema = z.object({
  name,
  email,
  phone,
  role: z.enum(["MANAGER", "TECHNICIAN"], "Choose a role"),
});

export type NewUserInput = z.input<typeof newUserSchema>;
export type NewUserOutput = z.output<typeof newUserSchema>;
