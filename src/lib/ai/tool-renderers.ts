// Render tool call results as React-friendly data structures

export interface ChartRenderData {
  type: 'line' | 'bar' | 'radar' | 'pie';
  title: string;
  data: any[];
  xField: string;
  yFields: string[];
}

export interface TableRenderData {
  columns: string[];
  rows: any[][];
}

export function parseToolResult(toolName: string, result: any): {
  type: 'chart' | 'table' | 'text' | 'comparison';
  data: any;
} {
  switch (toolName) {
    case 'execute_sql':
      if (result.rows && result.rows.length > 0) {
        return {
          type: 'table',
          data: {
            columns: Object.keys(result.rows[0]),
            rows: result.rows,
            explanation: result.explanation,
          },
        };
      }
      return { type: 'text', data: result.explanation || 'Query returned no results.' };

    case 'create_chart':
      return {
        type: 'chart',
        data: {
          type: result.chart_type,
          title: result.title,
          data: result.data,
          xField: result.x_field,
          yFields: result.y_fields,
        },
      };

    case 'get_price_history':
      return {
        type: 'chart',
        data: {
          type: 'line',
          title: `${result.field} History`,
          data: result.history,
          xField: 'date',
          yFields: ['value'],
        },
      };

    case 'compare_records':
      return {
        type: 'comparison',
        data: {
          fields: result.fields,
          records: result.comparison,
        },
      };

    case 'search_records':
      return {
        type: 'table',
        data: {
          columns: result.results?.[0] ? Object.keys(result.results[0].data) : [],
          rows: result.results?.map((r: any) => r.data) || [],
        },
      };

    default:
      return { type: 'text', data: JSON.stringify(result) };
  }
}
