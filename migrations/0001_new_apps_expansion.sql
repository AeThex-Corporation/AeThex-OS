-- New tables for AeThex-OS app expansion
-- Migration: 0001_new_apps_expansion.sql

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" varchar PRIMARY KEY NOT NULL,
	"sender_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"content" text NOT NULL,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "marketplace_listings" (
	"id" varchar PRIMARY KEY NOT NULL,
	"seller_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"category" varchar DEFAULT 'code' NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"image_url" text,
	"content_url" text,
	"is_featured" boolean DEFAULT false,
	"purchase_count" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspace_settings" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"theme" varchar DEFAULT 'dark',
	"font_size" integer DEFAULT 14,
	"show_sidebar" boolean DEFAULT true,
	"notifications_enabled" boolean DEFAULT true,
	"email_notifications" boolean DEFAULT true,
	"auto_save" boolean DEFAULT true,
	"word_wrap" boolean DEFAULT true,
	"show_minimap" boolean DEFAULT true,
	"privacy_profile_visible" boolean DEFAULT true,
	"privacy_activity_visible" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "workspace_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "files" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"content" text,
	"size" integer DEFAULT 0,
	"language" varchar,
	"parent_id" varchar,
	"is_folder" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar DEFAULT 'system' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"read" boolean DEFAULT false,
	"action_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_analytics" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"total_xp" integer DEFAULT 0,
	"projects_completed" integer DEFAULT 0,
	"achievements_unlocked" integer DEFAULT 0,
	"messages_sent" integer DEFAULT 0,
	"marketplace_purchases" integer DEFAULT 0,
	"code_snippets_shared" integer DEFAULT 0,
	"daily_active_minutes" integer DEFAULT 0,
	"last_active" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_analytics_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "code_gallery" (
	"id" varchar PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"code" text NOT NULL,
	"language" varchar NOT NULL,
	"category" varchar DEFAULT 'snippet',
	"tags" json DEFAULT '[]'::json,
	"likes" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documentation" (
	"id" varchar PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" varchar NOT NULL,
	"content" text NOT NULL,
	"category" varchar DEFAULT 'guide',
	"order" integer DEFAULT 0,
	"is_published" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "documentation_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_apps" (
	"id" varchar PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"config" json DEFAULT '{}'::json,
	"is_public" boolean DEFAULT false,
	"install_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" varchar DEFAULT 'planning',
	"progress" integer DEFAULT 0,
	"tech_stack" json DEFAULT '[]'::json,
	"live_url" text,
	"github_url" text,
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages" ("sender_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_recipient_id_idx" ON "messages" ("recipient_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "marketplace_listings_seller_id_idx" ON "marketplace_listings" ("seller_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "marketplace_listings_category_idx" ON "marketplace_listings" ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_user_id_idx" ON "files" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_parent_id_idx" ON "files" ("parent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_analytics_user_id_idx" ON "user_analytics" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "code_gallery_creator_id_idx" ON "code_gallery" ("creator_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_user_id_idx" ON "projects" ("user_id");
