import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/types.ts';

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

    const { import_id, records } = await req.json();

    if (!import_id) {
      return errorResponse('import_id is required');
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return errorResponse('records[] is required and must not be empty');
    }

    // Verify user owns this import
    const { data: importData, error: importErr } = await supabase
      .from('data_imports')
      .select('id')
      .eq('id', import_id)
      .single();

    if (importErr || !importData) {
      return errorResponse('Import not found', 404);
    }

    // Insert records in batches
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize).map((data: any) => ({
        import_id,
        user_id: user.id,
        data,
      }));

      const { error: insertErr } = await supabase
        .from('import_records')
        .insert(batch);

      if (insertErr) {
        return errorResponse('Failed to insert records', 500, insertErr.message);
      }

      insertedCount += batch.length;
    }

    return jsonResponse(
      {
        import_id,
        inserted: insertedCount,
      },
      201,
      corsHeaders
    );
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});
