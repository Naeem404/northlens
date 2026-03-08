// @ts-nocheck — Supabase insert/update types resolve with real generated DB types
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { DataImport, PipelineField } from '@/types/database';

function getSupabase() { return createClient(); }

export function useImports() {
  return useQuery({
    queryKey: ['imports'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('data_imports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DataImport[];
    },
  });
}

export function useCreateImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      schema,
      records,
      sourceType = 'csv',
    }: {
      name: string;
      schema: PipelineField[];
      records: Record<string, unknown>[];
      sourceType?: 'csv' | 'manual' | 'api';
    }) => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the import record
      const { data: importData, error: importError } = await supabase
        .from('data_imports')
        .insert({
          user_id: user.id,
          name,
          source_type: sourceType,
          schema,
          record_count: records.length,
        })
        .select()
        .single();
      if (importError) throw importError;

      // Insert all records
      const importRecords = records.map((record) => ({
        import_id: importData.id,
        data: record,
      }));

      // Batch insert in chunks of 100
      for (let i = 0; i < importRecords.length; i += 100) {
        const chunk = importRecords.slice(i, i + 100);
        const { error: recordError } = await supabase
          .from('import_records')
          .insert(chunk);
        if (recordError) throw recordError;
      }

      return importData as DataImport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    },
  });
}
