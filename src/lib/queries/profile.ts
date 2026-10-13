import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth, type User } from '@/lib/auth';
import type { ProfileInput } from '@/lib/schemas/profile';

// GET /profile: the logged-in user plus when they joined and their photo (a data URL, or null).
export type Profile = User & { memberSince: string; avatar: string | null };
type ProfileResponse = { profile: Profile };
const KEY = ['profile'];

export function useProfile() {
  return useQuery({ queryKey: KEY, queryFn: () => api<ProfileResponse>('/profile').then((r) => r.profile) });
}

// After a change: update the cache, and reload the logged-in user so the name/phone match everywhere.
function useProfileMutation<T>(fn: (input: T) => Promise<ProfileResponse | undefined>) {
  const qc = useQueryClient();
  const { refresh } = useAuth();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (res) => {
      if (res) qc.setQueryData(KEY, res.profile);
      else await qc.invalidateQueries({ queryKey: KEY });
      await refresh();
    },
  });
}

export const useUpdateProfile = () =>
  useProfileMutation((input: ProfileInput) => api<ProfileResponse>('/profile', { method: 'PATCH', body: input }));

export const useSetAvatar = () =>
  useProfileMutation((image: string) => api<ProfileResponse>('/profile/avatar', { method: 'PUT', body: { image } }));

export const useRemoveAvatar = () => useProfileMutation(() => api<undefined>('/profile/avatar', { method: 'DELETE' }));
