# AGENT 1: Backend & Infrastructure
## NorthLens — Supabase + API + Auth + Database

---

## YOUR ROLE
You are building the **entire backend** for NorthLens. This includes the Supabase project, database schema, all API Edge Functions, authentication, demo data seeding, and the API contracts that the frontend (Agent 2) and AI engine (Agent 3) will consume.

**You are the source of truth for all data shapes and API contracts.**

---

## PRODUCT CONTEXT (Read This First)

NorthLens is a web platform that combines:
- **LightFeed-style web data pipelines** — users describe data they want to extract from websites in natural language, and the system builds automated extraction pipelines
- **Triple Whale-style analytics** — unified dashboards, dynamic tables, Data-In/Data-Out APIs, AI-powered querying

**Target users:** Small Canadian businesses needing competitive intelligence.

**Key flows:**
1. User creates a pipeline via NL prompt → system generates schema → extracts data from websites → stores in versioned DB
2. User views data in powerful tables (sort, filter, group, export)
3. User builds a dashboard with KPI widgets and charts
4. User asks AI questions about their data (handled by Agent 3)
5. User imports their own business data (CSV, manual, API)
6. System detects changes and triggers alerts

---

## PROJECT STRUCTURE

The project is a **Next.js 15 monorepo** with Supabase. You own the `supabase/` directory and the `src/lib/supabase/` directory.

```
northlens/
├── .env.local                    ← YOU CREATE (Supabase keys + service role)
├── package.json                  ← Agent 2 creates, you add supabase deps
├── supabase/
│   ├── config.toml               ← YOU CREATE
│   ├── migrations/
│   │   └── 20260307000000_initial_schema.sql  ← YOU CREATE
│   ├── seed.sql                  ← YOU CREATE (demo data)
│   └── functions/
│       ├── _shared/
│       │   ├── cors.ts           ← YOU CREATE (shared CORS headers)
│       │   ├── supabase.ts       ← YOU CREATE (shared Supabase client init)
│       │   └── types.ts          ← YOU CREATE (shared TypeScript types)
│       ├── pipeline-create/
│       │   └── index.ts          ← YOU CREATE
│       ├── pipeline-run/
│       │   └── index.ts          ← YOU CREATE (Agent 3 provides extraction logic)
│       ├── pipeline-preview/
│       │   └── index.ts          ← YOU CREATE
│       ├── query-records/
│       │   └── index.ts          ← YOU CREATE
│       ├── query-sql/
│       │   └── index.ts          ← YOU CREATE
│       ├── query-summary/
│       │   └── index.ts          ← YOU CREATE
│       ├── data-in-csv/
│       │   └── index.ts          ← YOU CREATE
│       ├── data-in-manual/
│       │   └── index.ts          ← YOU CREATE
│       ├── dashboard-widgets/
│       │   └── index.ts          ← YOU CREATE
│       └── alerts/
│           └── index.ts          ← YOU CREATE
├── src/
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts         ← YOU CREATE (browser Supabase client)
│   │       ├── server.ts         ← YOU CREATE (server-side Supabase client)
│   │       └── middleware.ts     ← YOU CREATE (auth middleware)
│   └── types/
│       └── database.ts           ← YOU CREATE (TypeScript types for all tables)
```

---

## DELIVERABLE 1: DATABASE SCHEMA

Create `supabase/migrations/20260307000000_initial_schema.sql`:

```sql
-- ============================================================
-- NorthLens Database Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    business_name TEXT NOT NULL DEFAULT 'My Business',
    business_type TEXT DEFAULT 'ecommerce',
    industry TEXT DEFAULT '',
    location TEXT DEFAULT '',
    province TEXT DEFAULT '',
    website_url TEXT DEFAULT '',
    business_profile JSONB DEFAULT '{}',
    plan TEXT DEFAULT 'free',
    onboarding_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PIPELINES (extraction configurations)
-- ============================================================
CREATE TABLE public.pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    prompt TEXT NOT NULL,
    schema JSONB NOT NULL DEFAULT '[]',
    sources JSONB NOT NULL DEFAULT '[]',
    extraction_mode TEXT DEFAULT 'list' CHECK (extraction_mode IN ('list', 'detail')),
    schedule TEXT DEFAULT 'daily' CHECK (schedule IN ('hourly', 'daily', 'weekly', 'manual')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'running', 'error')),
    last_run_at TIMESTAMPTZ,
    last_run_status TEXT,
    last_run_error TEXT,
    record_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RECORDS (extracted data)
-- ============================================================
CREATE TABLE public.records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    content_hash TEXT NOT NULL,
    source_url TEXT,
    version INTEGER DEFAULT 1,
    embedding vector(768),
    is_latest BOOLEAN DEFAULT TRUE,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RECORD VERSIONS (change history)
-- ============================================================
CREATE TABLE public.record_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    old_data JSONB,
    new_data JSONB NOT NULL,
    changed_fields TEXT[] DEFAULT '{}',
    change_summary TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DATA IMPORTS (user's own business data)
-- ============================================================
CREATE TABLE public.data_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'shopify', 'manual', 'api')),
    schema JSONB NOT NULL DEFAULT '[]',
    record_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.import_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_id UUID NOT NULL REFERENCES public.data_imports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DASHBOARDS & WIDGETS
-- ============================================================
CREATE TABLE public.dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Main Dashboard',
    layout JSONB NOT NULL DEFAULT '[]',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('kpi', 'line_chart', 'bar_chart', 'radar', 'table', 'feed', 'opportunity')),
    title TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    position JSONB NOT NULL DEFAULT '{"x":0,"y":0,"w":4,"h":3}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    condition JSONB NOT NULL,
    delivery_method TEXT DEFAULT 'in_app' CHECK (delivery_method IN ('in_app', 'email', 'webhook')),
    delivery_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.alert_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    record_id UUID REFERENCES public.records(id) ON DELETE SET NULL,
    summary TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI CHATS
-- ============================================================
CREATE TABLE public.ai_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Chat',
    messages JSONB NOT NULL DEFAULT '[]',
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SAVED QUERIES
-- ============================================================
CREATE TABLE public.saved_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    sql_query TEXT NOT NULL,
    visualization_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_pipelines_user ON public.pipelines(user_id);
CREATE INDEX idx_records_pipeline ON public.records(pipeline_id) WHERE is_latest = TRUE;
CREATE INDEX idx_records_user ON public.records(user_id);
CREATE INDEX idx_records_hash ON public.records(content_hash);
CREATE INDEX idx_records_data ON public.records USING GIN(data);
CREATE INDEX idx_record_versions_record ON public.record_versions(record_id);
CREATE INDEX idx_alert_events_user_unread ON public.alert_events(user_id) WHERE is_read = FALSE;
CREATE INDEX idx_import_records_import ON public.import_records(import_id);
CREATE INDEX idx_ai_chats_user ON public.ai_chats(user_id);

-- Vector indexes (create after data exists for better performance)
-- CREATE INDEX idx_records_embedding ON public.records USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_queries ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users manage own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Pipelines
CREATE POLICY "Users manage own pipelines" ON public.pipelines
    FOR ALL USING (auth.uid() = user_id);

-- Records
CREATE POLICY "Users manage own records" ON public.records
    FOR ALL USING (auth.uid() = user_id);

-- Record Versions
CREATE POLICY "Users view own record versions" ON public.record_versions
    FOR SELECT USING (
        pipeline_id IN (SELECT id FROM public.pipelines WHERE user_id = auth.uid())
    );

-- Data Imports
CREATE POLICY "Users manage own imports" ON public.data_imports
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own import records" ON public.import_records
    FOR ALL USING (auth.uid() = user_id);

-- Dashboards
CREATE POLICY "Users manage own dashboards" ON public.dashboards
    FOR ALL USING (auth.uid() = user_id);

-- Widgets (via dashboard ownership)
CREATE POLICY "Users manage own widgets" ON public.widgets
    FOR ALL USING (
        dashboard_id IN (SELECT id FROM public.dashboards WHERE user_id = auth.uid())
    );

-- Alerts
CREATE POLICY "Users manage own alerts" ON public.alerts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own alert events" ON public.alert_events
    FOR ALL USING (auth.uid() = user_id);

-- AI Chats
CREATE POLICY "Users manage own chats" ON public.ai_chats
    FOR ALL USING (auth.uid() = user_id);

-- Saved Queries
CREATE POLICY "Users manage own queries" ON public.saved_queries
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to update pipeline record count
CREATE OR REPLACE FUNCTION public.update_pipeline_record_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.pipelines
    SET record_count = (
        SELECT COUNT(*) FROM public.records
        WHERE pipeline_id = COALESCE(NEW.pipeline_id, OLD.pipeline_id)
        AND is_latest = TRUE
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.pipeline_id, OLD.pipeline_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_record_change
    AFTER INSERT OR DELETE ON public.records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_pipeline_record_count();

-- Function to update import record count
CREATE OR REPLACE FUNCTION public.update_import_record_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.data_imports
    SET record_count = (
        SELECT COUNT(*) FROM public.import_records
        WHERE import_id = COALESCE(NEW.import_id, OLD.import_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.import_id, OLD.import_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_import_record_change
    AFTER INSERT OR DELETE ON public.import_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_import_record_count();
```

---

## DELIVERABLE 2: TYPESCRIPT TYPES

Create `src/types/database.ts`:

```typescript
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

export interface Record {
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
  i: string; // widget id
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
  records: Record[];
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
    trend: number | null; // percentage change
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
  data: any; // Depends on widget type
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
```

---

## DELIVERABLE 3: SUPABASE CLIENT HELPERS

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}
```

Create `src/lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/signup') && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

---

## DELIVERABLE 4: EDGE FUNCTIONS

### Shared utilities

Create `supabase/functions/_shared/cors.ts`:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

Create `supabase/functions/_shared/supabase.ts`:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function getSupabaseClient(req: Request) {
  const authHeader = req.headers.get('Authorization')!;
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

export function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}
```

### Key Edge Functions to implement:

**`pipeline-create/index.ts`** — Receives `{ prompt, sources[], schedule, name? }`. Calls Agent 3's schema generation (or a simple Gemini call to generate schema from prompt). Creates the pipeline row. Returns pipeline + schema.

**`pipeline-run/index.ts`** — Receives `{ pipeline_id }`. Loads pipeline config, iterates sources, calls extraction (Agent 3's logic), deduplicates by content_hash, stores new/updated records, creates record_versions for changes. Updates pipeline status.

**`pipeline-preview/index.ts`** — Receives `{ url, prompt }`. Does a one-off extraction (no storage). Returns schema + extracted records.

**`query-records/index.ts`** — Receives query params (pipeline_id, filters, sort, search, pagination). Builds Supabase query dynamically. For semantic search, use pgvector cosine similarity. Returns paginated records.

**`query-sql/index.ts`** — Receives `{ sql }`. Validates SQL is SELECT-only (no mutations). Executes against user's data. Returns columns + rows. **SECURITY: Only allow SELECT statements. Block DROP, DELETE, INSERT, UPDATE, ALTER, CREATE, TRUNCATE.**

**`query-summary/index.ts`** — Receives `{ pipeline_id }`. Computes aggregate metrics on numeric fields (avg, min, max), counts recent changes (last 7 days), returns summary object.

**`data-in-csv/index.ts`** — Receives multipart form data with CSV file. Parses CSV, auto-detects column types, creates data_import row, returns preview with detected schema.

**`data-in-manual/index.ts`** — Receives `{ import_id, records[] }`. Inserts into import_records.

**`dashboard-widgets/index.ts`** — Receives `{ widget_id }`. Loads widget config, fetches relevant data, computes metrics for KPI/chart widgets. Returns widget-specific data payload.

**`alerts/index.ts`** — CRUD for alerts + an endpoint to check alert conditions against latest records.

---

## DELIVERABLE 5: DEMO SEED DATA

Create `supabase/seed.sql` with realistic Canadian competitive intelligence data:

- A profile for "Northern Outfitters" (demo business in Waterloo, ON)
- 3 pipelines: "Winter Jacket Prices" (28 records from 3 competitors), "Competitor Reviews", "Industry News"
- 28 records for jackets with realistic Canadian brand data (Canadian Tire, MEC, Altitude Sports)
- 5-6 record_versions showing price changes over "2 weeks"
- 1 data_import with 15 of "our" products (CSV import)
- 15 import_records for our products
- 1 dashboard with 6 widgets
- 2 alerts (price drop, new product)
- 3 alert_events
- 1 AI chat with a demo conversation

**IMPORTANT: Use realistic Canadian pricing in CAD, realistic product names, and real Canadian brand names.**

---

## DELIVERABLE 6: ENV VARIABLES

Document these in `.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_AI_API_KEY=your-gemini-key
```

---

## INTEGRATION POINTS

| What | Who provides | Who consumes |
|---|---|---|
| Database schema + types | **You (Agent 1)** | Agent 2, Agent 3 |
| Supabase client helpers | **You (Agent 1)** | Agent 2, Agent 3 |
| Edge Function endpoints | **You (Agent 1)** | Agent 2 (via fetch), Agent 3 (AI functions) |
| Extraction logic (LLM) | Agent 3 provides | **You import into pipeline-run** |
| AI chat endpoint | Agent 3 implements | Agent 2 renders |
| Frontend pages | Agent 2 builds | Consumes your API |
| Demo seed data | **You (Agent 1)** | Agent 2 (renders), Agent 3 (AI analyzes) |

---

## BUILD ORDER

1. Set up Supabase project + run migration
2. Create TypeScript types file
3. Create Supabase client helpers
4. Build Edge Functions (start with query-records, then pipeline-create, then data-in-csv)
5. Seed demo data
6. Test all endpoints with curl
7. Document any API changes for Agent 2/3

---

## CRITICAL RULES

1. **All Edge Functions must handle CORS** (OPTIONS preflight + corsHeaders)
2. **All Edge Functions must validate auth** (extract user from JWT)
3. **SQL endpoint must be SELECT-only** (regex block all mutation keywords)
4. **Content hash** for dedup = MD5 of `JSON.stringify(sorted_keys_data)`
5. **Timestamps** always in ISO 8601 with timezone (TIMESTAMPTZ)
6. **IDs** always UUID v4
7. **JSONB** for all flexible data (records.data, widget.config, etc.)
