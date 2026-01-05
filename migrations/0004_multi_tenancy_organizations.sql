-- Migration: Multi-tenancy Organizations
-- Created: 2026-01-05
-- Description: Adds organizations, organization_members, and project_collaborators tables

-- ============================================
-- CREATE ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"owner_user_id" varchar NOT NULL,
	"plan" text DEFAULT 'free',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- ============================================
-- CREATE ORGANIZATION_MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "organization_members" (
	"id" varchar PRIMARY KEY NOT NULL,
	"organization_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	UNIQUE("organization_id", "user_id")
);

-- ============================================
-- CREATE PROJECT_COLLABORATORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "project_collaborators" (
	"id" varchar PRIMARY KEY NOT NULL,
	"project_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" text DEFAULT 'contributor' NOT NULL,
	"permissions" json,
	"created_at" timestamp DEFAULT now(),
	UNIQUE("project_id", "user_id")
);

-- ============================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- Note: organizations.owner_user_id references profiles.id which references auth.users(id)
-- We do not create FK constraint because auth.users is in a different schema (managed by Supabase)
-- and profiles.id is VARCHAR while auth.users(id) is UUID. Application logic enforces referential integrity.

-- Organization members constraints
ALTER TABLE "organization_members" 
  ADD CONSTRAINT "fk_org_members_org" 
  FOREIGN KEY ("organization_id") 
  REFERENCES "organizations"("id") 
  ON DELETE RESTRICT;

-- Note: organization_members.user_id references profiles.id (no FK due to auth schema separation)

-- Project collaborators constraints
ALTER TABLE "project_collaborators" 
  ADD CONSTRAINT "fk_project_collaborators_project" 
  FOREIGN KEY ("project_id") 
  REFERENCES "projects"("id") 
  ON DELETE CASCADE;

-- Note: project_collaborators.user_id references profiles.id (no FK due to auth schema separation)

-- ============================================
-- CREATE INDEXES
-- ============================================

-- Organizations indexes
CREATE INDEX IF NOT EXISTS "idx_organizations_slug" ON "organizations"("slug");
CREATE INDEX IF NOT EXISTS "idx_organizations_owner" ON "organizations"("owner_user_id");

-- Organization members indexes
CREATE INDEX IF NOT EXISTS "idx_org_members_org" ON "organization_members"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_org_members_user" ON "organization_members"("user_id");
CREATE INDEX IF NOT EXISTS "idx_org_members_role" ON "organization_members"("role");

-- Project collaborators indexes
CREATE INDEX IF NOT EXISTS "idx_project_collaborators_project" ON "project_collaborators"("project_id");
CREATE INDEX IF NOT EXISTS "idx_project_collaborators_user" ON "project_collaborators"("user_id");

