import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient, getSupabaseAdmin } from '../_shared/supabase.ts';
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

    const { pipeline_id } = await req.json();
    if (!pipeline_id) {
      return errorResponse('pipeline_id is required');
    }

    // Load pipeline (RLS ensures user owns it)
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('*')
      .eq('id', pipeline_id)
      .single();

    if (pipelineError || !pipeline) {
      return errorResponse('Pipeline not found', 404);
    }

    // Mark pipeline as running
    await supabase
      .from('pipelines')
      .update({ status: 'running', updated_at: new Date().toISOString() })
      .eq('id', pipeline_id);

    const runId = crypto.randomUUID();
    let recordsExtracted = 0;
    let recordsNew = 0;
    let recordsUpdated = 0;

    try {
      const enabledSources = (pipeline.sources as any[]).filter((s: any) => s.enabled);

      for (const source of enabledSources) {
        // Extract records from source (Agent 3 provides real implementation)
        const extracted = await extractFromSource(
          source.url,
          pipeline.prompt,
          pipeline.schema
        );

        for (const item of extracted) {
          recordsExtracted++;

          // Compute content hash for deduplication
          const sortedData = sortObjectKeys(item);
          const hash = await computeHash(JSON.stringify(sortedData));

          // Check if record already exists
          const { data: existing } = await supabase
            .from('records')
            .select('id, data, version')
            .eq('pipeline_id', pipeline_id)
            .eq('content_hash', hash)
            .eq('is_latest', true)
            .maybeSingle();

          if (existing) {
            // Check if data actually changed
            const changed = detectChanges(existing.data, item);
            if (changed.length > 0) {
              const newVersion = (existing.version || 1) + 1;

              // Create version record
              const adminClient = getSupabaseAdmin();
              await adminClient.from('record_versions').insert({
                record_id: existing.id,
                pipeline_id,
                version: newVersion,
                old_data: existing.data,
                new_data: item,
                changed_fields: changed,
                change_summary: `Updated fields: ${changed.join(', ')}`,
              });

              // Update existing record
              await supabase
                .from('records')
                .update({
                  data: item,
                  version: newVersion,
                  last_updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);

              recordsUpdated++;
            }
            // If no changes, skip (dedup)
          } else {
            // Insert new record
            await supabase.from('records').insert({
              pipeline_id,
              user_id: user.id,
              data: item,
              content_hash: hash,
              source_url: source.url,
              version: 1,
              is_latest: true,
            });
            recordsNew++;
          }
        }
      }

      // Mark pipeline as completed
      await supabase
        .from('pipelines')
        .update({
          status: 'active',
          last_run_at: new Date().toISOString(),
          last_run_status: 'completed',
          last_run_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pipeline_id);

      return jsonResponse(
        {
          run_id: runId,
          status: 'completed',
          records_extracted: recordsExtracted,
          records_new: recordsNew,
          records_updated: recordsUpdated,
        },
        200,
        corsHeaders
      );
    } catch (runErr) {
      // Mark pipeline as error
      await supabase
        .from('pipelines')
        .update({
          status: 'error',
          last_run_at: new Date().toISOString(),
          last_run_status: 'error',
          last_run_error: String(runErr),
          updated_at: new Date().toISOString(),
        })
        .eq('id', pipeline_id);

      return jsonResponse(
        {
          run_id: runId,
          status: 'error',
          error: String(runErr),
        },
        200,
        corsHeaders
      );
    }
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});

function sortObjectKeys(obj: Record<string, any>): Record<string, any> {
  const sorted: Record<string, any> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }
  return sorted;
}

async function computeHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data).catch(async () => {
    // Fallback: use SHA-256 if MD5 not available in this runtime
    return await crypto.subtle.digest('SHA-256', data);
  });
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function detectChanges(
  oldData: Record<string, any>,
  newData: Record<string, any>
): string[] {
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  for (const key of allKeys) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changed.push(key);
    }
  }
  return changed;
}

async function extractFromSource(
  _url: string,
  _prompt: string,
  _schema: any[]
): Promise<Record<string, any>[]> {
  // Placeholder: Agent 3 will provide the real extraction logic via Gemini.
  // This function will be replaced with actual web scraping + LLM extraction.
  return [];
}
