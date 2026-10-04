import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import type { Page, Technician, TimeOff, WorkingDay } from "@/lib/types";
import type { toTimeOffBody } from "@/lib/schemas/time-off";

export function useTechnicians(params: { q?: string; page?: number }) {
  return useQuery({
    queryKey: ["technicians", params],
    queryFn: () => api<Page<Technician>>(`/technicians${qs(params)}`),
    placeholderData: keepPreviousData,
  });
}

export function useTechnician(id: string) {
  return useQuery({ queryKey: ["technician", id], queryFn: () => api<Technician>(`/technicians/${id}`) });
}

// Skills, areas and hours are each saved with a PUT that returns the whole technician.
function useSaveSetup<T>(id: string, path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: T) => api<Technician>(`/technicians/${id}/${path}`, { method: "PUT", body }),
    onSuccess: (technician) => {
      queryClient.setQueryData(["technician", id], technician);
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
    },
  });
}

export const useSaveSkills = (id: string) => useSaveSetup<{ categoryIds: string[] }>(id, "skills");
export const useSaveAreas = (id: string) => useSaveSetup<{ areas: string[] }>(id, "areas");
export const useSaveWorkingHours = (id: string) => useSaveSetup<{ days: WorkingDay[] }>(id, "working-hours");

export function useTimeOff(id: string, includePast: boolean) {
  return useQuery({
    queryKey: ["time-off", id, includePast],
    queryFn: () => api<Page<TimeOff>>(`/technicians/${id}/time-off${qs({ includePast, pageSize: 50 })}`),
  });
}

export function useAddTimeOff(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ReturnType<typeof toTimeOffBody>) =>
      api<TimeOff & { bookingsNeedingReassignment: number }>(`/technicians/${id}/time-off`, { method: "POST", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["time-off", id] }),
  });
}

export function useRemoveTimeOff(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (timeOffId: string) => api<void>(`/technicians/${id}/time-off/${timeOffId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["time-off", id] }),
  });
}
