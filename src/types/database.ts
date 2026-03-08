// NorthLens Database Types — matches actual Supabase schema
// Updated to match the live database column names exactly

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          business_name: string | null;
          business_type: string | null;
          industry: string | null;
          location: string | null;
          province: string | null;
          website_url: string | null;
          business_profile: Json | null;
          plan: string | null;
          onboarding_complete: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      pipelines: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          prompt: string;
          schema: PipelineField[];
          sources: PipelineSource[];
          extraction_mode: 'list' | 'detail';
          schedule: 'hourly' | 'daily' | 'weekly' | 'manual';
          status: 'active' | 'running' | 'error' | 'paused';
          last_run_at: string | null;
          last_run_status: string | null;
          last_run_error: string | null;
          record_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pipelines']['Row'], 'id' | 'created_at' | 'updated_at' | 'record_count'>;
        Update: Partial<Database['public']['Tables']['pipelines']['Insert']>;
      };
      records: {
        Row: {
          id: string;
          pipeline_id: string;
          user_id: string;
          data: Record<string, Json>;
          content_hash: string;
          source_url: string | null;
          version: number;
          is_latest: boolean;
          first_seen_at: string;
          last_updated_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['records']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['records']['Insert']>;
      };
      record_versions: {
        Row: {
          id: string;
          record_id: string;
          pipeline_id: string;
          version: number;
          old_data: Json | null;
          new_data: Json;
          changed_fields: string[];
          change_summary: string | null;
          detected_at: string;
        };
        Insert: Omit<Database['public']['Tables']['record_versions']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['record_versions']['Insert']>;
      };
      dashboards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          layout: Json;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['dashboards']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['dashboards']['Insert']>;
      };
      ai_chats: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          messages: Json;
          context: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ai_chats']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['ai_chats']['Insert']>;
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          pipeline_id: string | null;
          name: string;
          condition: Json;
          delivery_method: string | null;
          delivery_config: Json | null;
          is_active: boolean;
          last_triggered_at: string | null;
          trigger_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'created_at' | 'trigger_count'>;
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>;
      };
      alert_events: {
        Row: {
          id: string;
          alert_id: string;
          user_id: string;
          record_id: string | null;
          summary: string;
          data: Json | null;
          is_read: boolean;
          triggered_at: string;
        };
        Insert: Omit<Database['public']['Tables']['alert_events']['Row'], 'id' | 'triggered_at'>;
        Update: Partial<Database['public']['Tables']['alert_events']['Insert']>;
      };
      data_imports: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          source_type: 'csv' | 'manual' | 'api' | 'shopify';
          schema: PipelineField[];
          record_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['data_imports']['Row'], 'id' | 'created_at' | 'updated_at' | 'record_count'>;
        Update: Partial<Database['public']['Tables']['data_imports']['Insert']>;
      };
      import_records: {
        Row: {
          id: string;
          import_id: string;
          user_id: string;
          data: Record<string, Json>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['import_records']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['import_records']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export interface PipelineField {
  name: string;
  type: 'text' | 'number' | 'currency' | 'url' | 'date' | 'boolean' | 'rating';
  description?: string;
}

export interface PipelineSource {
  url: string;
  enabled: boolean;
}

export interface DashboardWidget {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'kpi' | 'chart' | 'feed' | 'opportunity';
  config: Record<string, Json>;
}

export type Pipeline = Database['public']['Tables']['pipelines']['Row'];
export type Record_ = Database['public']['Tables']['records']['Row'];
export type RecordVersion = Database['public']['Tables']['record_versions']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Dashboard = Database['public']['Tables']['dashboards']['Row'];
export type AiChat = Database['public']['Tables']['ai_chats']['Row'];
export type Alert = Database['public']['Tables']['alerts']['Row'];
export type AlertEvent = Database['public']['Tables']['alert_events']['Row'];
export type DataImport = Database['public']['Tables']['data_imports']['Row'];
export type ImportRecord = Database['public']['Tables']['import_records']['Row'];
