import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import type { Page, Review } from "@/lib/types";

export type ReviewRow = Review & {
  booking: { id: string; bookingNumber: string; startAt: string; service: string };
  technician: { id: string; name: string } | null;
  customer?: string; // staff only
};

export function useReviews(params: { page?: number; rating?: string; technicianId?: string }) {
  return useQuery({
    queryKey: ["reviews", params],
    queryFn: () => api<Page<ReviewRow> & { average: number | null }>(`/reviews${qs(params)}`),
    placeholderData: keepPreviousData,
  });
}

export function useCreateReview(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { rating: number; comment?: string }) => api<Review>("/reviews", { method: "POST", body: { bookingId, ...body } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
