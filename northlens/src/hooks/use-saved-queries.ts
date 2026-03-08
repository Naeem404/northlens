// @ts-nocheck — Supabase insert/update types resolve with real generated DB types
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { SavedQuery } from '@/types/database';

function getSupabase() { return createClient(); }

export function useSavedQueries() {
  return useQuery({
    queryKey: ['saved-queries'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('saved_queries')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SavedQuery[];
    },
  });
}

export function usePinnedQueries() {
  return useQuery({
    queryKey: ['saved-queries', 'pinned'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('saved_queries')
        .select('*')
        .not('visualization_config', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Filter to only those with pinned_to_dashboard in their config
      return (data as SavedQuery[]).filter((q) => {
        const config = q.visualization_config as Record<string, unknown> | null;
        return config?.pinned_to_dashboard === true;
      });
    },
  });
}

export function useSaveQuery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (query: {
      name: string;
      description?: string;
      sql_query: string;
      visualization_config?: Record<string, unknown>;
    }) => {
      const { data: { user } } = await getSupabase().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await getSupabase()
        .from('saved_queries')
        .insert({
          user_id: user.id,
          name: query.name,
          description: query.description || '',
          sql_query: query.sql_query,
          visualization_config: query.visualization_config || {},
        })
        .select()
        .single();
      if (error) throw error;
      return data as SavedQuery;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-queries'] });
    },
  });
}

export function useUpdateQuery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      name: string;
      description: string;
      sql_query: string;
      visualization_config: Record<string, unknown>;
    }>) => {
      const { data, error } = await getSupabase()
        .from('saved_queries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as SavedQuery;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-queries'] });
    },
  });
}

export function useDeleteQuery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase()
        .from('saved_queries')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-queries'] });
    },
  });
}

export function useTogglePinQuery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { data: existing } = await getSupabase()
        .from('saved_queries')
        .select('visualization_config')
        .eq('id', id)
        .single();

      const config = (existing?.visualization_config as Record<string, unknown>) || {};
      config.pinned_to_dashboard = pinned;

      const { error } = await getSupabase()
        .from('saved_queries')
        .update({ visualization_config: config })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-queries'] });
    },
  });
}
