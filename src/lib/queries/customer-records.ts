import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import type { Address, Appliance, Page } from "@/lib/types";

// Addresses and appliances use the same endpoints for both paths:
// customerId = undefined -> the logged-in customer (the backend uses the session);
// customerId = "<uuid>"  -> staff acting for that customer.

type Kind = "addresses" | "appliances";
type RecordOf<K extends Kind> = K extends "addresses" ? Address : Appliance;

const key = (kind: Kind, customerId?: string) => [kind, customerId ?? "me"];

export function useCustomerRecords<K extends Kind>(kind: K, customerId?: string) {
  return useQuery({
    queryKey: key(kind, customerId),
    // Customers have a handful of each; one big page keeps the UI simple.
    queryFn: () => api<Page<RecordOf<K>>>(`/${kind}${qs({ customerId, pageSize: 100 })}`),
  });
}

export function useSaveCustomerRecord(kind: Kind, customerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id?: string }) =>
      id
        ? api(`/${kind}/${id}`, { method: "PATCH", body })
        : api(`/${kind}`, { method: "POST", body: { ...body, customerId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(kind, customerId) }),
  });
}

export function useDeleteCustomerRecord(kind: Kind, customerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/${kind}/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(kind, customerId) }),
  });
}
