import { useInfiniteQuery } from '@tanstack/react-query';
import { api, qs } from '@/lib/api';
import type { Page } from '@/lib/types';

// A list that loads the next page as you scroll. The query key starts with `key` ("bookings", "customers"...)
// so the same invalidateQueries({ queryKey: ["bookings"] }) calls that refresh the web lists refresh these too.
export function useInfiniteList<T>(key: string, path: string, params: Record<string, string | number | boolean | undefined | null> = {}, enabled = true) {
  return useInfiniteQuery({
    queryKey: [key, 'infinite', path, params],
    queryFn: ({ pageParam }) => api<Page<T>>(`${path}${qs({ pageSize: 20, ...params, page: pageParam })}`),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled,
  });
}
