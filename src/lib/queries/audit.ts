import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import type { Page } from "@/lib/types";

export type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; role: string } | null;
};

export function useAuditLogs(params: { page?: number; action?: string; entityType?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ["audit", params],
    queryFn: () => api<Page<AuditEntry>>(`/audit-logs${qs(params)}`),
    placeholderData: keepPreviousData,
  });
}

// Action names that exist, for the filter.
export function useAuditActions() {
  return useQuery({ queryKey: ["audit", "actions"], queryFn: () => api<{ items: string[] }>("/audit-logs/actions"), select: (d) => d.items });
}
