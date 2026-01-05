-- Migration: Add organization_id to existing tables
-- Created: 2026-01-05
-- Description: Adds nullable organization_id column to user-scoped tables

-- ============================================
-- ADD ORGANIZATION_ID COLUMNS (nullable)
-- ============================================

-- Projects
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "owner_user_id" varchar;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "organization_id" varchar;

-- AeThex Projects
ALTER TABLE "aethex_projects" ADD COLUMN IF NOT EXISTS "organization_id" varchar;

-- Marketplace
ALTER TABLE "marketplace_listings" ADD COLUMN IF NOT EXISTS "organization_id" varchar;
ALTER TABLE "marketplace_transactions" ADD COLUMN IF NOT EXISTS "organization_id" varchar;

-- Files
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "organization_id" varchar;

-- Custom Apps
ALTER TABLE "custom_apps" ADD COLUMN IF NOT EXISTS "organization_id" varchar;

-- AeThex Sites
ALTER TABLE "aethex_sites" ADD COLUMN IF NOT EXISTS "organization_id" varchar;

-- AeThex Opportunities
ALTER TABLE "aethex_opportunities" ADD COLUMN IF NOT EXISTS "organization_id" varchar;

-- AeThex Events
ALTER TABLE "aethex_events" ADD COLUMN IF NOT EXISTS "organization_id" varchar;

-- ============================================
-- ADD FOREIGN KEY CONSTRAINTS (nullable for now)
-- ============================================

ALTER TABLE "projects" 
  ADD CONSTRAINT "fk_projects_organization" 
  FOREIGN KEY ("organization_id") 
  REFERENCES "organizations"("id") 
  ON DELETE RESTRICT;

ALTER TABLE "aethex_projects" 
  ADD CONSTRAINT "fk_aethex_projects_organization" 
  FOREIGN KEY ("organization_id") 
  REFERENCES "organizations"("id") 
  ON DELETE RESTRICT;

ALTER TABLE "marketplace_listings" 
  ADD CONSTRAINT "fk_marketplace_listings_organization" 
  FOREIGN KEY ("organization_id") 
  REFERENCES "organizations"("id") 
  ON DELETE RESTRICT;

ALTER TABLE "marketplace_transactions" 
  ADD CONSTRAINT "fk_marketplace_transactions_organization" 
  FOREIGN KEY ("organization_id") 
  REFERENCES "organizations"("id") 
  ON DELETE RESTRICT;

ALTER TABLE "files" 
  ADD CONSTRAINT "fk_files_organization" 
  FOREIGN KEY ("organization_id") 
  REFERENCES "organizations"("id") 
  ON DELETE RESTRICT;

ALTER TABLE "custom_apps" 
  ADD CONSTRAINT "fk_custom_apps_organization" 
  FOREIGN KEY ("organization_id") 
  REFERENCES "organizations"("id") 
  ON DELETE RESTRICT;

ALTER TABLE "aethex_sites" 
  ADD CONSTRAINT "fk_aethex_sites_organization" 
  FOREIGN KEY ("organization_id") 
  REFERENCES "organizations"("id") 
  ON DELETE RESTRICT;

ALTER TABLE "aethex_opportunities" 
  ADD CONSTRAINT "fk_aethex_opportunities_organization" 
  FOREIGN KEY ("organization_id") 
  REFERENCES "organizations"("id") 
  ON DELETE RESTRICT;

ALTER TABLE "aethex_events" 
  ADD CONSTRAINT "fk_aethex_events_organization" 
  FOREIGN KEY ("organization_id") 
  REFERENCES "organizations"("id") 
  ON DELETE RESTRICT;

-- ============================================
-- CREATE INDEXES FOR ORGANIZATION_ID
-- ============================================

CREATE INDEX IF NOT EXISTS "idx_projects_organization" ON "projects"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_aethex_projects_organization" ON "aethex_projects"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_marketplace_listings_organization" ON "marketplace_listings"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_marketplace_transactions_organization" ON "marketplace_transactions"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_files_organization" ON "files"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_custom_apps_organization" ON "custom_apps"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_aethex_sites_organization" ON "aethex_sites"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_aethex_opportunities_organization" ON "aethex_opportunities"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_aethex_events_organization" ON "aethex_events"("organization_id");

-- ============================================
-- STANDARDIZE PROJECT OWNERSHIP
-- ============================================

-- Backfill owner_user_id from existing user_id/owner_id
UPDATE "projects" 
SET "owner_user_id" = COALESCE("user_id", "owner_id") 
WHERE "owner_user_id" IS NULL;

