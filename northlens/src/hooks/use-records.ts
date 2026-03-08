import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { invokeFunction } from '@/lib/api';
import type { Record_, RecordVersion } from '@/types/database';

function getSupabase() { return createClient(); }

interface UseRecordsOptions {
  filters?: Record<string, string>;
  sort?: { column: string; ascending: boolean };
  page?: number;
  limit?: number;
}

export function useRecords(pipelineId: string, options: UseRecordsOptions = {}) {
  const { page = 1, limit = 20, sort, filters } = options;

  return useQuery({
    queryKey: ['records', pipelineId, { page, limit, sort, filters }],
    queryFn: async () => {
      let query = getSupabase()
        .from('records')
        .select('*', { count: 'exact' })
        .eq('pipeline_id', pipelineId);

      if (sort) {
        query = query.order(sort.column, { ascending: sort.ascending });
      } else {
        query = query.order('last_updated_at', { ascending: false });
      }

      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        records: data as Record_[],
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      };
    },
    enabled: !!pipelineId,
  });
}

export function useRecordHistory(recordId: string) {
  return useQuery({
    queryKey: ['record-history', recordId],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('record_versions')
        .select('*')
        .eq('record_id', recordId)
        .order('version', { ascending: false });
      if (error) throw error;
      return data as RecordVersion[];
    },
    enabled: !!recordId,
  });
}

export function useRecordSearch(pipelineId: string, query: string) {
  return useQuery({
    queryKey: ['record-search', pipelineId, query],
    queryFn: async () => {
      return invokeFunction<Record_[]>('search-records', { pipeline_id: pipelineId, query });
    },
    enabled: !!pipelineId && !!query && query.length > 2,
  });
}
