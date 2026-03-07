// Shared types for Edge Functions (Deno runtime)
// These mirror src/types/database.ts for use in Edge Functions

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'url' | 'date';
  description: string;
}

export interface PipelineSource {
  url: string;
  label?: string;
  enabled: boolean;
}

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'starts_with';
  value: any;
}

export interface AlertCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte' | 'changed' | 'pct_change_gt';
  value: any;
  threshold?: number;
}

export interface ApiError {
  error: string;
  details?: string;
}

export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function errorResponse(message: string, status = 400, details?: string) {
  const body: ApiError = { error: message };
  if (details) body.details = details;
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
