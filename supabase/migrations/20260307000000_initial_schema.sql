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
