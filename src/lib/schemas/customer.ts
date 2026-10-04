import { z } from "zod";
import { name, optionalEmail, phone } from "./common";

export const customerSchema = z.object({ name, phone, email: optionalEmail });

export type CustomerInput = z.input<typeof customerSchema>;
export type CustomerOutput = z.output<typeof customerSchema>;
