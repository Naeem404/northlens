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

    const url = new URL(req.url);

    // GET — list alerts or alert events
    if (req.method === 'GET') {
      const type = url.searchParams.get('type') || 'alerts';

      if (type === 'events') {
        const unreadOnly = url.searchParams.get('unread') === 'true';
        let query = supabase
          .from('alert_events')
          .select('*, alerts(name, pipeline_id)')
          .order('triggered_at', { ascending: false })
          .limit(50);

        if (unreadOnly) {
          query = query.eq('is_read', false);
        }

        const { data: events, error: eventsErr } = await query;
        if (eventsErr) {
          return errorResponse('Failed to fetch events', 500, eventsErr.message);
        }

        return jsonResponse({ events: events || [] }, 200, corsHeaders);
      }

      // Default: list alerts
      const { data: alerts, error: alertsErr } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (alertsErr) {
        return errorResponse('Failed to fetch alerts', 500, alertsErr.message);
      }

      return jsonResponse({ alerts: alerts || [] }, 200, corsHeaders);
    }

    // POST — create alert, check alerts, or mark events read
    if (req.method === 'POST') {
      const body = await req.json();
      const action = body.action || 'create';

      if (action === 'create') {
        const { pipeline_id, name, condition, delivery_method } = body;

        if (!name || !condition) {
          return errorResponse('name and condition are required');
        }

        const { data: alert, error: createErr } = await supabase
          .from('alerts')
          .insert({
            user_id: user.id,
            pipeline_id: pipeline_id || null,
            name,
            condition,
            delivery_method: delivery_method || 'in_app',
            delivery_config: {},
            is_active: true,
          })
          .select()
          .single();

        if (createErr) {
          return errorResponse('Failed to create alert', 500, createErr.message);
        }

        return jsonResponse({ alert }, 201, corsHeaders);
      }

      if (action === 'check') {
        // Check all active alerts against latest records
        const results = await checkAlerts(supabase, user.id);
        return jsonResponse({ checked: results.checked, triggered: results.triggered }, 200, corsHeaders);
      }

      if (action === 'mark_read') {
        const { event_ids } = body;

        if (!event_ids || !Array.isArray(event_ids)) {
          return errorResponse('event_ids[] is required');
        }

        const { error: updateErr } = await supabase
          .from('alert_events')
          .update({ is_read: true })
          .in('id', event_ids);

        if (updateErr) {
          return errorResponse('Failed to mark events as read', 500, updateErr.message);
        }

        return jsonResponse({ status: 'updated', count: event_ids.length }, 200, corsHeaders);
      }

      if (action === 'mark_all_read') {
        const { error: updateErr } = await supabase
          .from('alert_events')
          .update({ is_read: true })
          .eq('is_read', false);

        if (updateErr) {
          return errorResponse('Failed to mark all as read', 500, updateErr.message);
        }

        return jsonResponse({ status: 'updated' }, 200, corsHeaders);
      }

      return errorResponse('Unknown action');
    }

    // PATCH — update alert
    if (req.method === 'PATCH') {
      const body = await req.json();
      const { alert_id, ...updates } = body;

      if (!alert_id) {
        return errorResponse('alert_id is required');
      }

      // Only allow safe fields
      const safeFields: Record<string, any> = {};
      if ('name' in updates) safeFields.name = updates.name;
      if ('condition' in updates) safeFields.condition = updates.condition;
      if ('is_active' in updates) safeFields.is_active = updates.is_active;
      if ('delivery_method' in updates) safeFields.delivery_method = updates.delivery_method;

      const { data: alert, error: updateErr } = await supabase
        .from('alerts')
        .update(safeFields)
        .eq('id', alert_id)
        .select()
        .single();

      if (updateErr) {
        return errorResponse('Failed to update alert', 500, updateErr.message);
      }

      return jsonResponse({ alert }, 200, corsHeaders);
    }

    // DELETE — delete alert
    if (req.method === 'DELETE') {
      const { alert_id } = await req.json();
      if (!alert_id) {
        return errorResponse('alert_id is required');
      }

      const { error: deleteErr } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alert_id);

      if (deleteErr) {
        return errorResponse('Failed to delete alert', 500, deleteErr.message);
      }

      return jsonResponse({ status: 'deleted' }, 200, corsHeaders);
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});

async function checkAlerts(supabase: any, userId: string) {
  // Get all active alerts for this user
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('is_active', true);

  if (!alerts || alerts.length === 0) {
    return { checked: 0, triggered: 0 };
  }

  let triggered = 0;

  for (const alert of alerts) {
    const condition = alert.condition;
    if (!condition || !condition.field) continue;

    // Get latest records for this alert's pipeline
    let query = supabase
      .from('records')
      .select('id, data')
      .eq('is_latest', true);

    if (alert.pipeline_id) {
      query = query.eq('pipeline_id', alert.pipeline_id);
    }

    const { data: records } = await query.limit(100);
    if (!records || records.length === 0) continue;

    // Check condition against each record
    for (const record of records) {
      const fieldValue = record.data?.[condition.field];
      if (fieldValue === undefined || fieldValue === null) continue;

      const numValue = typeof fieldValue === 'number' ? fieldValue : parseFloat(fieldValue);
      const condValue = typeof condition.value === 'number' ? condition.value : parseFloat(condition.value);
      let matches = false;

      switch (condition.operator) {
        case 'gt': matches = numValue > condValue; break;
        case 'lt': matches = numValue < condValue; break;
        case 'eq': matches = fieldValue == condition.value; break;
        case 'ne': matches = fieldValue != condition.value; break;
        case 'gte': matches = numValue >= condValue; break;
        case 'lte': matches = numValue <= condValue; break;
        case 'changed':
          // Check if there's a recent version for this record
          const { data: versions } = await supabase
            .from('record_versions')
            .select('id')
            .eq('record_id', record.id)
            .limit(1);
          matches = versions && versions.length > 0;
          break;
      }

      if (matches) {
        // Create alert event
        await supabase.from('alert_events').insert({
          alert_id: alert.id,
          user_id: userId,
          record_id: record.id,
          summary: `Alert "${alert.name}" triggered: ${condition.field} ${condition.operator} ${condition.value}`,
          data: { field_value: fieldValue, condition },
        });

        // Update alert
        await supabase
          .from('alerts')
          .update({
            last_triggered_at: new Date().toISOString(),
            trigger_count: (alert.trigger_count || 0) + 1,
          })
          .eq('id', alert.id);

        triggered++;
        break; // One trigger per alert per check
      }
    }
  }

  return { checked: alerts.length, triggered };
}
