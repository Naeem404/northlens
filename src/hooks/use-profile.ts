// @ts-nocheck — Supabase insert/update types resolve with real generated DB types from Agent 1
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

function getSupabase() { return createClient(); }

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await getSupabase().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await getSupabase()
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Partial<Profile>) => {
      const { data: { user } } = await getSupabase().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await getSupabase()
        .from('profiles')
        .update(profile)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
