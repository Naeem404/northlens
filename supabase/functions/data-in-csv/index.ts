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

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const name = (formData.get('name') as string) || 'CSV Import';

      if (!file) {
        return errorResponse('file is required in form data');
      }

      const text = await file.text();
      return await processCSV(supabase, user.id, text, name);
    } else if (contentType.includes('application/json')) {
      // Handle confirm (finalize import with column mapping)
      const { import_id, column_mapping, name } = await req.json();

      if (!import_id) {
        return errorResponse('import_id is required');
      }

      // Get the import
      const { data: importData, error: importErr } = await supabase
        .from('data_imports')
        .select('*')
        .eq('id', import_id)
        .single();

      if (importErr || !importData) {
        return errorResponse('Import not found', 404);
      }

      // Update name if provided
      if (name) {
        await supabase
          .from('data_imports')
          .update({ name, updated_at: new Date().toISOString() })
          .eq('id', import_id);
      }

      return jsonResponse(
        { import_id, status: 'confirmed', name: name || importData.name },
        200,
        corsHeaders
      );
    }

    return errorResponse('Unsupported content type. Use multipart/form-data for upload or application/json for confirm.');
  } catch (err) {
    return errorResponse('Internal server error', 500, String(err));
  }
});

async function processCSV(supabase: any, userId: string, csvText: string, name: string) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length < 2) {
    return errorResponse('CSV must have a header row and at least one data row');
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const rows: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, any> = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j].trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      row[key] = autoType(values[j] || '');
    }
    rows.push(row);
  }

  // Auto-detect schema from data
  const schema = headers.map((h, idx) => {
    const key = h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const sampleValues = rows.slice(0, 10).map(r => r[key]);
    const detectedType = detectType(sampleValues);
    return {
      name: key,
      type: detectedType,
      description: h.trim(),
    };
  });

  // Create data_import record
  const { data: importRecord, error: importErr } = await supabase
    .from('data_imports')
    .insert({
      user_id: userId,
      name,
      source_type: 'csv',
      schema,
      record_count: rows.length,
    })
    .select()
    .single();

  if (importErr) {
    return errorResponse('Failed to create import', 500, importErr.message);
  }

  // Insert records in batches of 100
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize).map(data => ({
      import_id: importRecord.id,
      user_id: userId,
      data,
    }));

    const { error: insertErr } = await supabase
      .from('import_records')
      .insert(batch);

    if (insertErr) {
      return errorResponse('Failed to insert records', 500, insertErr.message);
    }
  }

  // Return preview (first 5 rows)
  return jsonResponse(
    {
      import_id: importRecord.id,
      detected_schema: schema,
      preview: rows.slice(0, 5),
      row_count: rows.length,
    },
    201,
    corsHeaders
  );
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function autoType(value: string): string | number | boolean {
  if (value === '') return '';
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  // Try number (handle CAD prices like "$149.99" or "149.99")
  const cleaned = value.replace(/[$,]/g, '');
  const num = Number(cleaned);
  if (!isNaN(num) && cleaned.length > 0) return num;

  return value;
}

function detectType(values: any[]): string {
  const nonEmpty = values.filter(v => v !== '' && v !== null && v !== undefined);
  if (nonEmpty.length === 0) return 'string';

  const allNumbers = nonEmpty.every(v => typeof v === 'number');
  if (allNumbers) return 'number';

  const allBooleans = nonEmpty.every(v => typeof v === 'boolean');
  if (allBooleans) return 'boolean';

  const urlPattern = /^https?:\/\//;
  const allUrls = nonEmpty.every(v => typeof v === 'string' && urlPattern.test(v));
  if (allUrls) return 'url';

  const datePattern = /^\d{4}-\d{2}-\d{2}/;
  const allDates = nonEmpty.every(v => typeof v === 'string' && datePattern.test(v));
  if (allDates) return 'date';

  return 'string';
}
