// @ts-nocheck — Supabase insert/update types resolve with real generated DB types from Agent 1
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Dashboard, DashboardWidget } from '@/types/database';

function getSupabase() { return createClient(); }

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data: { user } } = await getSupabase().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await getSupabase()
        .from('dashboards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code === 'PGRST116') {
        return null;
      }
      if (error) throw error;
      return data as Dashboard;
    },
  });
}

export function useUpdateLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dashboardId, layout }: { dashboardId: string; layout: DashboardWidget[] }) => {
      const { data, error } = await getSupabase()
        .from('dashboards')
        .update({ layout })
        .eq('id', dashboardId)
        .select()
        .single();
      if (error) throw error;
      return data as Dashboard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
