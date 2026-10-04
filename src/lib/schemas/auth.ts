import { z } from "zod";

// Same rules as the backend (src/routes/auth.schemas.ts). The backend still validates;
// these give instant feedback in the form.
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));
const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email,
  // Optional: empty string means "not given".
  phone: z
    .string()
    .trim()
    .regex(/^([6-9]\d{9})?$/, "Enter a 10-digit mobile number"),
  password: newPassword,
});

export const forgotPasswordSchema = z.object({ email });

export const setPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
