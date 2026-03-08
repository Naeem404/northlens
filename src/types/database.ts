// This file will be provided by Agent 1 (Backend) with generated Supabase types.
// Stub types below allow the frontend to compile independently.

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
          email: string;
          full_name: string | null;
          business_name: string | null;
          business_type: string | null;
          industry: string | null;
          location: string | null;
          website: string | null;
          plan: string;
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
          prompt: string;
          schema: PipelineField[];
          sources: PipelineSource[];
          schedule: 'hourly' | 'daily' | 'weekly' | 'manual';
          mode: 'list' | 'detail';
          status: 'active' | 'running' | 'error' | 'paused';
          record_count: number;
          last_run_at: string | null;
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
          data: Record<string, Json>;
          source_url: string | null;
          extracted_at: string;
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
          changed_fields: Record<string, { old: Json; new: Json }>;
          version: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['record_versions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['record_versions']['Insert']>;
      };
      dashboards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          layout: DashboardWidget[];
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
          pipeline_id: string;
          name: string;
          field: string;
          operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
          value: string;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>;
      };
      alert_events: {
        Row: {
          id: string;
          alert_id: string;
          record_id: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['alert_events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['alert_events']['Insert']>;
      };
      data_imports: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          source_type: 'csv' | 'manual' | 'api';
          schema: PipelineField[];
          record_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['data_imports']['Row'], 'id' | 'created_at' | 'record_count'>;
        Update: Partial<Database['public']['Tables']['data_imports']['Insert']>;
      };
      import_records: {
        Row: {
          id: string;
          import_id: string;
          data: Record<string, Json>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['import_records']['Row'], 'id' | 'created_at'>;
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
