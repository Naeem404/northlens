// ============================================================
// NorthLens Database Types
// These types are the shared contract between all agents.
// ============================================================

export interface Profile {
  id: string;
  email: string | null;
  business_name: string;
  business_type: string;
  industry: string;
  location: string;
  province: string;
  website_url: string;
  business_profile: BusinessProfile;
  plan: 'free' | 'pro' | 'business';
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  goals?: string[];
  competitors?: string[];
  product_categories?: string[];
  price_range?: { min: number; max: number };
  notes?: string;
}

export interface Pipeline {
  id: string;
  user_id: string;
  name: string;
  description: string;
  prompt: string;
  schema: SchemaField[];
  sources: PipelineSource[];
  extraction_mode: 'list' | 'detail';
  schedule: 'hourly' | 'daily' | 'weekly' | 'manual';
  status: 'active' | 'paused' | 'running' | 'error';
  last_run_at: string | null;
  last_run_status: string | null;
  last_run_error: string | null;
  record_count: number;
  created_at: string;
  updated_at: string;
}

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

export interface DataRecord {
  id: string;
  pipeline_id: string;
  user_id: string;
  data: Record<string, any>;
  content_hash: string;
  source_url: string | null;
  version: number;
  is_latest: boolean;
  first_seen_at: string;
  last_updated_at: string;
  created_at: string;
}

export interface RecordVersion {
  id: string;
  record_id: string;
  pipeline_id: string;
  version: number;
  old_data: Record<string, any> | null;
  new_data: Record<string, any>;
  changed_fields: string[];
  change_summary: string | null;
  detected_at: string;
}

export interface DataImport {
  id: string;
  user_id: string;
  name: string;
  source_type: 'csv' | 'shopify' | 'manual' | 'api';
  schema: SchemaField[];
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface ImportRecord {
  id: string;
  import_id: string;
  user_id: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  id: string;
  user_id: string;
  name: string;
  layout: WidgetLayout[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Widget {
  id: string;
  dashboard_id: string;
  type: 'kpi' | 'line_chart' | 'bar_chart' | 'radar' | 'table' | 'feed' | 'opportunity';
  title: string;
  config: WidgetConfig;
  position: { x: number; y: number; w: number; h: number };
  created_at: string;
}

export interface WidgetConfig {
  pipeline_id?: string;
  import_id?: string;
  metric_field?: string;
  compare_field?: string;
  time_range?: string;
  filters?: FilterCondition[];
  chart_config?: any;
}

export interface Alert {
  id: string;
  user_id: string;
  pipeline_id: string | null;
  name: string;
  condition: AlertCondition;
  delivery_method: 'in_app' | 'email' | 'webhook';
  delivery_config: Record<string, any>;
  is_active: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
}

export interface AlertCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte' | 'changed' | 'pct_change_gt';
  value: any;
  threshold?: number;
}

export interface AlertEvent {
  id: string;
  alert_id: string;
  user_id: string;
  record_id: string | null;
  summary: string;
  data: Record<string, any>;
  is_read: boolean;
  triggered_at: string;
}

export interface AiChat {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  context: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_results?: any;
  timestamp: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface SavedQuery {
  id: string;
  user_id: string;
  name: string;
  description: string;
  sql_query: string;
  visualization_config: Record<string, any>;
  created_at: string;
}

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'starts_with';
  value: any;
}

// ============================================================
// API Request/Response Types (SHARED CONTRACT)
// ============================================================

// Pipeline endpoints
export interface CreatePipelineRequest {
  prompt: string;
  sources: { url: string; label?: string }[];
  schedule?: string;
  name?: string;
}

export interface CreatePipelineResponse {
  pipeline: Pipeline;
  preview_records: Record<string, any>[];
}

export interface PipelinePreviewRequest {
  url: string;
  prompt: string;
}

export interface PipelinePreviewResponse {
  schema: SchemaField[];
  records: Record<string, any>[];
  source_url: string;
}

export interface RunPipelineResponse {
  run_id: string;
  status: 'running' | 'completed' | 'error';
  records_extracted?: number;
  records_new?: number;
  records_updated?: number;
  error?: string;
}

// Query endpoints
export interface QueryRecordsRequest {
  pipeline_id: string;
  filters?: FilterCondition[];
  sort?: { field: string; direction: 'asc' | 'desc' }[];
  search?: { text: string; threshold?: number };
  page?: number;
  limit?: number;
  time_range?: { start: string; end: string };
}

export interface QueryRecordsResponse {
  records: DataRecord[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface QuerySqlRequest {
  sql: string;
}

export interface QuerySqlResponse {
  columns: string[];
  rows: any[][];
  row_count: number;
  execution_time_ms: number;
}

export interface QuerySummaryResponse {
  pipeline_id: string;
  total_records: number;
  recent_changes: RecordVersion[];
  metrics: {
    field: string;
    avg: number | null;
    min: number | null;
    max: number | null;
    trend: number | null;
  }[];
}

// Data-In endpoints
export interface CsvUploadResponse {
  import_id: string;
  detected_schema: SchemaField[];
  preview: Record<string, any>[];
  row_count: number;
}

export interface CsvConfirmRequest {
  import_id: string;
  column_mapping: Record<string, string>;
  name: string;
}

// Dashboard endpoints
export interface DashboardResponse {
  dashboard: Dashboard;
  widgets: Widget[];
}

export interface WidgetDataResponse {
  widget_id: string;
  data: any;
  updated_at: string;
}

// AI endpoints (Agent 3 implements, you provide the plumbing)
export interface AiChatRequest {
  message: string;
  chat_id?: string;
}

// Alert endpoints
export interface CreateAlertRequest {
  pipeline_id?: string;
  name: string;
  condition: AlertCondition;
  delivery_method?: string;
}
