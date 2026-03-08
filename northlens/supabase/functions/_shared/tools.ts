// Tool definitions for Gemini function calling in the AI chat advisor

export const AI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'execute_sql',
        description: 'Execute a read-only SQL query against the user\'s competitive intelligence data. Use this to answer data questions. Only SELECT statements are allowed.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'A SELECT SQL query. Use data->>\'field\' for JSONB access. Always filter by pipeline_id and user_id.',
            },
            explanation: {
              type: 'string',
              description: 'Brief explanation of what this query does.',
            },
          },
          required: ['query', 'explanation'],
        },
      },
      {
        name: 'search_records',
        description: 'Semantic search across pipeline data. Finds records similar to the search query by meaning.',
        parameters: {
          type: 'object',
          properties: {
            pipeline_id: { type: 'string', description: 'Pipeline to search in' },
            query: { type: 'string', description: 'Natural language search query' },
            limit: { type: 'number', description: 'Max results (default 10)' },
          },
          required: ['pipeline_id', 'query'],
        },
      },
      {
        name: 'create_chart',
        description: 'Generate a chart visualization to display in the chat. Returns chart config that the frontend renders.',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['line', 'bar', 'radar', 'pie'], description: 'Chart type' },
            title: { type: 'string', description: 'Chart title' },
            data: {
              type: 'array',
              description: 'Array of data points. Each item should have label and value(s).',
              items: { type: 'object' },
            },
            x_field: { type: 'string', description: 'Field name for X axis' },
            y_fields: {
              type: 'array',
              description: 'Field name(s) for Y axis',
              items: { type: 'string' },
            },
          },
          required: ['type', 'title', 'data', 'x_field', 'y_fields'],
        },
      },
      {
        name: 'get_price_history',
        description: 'Get historical values for a specific record and field, showing how it changed over time.',
        parameters: {
          type: 'object',
          properties: {
            record_id: { type: 'string', description: 'Record UUID' },
            field: { type: 'string', description: 'Field name to track' },
          },
          required: ['record_id', 'field'],
        },
      },
      {
        name: 'compare_records',
        description: 'Side-by-side comparison of multiple records on specified fields.',
        parameters: {
          type: 'object',
          properties: {
            record_ids: {
              type: 'array',
              description: 'Record UUIDs to compare',
              items: { type: 'string' },
            },
            fields: {
              type: 'array',
              description: 'Fields to compare',
              items: { type: 'string' },
            },
          },
          required: ['record_ids', 'fields'],
        },
      },
    ],
  },
];

// Execute a tool call and return the result
export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  supabase: any,
  userId: string
): Promise<any> {
  switch (toolName) {
    case 'execute_sql': {
      // Security: only allow SELECT
      const sql = args.query.trim();
      if (!/^SELECT/i.test(sql)) {
        return { error: 'Only SELECT queries are allowed.' };
      }
      const blocked = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i;
      if (blocked.test(sql)) {
        return { error: 'Mutation queries are not allowed.' };
      }

      const { data, error } = await supabase.rpc('execute_readonly_query', {
        query_text: sql,
      });

      if (error) return { error: error.message };
      return { rows: data, explanation: args.explanation };
    }

    case 'search_records': {
      const { data, error } = await supabase
        .from('records')
        .select('id, data, source_url, last_updated_at')
        .eq('pipeline_id', args.pipeline_id)
        .eq('user_id', userId)
        .eq('is_latest', true)
        .limit(args.limit || 10);

      if (error) return { error: error.message };
      return { results: data };
    }

    case 'create_chart': {
      // Return the chart config for frontend rendering
      return {
        type: 'chart',
        chart_type: args.type,
        title: args.title,
        data: args.data,
        x_field: args.x_field,
        y_fields: args.y_fields,
      };
    }

    case 'get_price_history': {
      const { data, error } = await supabase
        .from('record_versions')
        .select('version, old_data, new_data, detected_at')
        .eq('record_id', args.record_id)
        .order('version', { ascending: true });

      if (error) return { error: error.message };

      const history = data.map((v: any) => ({
        version: v.version,
        value: v.new_data?.[args.field],
        previous: v.old_data?.[args.field],
        date: v.detected_at,
      }));

      return { field: args.field, history };
    }

    case 'compare_records': {
      const { data, error } = await supabase
        .from('records')
        .select('id, data')
        .in('id', args.record_ids)
        .eq('is_latest', true);

      if (error) return { error: error.message };

      const comparison = data.map((r: any) => {
        const row: Record<string, any> = { id: r.id };
        for (const field of args.fields) {
          row[field] = r.data[field];
        }
        return row;
      });

      return { comparison, fields: args.fields };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
