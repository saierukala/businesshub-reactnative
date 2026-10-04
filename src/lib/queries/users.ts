import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import type { Page, StaffUser } from "@/lib/types";
import type { NewUserOutput } from "@/lib/schemas/user";

export function useUsers(params: { role?: string; q?: string; page?: number }) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => api<Page<StaffUser>>(`/users${qs(params)}`),
    placeholderData: keepPreviousData,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: NewUserOutput) => api<StaffUser>("/users", { method: "POST", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api<StaffUser>(`/users/${id}/active`, { method: "PATCH", body: { active } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useResendInvite() {
  return useMutation({
    mutationFn: (id: string) => api<{ message: string }>(`/users/${id}/invite`, { method: "POST" }),
  });
}
