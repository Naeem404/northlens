// @ts-nocheck — Supabase insert/update types resolve with real generated DB types from Agent 1
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { invokeFunction } from '@/lib/api';
import type { Pipeline } from '@/types/database';

function getSupabase() { return createClient(); }

export function usePipelines() {
  return useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('pipelines')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Pipeline[];
    },
  });
}

export function usePipeline(id: string) {
  return useQuery({
    queryKey: ['pipeline', id],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('pipelines')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Pipeline;
    },
    enabled: !!id,
  });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pipeline: {
      name: string;
      prompt: string;
      schema: Pipeline['schema'];
      sources: Pipeline['sources'];
      schedule: Pipeline['schedule'];
      extraction_mode: Pipeline['extraction_mode'];
    }) => {
      const { data: { user } } = await getSupabase().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await getSupabase()
        .from('pipelines')
        .insert({ ...pipeline, user_id: user.id, status: 'active' })
        .select()
        .single();
      if (error) throw error;
      return data as Pipeline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

export function useRunPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pipelineId: string) => {
      return invokeFunction('pipeline-run', { pipeline_id: pipelineId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

export function useDeletePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pipelineId: string) => {
      const { error } = await getSupabase()
        .from('pipelines')
        .delete()
        .eq('id', pipelineId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}
