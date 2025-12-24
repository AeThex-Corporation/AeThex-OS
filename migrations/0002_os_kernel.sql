-- AeThex OS Kernel Schema
-- Portable proof system for the entire ecosystem
-- This is the spine: identity coordination + entitlements + verification

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aethex_subjects" (
	"id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aethex_subject_identities" (
	"id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::text,
	"subject_id" varchar NOT NULL REFERENCES "aethex_subjects"("id") ON DELETE CASCADE,
	"provider" varchar NOT NULL,
	"external_id" varchar NOT NULL,
	"external_username" varchar,
	"verified_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "aethex_subject_identities_provider_external_id_unique" UNIQUE("provider", "external_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aethex_issuers" (
	"id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::text,
	"name" varchar NOT NULL,
	"issuer_class" varchar NOT NULL,
	"scopes" json DEFAULT '[]'::json,
	"public_key" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aethex_issuer_keys" (
	"id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::text,
	"issuer_id" varchar NOT NULL REFERENCES "aethex_issuers"("id") ON DELETE CASCADE,
	"public_key" text NOT NULL,
	"private_key_hash" text,
	"is_active" boolean DEFAULT true,
	"rotated_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aethex_entitlements" (
	"id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::text,
	"issuer_id" varchar NOT NULL REFERENCES "aethex_issuers"("id") ON DELETE CASCADE,
	"subject_id" varchar REFERENCES "aethex_subjects"("id") ON DELETE CASCADE,
	"external_subject_ref" varchar,
	"schema_version" varchar DEFAULT 'v0.1',
	"scope" varchar NOT NULL,
	"entitlement_type" varchar NOT NULL,
	"data" json NOT NULL,
	"status" varchar DEFAULT 'active',
	"signature" text,
	"evidence_hash" varchar,
	"issued_by_subject_id" varchar,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"revocation_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aethex_entitlement_events" (
	"id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::text,
	"entitlement_id" varchar NOT NULL REFERENCES "aethex_entitlements"("id") ON DELETE CASCADE,
	"event_type" varchar NOT NULL,
	"actor_id" varchar,
	"actor_type" varchar NOT NULL,
	"reason" text,
	"metadata" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aethex_audit_log" (
	"id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::text,
	"action" varchar NOT NULL,
	"actor_id" varchar,
	"actor_type" varchar NOT NULL,
	"resource_type" varchar NOT NULL,
	"resource_id" varchar NOT NULL,
	"changes" json DEFAULT '{}'::json,
	"ip_address" varchar,
	"user_agent" text,
	"status" varchar DEFAULT 'success',
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
-- OS Indexes for performance
CREATE INDEX IF NOT EXISTS "aethex_subject_identities_subject_id_idx" ON "aethex_subject_identities" ("subject_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aethex_subject_identities_provider_external_id_idx" ON "aethex_subject_identities" ("provider", "external_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aethex_issuer_keys_issuer_id_idx" ON "aethex_issuer_keys" ("issuer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aethex_entitlements_issuer_id_idx" ON "aethex_entitlements" ("issuer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aethex_entitlements_subject_id_idx" ON "aethex_entitlements" ("subject_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aethex_entitlements_external_subject_ref_idx" ON "aethex_entitlements" ("external_subject_ref");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aethex_entitlements_status_idx" ON "aethex_entitlements" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aethex_entitlement_events_entitlement_id_idx" ON "aethex_entitlement_events" ("entitlement_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aethex_audit_log_action_idx" ON "aethex_audit_log" ("action");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aethex_audit_log_resource_type_resource_id_idx" ON "aethex_audit_log" ("resource_type", "resource_id");
--> statement-breakpoint
