-- Revenue Events: Track platform revenue by organization and project
CREATE TABLE IF NOT EXISTS revenue_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id VARCHAR NOT NULL REFERENCES organizations(id),
  project_id VARCHAR REFERENCES projects(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  gross_amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Indexes for revenue_events
CREATE INDEX IF NOT EXISTS idx_revenue_events_org_created ON revenue_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_events_project_created ON revenue_events(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_events_source ON revenue_events(source_type, source_id);
