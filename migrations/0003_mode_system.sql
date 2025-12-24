-- Mode System: User preferences and workspace policy enforcement

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aethex_user_mode_preference" (
	"id" varchar PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
	"user_id" varchar NOT NULL UNIQUE,
	"mode" varchar NOT NULL DEFAULT 'foundation',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aethex_workspace_policy" (
	"id" varchar PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
	"workspace_id" varchar NOT NULL UNIQUE,
	"enforced_realm" varchar,
	"allowed_modes" json DEFAULT '["foundation","corporation"]'::json,
	"commerce_enabled" boolean DEFAULT false,
	"social_enabled" boolean DEFAULT false,
	"messaging_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aethex_user_mode_preference_user_id_idx" ON "aethex_user_mode_preference" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aethex_workspace_policy_workspace_id_idx" ON "aethex_workspace_policy" ("workspace_id");
