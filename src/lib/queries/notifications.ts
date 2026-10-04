import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import type { Page } from "@/lib/types";

export type AppNotification = { id: string; type: string; message: string; bookingId: string | null; read: boolean; createdAt: string };

// The count next to the bell: checked every 30 seconds while the page is open.
export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => api<{ unread: number }>("/notifications/unread-count"),
    refetchInterval: 30_000,
    select: (d) => d.unread,
  });
}

export function useNotifications(page: number, enabled: boolean) {
  return useQuery({
    queryKey: ["notifications", "list", page],
    queryFn: () => api<Page<AppNotification> & { unread: number }>(`/notifications${qs({ page, pageSize: 8 })}`),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ unread: number }>(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ unread: number }>("/notifications/read-all", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
