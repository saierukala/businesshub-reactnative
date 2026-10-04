import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/lib/auth";
import type { ForgotPasswordInput, LoginInput, RegisterInput } from "@/lib/schemas/auth";

// The logged-in user comes from the server layout (GET /auth/me), so after any auth change
// the caller does router.refresh() to re-render with the new session.

type UserResponse = { user: User };
type MessageResponse = { message: string };

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => api<UserResponse>("/auth/login", { method: "POST", body: input }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({ phone, ...rest }: RegisterInput) =>
      api<UserResponse>("/auth/register", {
        method: "POST",
        body: { ...rest, phone: phone || undefined },
      }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }),
    // Drop every cached query so the next user never sees the previous user's data.
    onSuccess: () => queryClient.clear(),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      api<MessageResponse>("/auth/forgot-password", { method: "POST", body: input }),
  });
}

// Reset password and accept invite have the same body, different endpoint.
export function useSetPassword(kind: "reset" | "invite") {
  const path = kind === "reset" ? "/auth/reset-password" : "/auth/accept-invite";
  return useMutation({
    mutationFn: (input: { token: string; password: string }) =>
      api<MessageResponse>(path, { method: "POST", body: input }),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => api<MessageResponse>("/auth/verify-email", { method: "POST", body: { token } }),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => api<MessageResponse>("/auth/resend-verification", { method: "POST" }),
  });
}
