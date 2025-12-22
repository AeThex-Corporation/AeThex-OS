CREATE TABLE "achievements" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"points_reward" integer DEFAULT 0,
	"badge_color" text,
	"rarity" text,
	"xp_reward" integer DEFAULT 0,
	"category" varchar DEFAULT 'milestone' NOT NULL,
	CONSTRAINT "achievements_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "aethex_alerts" (
	"id" varchar PRIMARY KEY NOT NULL,
	"site_id" varchar,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"is_resolved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "aethex_applications" (
	"id" varchar PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"opportunity_id" varchar NOT NULL,
	"status" text DEFAULT 'submitted',
	"cover_letter" text,
	"response_message" text,
	"applied_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aethex_creators" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"username" text NOT NULL,
	"bio" text,
	"skills" json DEFAULT '[]'::json,
	"avatar_url" text,
	"experience_level" text,
	"arm_affiliations" json DEFAULT '[]'::json,
	"primary_arm" text,
	"is_discoverable" boolean DEFAULT true,
	"allow_recommendations" boolean DEFAULT true,
	"devconnect_linked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "aethex_creators_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "aethex_events" (
	"id" varchar PRIMARY KEY NOT NULL,
	"site_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"time" text NOT NULL,
	"location" text,
	"capacity" integer,
	"image_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"category" text,
	"price" numeric,
	"featured" boolean,
	"speakers" json,
	"agenda" json,
	"full_description" text,
	"map_url" text,
	"ticket_types" json
);
--> statement-breakpoint
CREATE TABLE "aethex_opportunities" (
	"id" varchar PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"job_type" text NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"experience_level" text,
	"arm_affiliation" text NOT NULL,
	"posted_by_id" varchar NOT NULL,
	"status" text DEFAULT 'open',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aethex_passports" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "aethex_passports_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "aethex_projects" (
	"id" varchar PRIMARY KEY NOT NULL,
	"creator_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text,
	"image_url" text,
	"tags" json DEFAULT '[]'::json,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aethex_sites" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"status" text,
	"uptime" numeric,
	"response_time" integer,
	"users" integer,
	"requests" integer,
	"last_check" timestamp,
	"services" json,
	"metrics" json,
	"created_at" timestamp DEFAULT now(),
	"metrics_history" json,
	"owner_id" varchar,
	"api_key_hash" text,
	"handshake_token" text,
	"handshake_token_expires_at" timestamp,
	CONSTRAINT "aethex_sites_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" varchar PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"location" text,
	"role_interest" text,
	"primary_skill" text,
	"experience_level" text,
	"availability" text,
	"portfolio_url" text,
	"resume_url" text,
	"interests" json,
	"message" text,
	"status" text DEFAULT 'new' NOT NULL,
	"submitted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" varchar PRIMARY KEY NOT NULL,
	"username" text,
	"role" text DEFAULT 'member',
	"onboarded" boolean DEFAULT false,
	"bio" text,
	"skills" json,
	"avatar_url" text,
	"banner_url" text,
	"social_links" json,
	"loyalty_points" integer DEFAULT 0,
	"email" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_type" text DEFAULT 'community_member',
	"experience_level" text DEFAULT 'beginner',
	"full_name" text,
	"location" text,
	"total_xp" integer DEFAULT 0,
	"level" integer DEFAULT 1,
	"aethex_passport_id" varchar,
	"status" text DEFAULT 'offline',
	"is_verified" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" varchar PRIMARY KEY NOT NULL,
	"owner_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'planning',
	"github_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_id" varchar,
	"engine" text,
	"priority" text DEFAULT 'medium',
	"progress" integer DEFAULT 0,
	"live_url" text,
	"technologies" json
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"achievement_id" varchar,
	"site_id" text,
	"created_at" timestamp DEFAULT now(),
	"unlocked_at" timestamp DEFAULT now(),
	"earned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" varchar PRIMARY KEY NOT NULL,
	"username" text,
	"full_name" text,
	"avatar_url" text,
	"user_type" text NOT NULL,
	"experience_level" text DEFAULT 'beginner',
	"bio" text,
	"location" text,
	"website_url" text,
	"github_url" text,
	"twitter_url" text,
	"linkedin_url" text,
	"total_xp" integer DEFAULT 0,
	"level" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_streak_at" timestamp,
	"loyalty_points" integer DEFAULT 0,
	"reputation_score" integer DEFAULT 0,
	"wallet_address" varchar,
	"show_in_creator_directory" boolean DEFAULT false,
	"arms" json DEFAULT '[]'::json,
	"roles" json DEFAULT '[]'::json,
	"last_active_at" timestamp DEFAULT now(),
	"streak_days" integer DEFAULT 0,
	"roblox_user_id" text,
	"roblox_username" text,
	"unity_player_id" text,
	"unreal_player_id" text,
	"godot_player_id" text,
	"merged_to_user_id" varchar,
	"aethex_domain" text,
	"discord_id" text,
	"discord_username" text,
	"is_architect" boolean DEFAULT false,
	"xp" integer DEFAULT 0,
	"daily_streak" integer DEFAULT 0,
	"last_daily" timestamp,
	"last_xp_message" timestamp,
	"badges" json DEFAULT '[]'::json,
	CONSTRAINT "user_profiles_username_unique" UNIQUE("username"),
	CONSTRAINT "user_profiles_wallet_address_unique" UNIQUE("wallet_address"),
	CONSTRAINT "user_profiles_roblox_user_id_unique" UNIQUE("roblox_user_id"),
	CONSTRAINT "user_profiles_unity_player_id_unique" UNIQUE("unity_player_id"),
	CONSTRAINT "user_profiles_unreal_player_id_unique" UNIQUE("unreal_player_id"),
	CONSTRAINT "user_profiles_godot_player_id_unique" UNIQUE("godot_player_id"),
	CONSTRAINT "user_profiles_discord_id_unique" UNIQUE("discord_id")
);
