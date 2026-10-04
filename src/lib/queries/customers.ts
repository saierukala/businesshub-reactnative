import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import type { Customer, Page } from "@/lib/types";
import type { CustomerOutput } from "@/lib/schemas/customer";

export function useCustomers(params: { q?: string; page?: number }) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => api<Page<Customer>>(`/customers${qs(params)}`),
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: string) {
  return useQuery({ queryKey: ["customer", id], queryFn: () => api<Customer>(`/customers/${id}`) });
}

export function useSaveCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: CustomerOutput & { id?: string; allowDuplicatePhone?: boolean }) =>
      id
        ? api<Customer>(`/customers/${id}`, { method: "PATCH", body })
        : api<Customer>("/customers", { method: "POST", body }),
    onSuccess: (customer) => {
      queryClient.setQueryData(["customer", customer.id], customer);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useInviteCustomer() {
  return useMutation({
    mutationFn: (customerId: string) => api<{ message: string }>("/auth/invite", { method: "POST", body: { customerId } }),
  });
}
