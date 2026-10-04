import { z } from "zod";
import { optionalText } from "@/lib/schemas/common";

// Mirrors the backend rule: 1 to 5 stars, optional comment up to 1000 characters.
export const reviewSchema = z.object({
  rating: z.number("Choose how many stars").int().min(1, "Choose how many stars").max(5),
  comment: optionalText(1000),
});

export type ReviewValues = z.infer<typeof reviewSchema>;
