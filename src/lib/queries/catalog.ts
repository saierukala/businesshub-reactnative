import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import type { Category, Page, Service } from "@/lib/types";
import type { ServiceOutput } from "@/lib/schemas/service";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Page<Category>>(`/service-categories${qs({ pageSize: 100 })}`),
    staleTime: 5 * 60_000, // rarely changes
  });
}

export function useServices(params: { page?: number; includeInactive?: boolean; categoryId?: string }) {
  return useQuery({
    queryKey: ["services", params],
    queryFn: () => api<Page<Service>>(`/services${qs({ ...params, pageSize: 50 })}`),
    placeholderData: keepPreviousData, // keep the old page visible while the next one loads
  });
}

export function useSaveService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: ServiceOutput & { id?: string }) =>
      id
        ? api<Service>(`/services/${id}`, { method: "PATCH", body })
        : api<Service>("/services", { method: "POST", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useSetServiceActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api<Service>(`/services/${id}`, { method: "PATCH", body: { active } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });
}
