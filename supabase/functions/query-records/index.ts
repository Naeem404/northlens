import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/types.ts';
import type { FilterCondition } from '../_shared/types.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    const body = await req.json();
    const {
      pipeline_id,
      filters,
      sort,
      search,
      page = 1,
      limit = 50,
      time_range,
    } = body;

    if (!pipeline_id) {
      return errorResponse('pipeline_id is required');
    }

    // Verify user owns this pipeline (RLS handles it, but explicit check is safer)
    const { data: pipeline, error: pipelineErr } = await supabase
      .from('pipelines')
      .select('id')
      .eq('id', pipeline_id)
      .single();

    if (pipelineErr || !pipeline) {
      return errorResponse('Pipeline not found', 404);
    }

    // Build base query
    let query = supabase
      .from('records')
      .select('*', { count: 'exact' })
      .eq('pipeline_id', pipeline_id)
      .eq('is_latest', true);

    // Apply time range filter
    if (time_range?.start) {
      query = query.gte('created_at', time_range.start);
    }
    if (time_range?.end) {
      query = query.lte('created_at', time_range.end);
    }

    // Apply JSONB filters on data column
    if (filters && Array.isArray(filters)) {
      for (const filter of filters as FilterCondition[]) {
        const path = `data->>${filter.field}`;
        switch (filter.operator) {
          case 'eq':
            query = query.eq(path, filter.value);
            break;
          case 'ne':
            query = query.neq(path, filter.value);
            break;
          case 'gt':
            query = query.gt(path, filter.value);
            break;
          case 'lt':
            query = query.lt(path, filter.value);
            break;
          case 'gte':
            query = query.gte(path, filter.value);
            break;
          case 'lte':
            query = query.lte(path, filter.value);
            break;
          case 'contains':
            query = query.ilike(path, `%${filter.value}%`);
            break;
          case 'starts_with':
            query = query.ilike(path, `${filter.value}%`);
            break;
        }
      }
    }

    // Apply sorting
    if (sort && Array.isArray(sort)) {
      for (const s of sort) {
        // Sort on JSONB fields via data column
        query = query.order(`data->>${s.field}`, {
          ascending: s.direction === 'asc',
        });
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const safeLimit = Math.min(Math.max(1, limit), 200);
    const offset = (Math.max(1, page) - 1) * safeLimit;
    query = query.range(offset, offset + safeLimit - 1);

    const { data: records, error: queryError, count } = await query;

    if (queryError) {
      return errorResponse('Query failed', 500, queryError.message);
    }

    const total = count || 0;

    return jsonResponse(
      {
        records: records || [],
        total,
        page,
        limit: safeLimit,
        has_more: offset + safeLimit < total,
      },
      200,
      corsHeaders
    );
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});
