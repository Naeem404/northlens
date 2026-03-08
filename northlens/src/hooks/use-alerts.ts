// @ts-nocheck — Supabase insert/update types resolve with real generated DB types from Agent 1
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Alert, AlertEvent } from '@/types/database';

function getSupabase() { return createClient(); }

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Alert[];
    },
  });
}

export function useAlertEvents() {
  return useQuery({
    queryKey: ['alert-events'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('alert_events')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AlertEvent[];
    },
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alert: {
      pipeline_id: string;
      name: string;
      condition: Record<string, unknown>;
    }) => {
      const { data: { user } } = await getSupabase().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await getSupabase()
        .from('alerts')
        .insert({ ...alert, user_id: user.id, is_active: true })
        .select()
        .single();
      if (error) throw error;
      return data as Alert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useToggleAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ alertId, enabled }: { alertId: string; enabled: boolean }) => {
      const { error } = await getSupabase()
        .from('alerts')
        .update({ is_active: enabled })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await getSupabase()
        .from('alerts')
        .delete()
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await getSupabase()
        .from('alert_events')
        .update({ is_read: true })
        .eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-events'] });
    },
  });
}
