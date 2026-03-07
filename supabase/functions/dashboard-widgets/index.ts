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

    if (req.method === 'GET') {
      // GET /dashboard-widgets — list user's dashboards + widgets
      const dashboardId = url.searchParams.get('dashboard_id');

      if (dashboardId) {
        // Get specific dashboard with widgets
        const { data: dashboard, error: dashErr } = await supabase
          .from('dashboards')
          .select('*')
          .eq('id', dashboardId)
          .single();

        if (dashErr || !dashboard) {
          return errorResponse('Dashboard not found', 404);
        }

        const { data: widgets, error: widgetsErr } = await supabase
          .from('widgets')
          .select('*')
          .eq('dashboard_id', dashboardId)
          .order('created_at', { ascending: true });

        if (widgetsErr) {
          return errorResponse('Failed to fetch widgets', 500, widgetsErr.message);
        }

        return jsonResponse({ dashboard, widgets: widgets || [] }, 200, corsHeaders);
      }

      // List all dashboards
      const { data: dashboards, error: listErr } = await supabase
        .from('dashboards')
        .select('*')
        .order('is_default', { ascending: false });

      if (listErr) {
        return errorResponse('Failed to list dashboards', 500, listErr.message);
      }

      return jsonResponse({ dashboards: dashboards || [] }, 200, corsHeaders);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const action = body.action || 'get_widget_data';

      if (action === 'get_widget_data') {
        // Fetch data for a specific widget
        const { widget_id } = body;
        if (!widget_id) {
          return errorResponse('widget_id is required');
        }

        const { data: widget, error: widgetErr } = await supabase
          .from('widgets')
          .select('*, dashboards!inner(user_id)')
          .eq('id', widget_id)
          .single();

        if (widgetErr || !widget) {
          return errorResponse('Widget not found', 404);
        }

        const widgetData = await computeWidgetData(supabase, widget);

        return jsonResponse(
          {
            widget_id,
            data: widgetData,
            updated_at: new Date().toISOString(),
          },
          200,
          corsHeaders
        );
      }

      if (action === 'create_dashboard') {
        const { name } = body;
        const { data: dashboard, error: createErr } = await supabase
          .from('dashboards')
          .insert({
            user_id: user.id,
            name: name || 'New Dashboard',
            layout: [],
            is_default: false,
          })
          .select()
          .single();

        if (createErr) {
          return errorResponse('Failed to create dashboard', 500, createErr.message);
        }

        return jsonResponse({ dashboard }, 201, corsHeaders);
      }

      if (action === 'create_widget') {
        const { dashboard_id, type, title, config, position } = body;

        if (!dashboard_id || !type || !title) {
          return errorResponse('dashboard_id, type, and title are required');
        }

        const { data: widget, error: createErr } = await supabase
          .from('widgets')
          .insert({
            dashboard_id,
            type,
            title,
            config: config || {},
            position: position || { x: 0, y: 0, w: 4, h: 3 },
          })
          .select()
          .single();

        if (createErr) {
          return errorResponse('Failed to create widget', 500, createErr.message);
        }

        return jsonResponse({ widget }, 201, corsHeaders);
      }

      if (action === 'update_layout') {
        const { dashboard_id, layout } = body;
        if (!dashboard_id || !layout) {
          return errorResponse('dashboard_id and layout are required');
        }

        const { error: updateErr } = await supabase
          .from('dashboards')
          .update({ layout, updated_at: new Date().toISOString() })
          .eq('id', dashboard_id);

        if (updateErr) {
          return errorResponse('Failed to update layout', 500, updateErr.message);
        }

        return jsonResponse({ status: 'updated' }, 200, corsHeaders);
      }

      return errorResponse('Unknown action');
    }

    if (req.method === 'DELETE') {
      const { widget_id, dashboard_id } = await req.json();

      if (widget_id) {
        const { error } = await supabase
          .from('widgets')
          .delete()
          .eq('id', widget_id);

        if (error) {
          return errorResponse('Failed to delete widget', 500, error.message);
        }
        return jsonResponse({ status: 'deleted' }, 200, corsHeaders);
      }

      if (dashboard_id) {
        const { error } = await supabase
          .from('dashboards')
          .delete()
          .eq('id', dashboard_id);

        if (error) {
          return errorResponse('Failed to delete dashboard', 500, error.message);
        }
        return jsonResponse({ status: 'deleted' }, 200, corsHeaders);
      }

      return errorResponse('widget_id or dashboard_id is required');
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});

async function computeWidgetData(supabase: any, widget: any): Promise<any> {
  const config = widget.config || {};
  const type = widget.type;

  if (type === 'kpi') {
    return await computeKPI(supabase, config);
  }

  if (type === 'line_chart' || type === 'bar_chart') {
    return await computeChartData(supabase, config, type);
  }

  if (type === 'table') {
    return await computeTableData(supabase, config);
  }

  if (type === 'feed') {
    return await computeFeedData(supabase, config);
  }

  if (type === 'opportunity') {
    return await computeOpportunityData(supabase, config);
  }

  return {};
}

async function computeKPI(supabase: any, config: any) {
  const { pipeline_id, metric_field } = config;
  if (!pipeline_id || !metric_field) return { value: 0, change: null };

  const { data: records } = await supabase
    .from('records')
    .select('data')
    .eq('pipeline_id', pipeline_id)
    .eq('is_latest', true);

  if (!records || records.length === 0) return { value: 0, change: null };

  const values = records
    .map((r: any) => parseFloat(r.data?.[metric_field]))
    .filter((v: number) => !isNaN(v));

  if (values.length === 0) return { value: 0, change: null };

  const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;

  return {
    value: Math.round(avg * 100) / 100,
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    change: null,
  };
}

async function computeChartData(supabase: any, config: any, _chartType: string) {
  const { pipeline_id, metric_field, compare_field } = config;
  if (!pipeline_id) return { labels: [], datasets: [] };

  const { data: records } = await supabase
    .from('records')
    .select('data, created_at')
    .eq('pipeline_id', pipeline_id)
    .eq('is_latest', true)
    .order('created_at', { ascending: true });

  if (!records || records.length === 0) return { labels: [], datasets: [] };

  const labels = records.map((r: any) =>
    compare_field ? (r.data?.[compare_field] || 'Unknown') : r.created_at.slice(0, 10)
  );

  const dataPoints = records.map((r: any) => {
    const val = parseFloat(r.data?.[metric_field || 'price']);
    return isNaN(val) ? 0 : val;
  });

  return {
    labels,
    datasets: [{ label: metric_field || 'Value', data: dataPoints }],
  };
}

async function computeTableData(supabase: any, config: any) {
  const { pipeline_id, import_id } = config;

  if (pipeline_id) {
    const { data: records } = await supabase
      .from('records')
      .select('id, data, source_url, created_at')
      .eq('pipeline_id', pipeline_id)
      .eq('is_latest', true)
      .limit(50);

    return { rows: records || [] };
  }

  if (import_id) {
    const { data: records } = await supabase
      .from('import_records')
      .select('id, data, created_at')
      .eq('import_id', import_id)
      .limit(50);

    return { rows: records || [] };
  }

  return { rows: [] };
}

async function computeFeedData(supabase: any, config: any) {
  const { pipeline_id } = config;

  const query = supabase
    .from('record_versions')
    .select('*, records(data, source_url)')
    .order('detected_at', { ascending: false })
    .limit(20);

  if (pipeline_id) {
    query.eq('pipeline_id', pipeline_id);
  }

  const { data: versions } = await query;
  return { changes: versions || [] };
}

async function computeOpportunityData(supabase: any, config: any) {
  const { pipeline_id } = config;
  if (!pipeline_id) return { opportunities: [] };

  // Find records with notable price drops or changes
  const { data: versions } = await supabase
    .from('record_versions')
    .select('*, records(data)')
    .eq('pipeline_id', pipeline_id)
    .order('detected_at', { ascending: false })
    .limit(10);

  return { opportunities: versions || [] };
}
