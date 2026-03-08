// Shared types for NorthLens Edge Functions

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'url' | 'date';
  description: string;
}

export interface Pipeline {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  source_urls: string[];
  schema: SchemaField[];
  schedule?: string;
  extraction_mode: 'list' | 'detail';
  record_count: number;
  is_active: boolean;
  last_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DataRecord {
  id: string;
  pipeline_id: string;
  user_id: string;
  data: { [key: string]: any };
  content_hash: string;
  source_url: string;
  version: number;
  is_latest: boolean;
  first_seen_at: string;
  last_updated_at: string;
}

export interface RecordVersion {
  id: string;
  record_id: string;
  pipeline_id: string;
  version: number;
  old_data: { [key: string]: any };
  new_data: { [key: string]: any };
  changed_fields: string[];
  change_summary?: string;
  detected_at: string;
}

export interface AiChat {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  name: string;
  args: { [key: string]: any };
  result?: any;
}

export interface Profile {
  id: string;
  email: string;
  business_name?: string;
  business_type?: string;
  industry?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface DataImport {
  id: string;
  user_id: string;
  name: string;
  file_type: string;
  row_count: number;
  schema: SchemaField[];
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}
