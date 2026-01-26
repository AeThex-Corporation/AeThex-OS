import { pgTable, text, varchar, boolean, integer, timestamp, json, decimal, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Profiles table (linked to Supabase auth.users via id)
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey(), // References auth.users(id)
  username: text("username"),
  role: text("role").default("member"),
  onboarded: boolean("onboarded").default(false),
  bio: text("bio"),
  skills: json("skills").$type<string[] | null>(),
  avatar_url: text("avatar_url"),
  banner_url: text("banner_url"),
  social_links: json("social_links").$type<Record<string, string>>(),
  loyalty_points: integer("loyalty_points").default(0),
  email: text("email"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  user_type: text("user_type").default("community_member"),
  experience_level: text("experience_level").default("beginner"),
  full_name: text("full_name"),
  location: text("location"),
  total_xp: integer("total_xp").default(0),
  level: integer("level").default(1),
  aethex_passport_id: varchar("aethex_passport_id"),
  status: text("status").default("offline"),
  is_verified: boolean("is_verified").default(false),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  created_at: true,
  updated_at: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey(),
  owner_id: varchar("owner_id"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("planning"),
  github_url: text("github_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  user_id: varchar("user_id"),
  engine: text("engine"),
  priority: text("priority").default("medium"),
  progress: integer("progress").default(0),
  live_url: text("live_url"),
  technologies: json("technologies").$type<string[] | null>(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Login schema for Supabase Auth (email + password)
export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Signup schema
export const signupSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(2, "Username must be at least 2 characters").optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

// Chat messages table for AI conversation memory
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey(),
  user_id: varchar("user_id").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  created_at: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// AeThex Sites table
export const aethex_sites = pgTable("aethex_sites", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  url: text("url"),
  status: text("status"),
  uptime: decimal("uptime"),
  response_time: integer("response_time"),
  users: integer("users"),
  requests: integer("requests"),
  last_check: timestamp("last_check"),
  services: json("services").$type<string[] | null>(),
  metrics: json("metrics"),
  created_at: timestamp("created_at").defaultNow(),
  metrics_history: json("metrics_history").$type<any[] | null>(),
  owner_id: varchar("owner_id"),
  api_key_hash: text("api_key_hash"),
  handshake_token: text("handshake_token"),
  handshake_token_expires_at: timestamp("handshake_token_expires_at"),
});

export const insertAethexSiteSchema = createInsertSchema(aethex_sites).omit({
  created_at: true,
});

export type InsertAethexSite = z.infer<typeof insertAethexSiteSchema>;
export type AethexSite = typeof aethex_sites.$inferSelect;

// AeThex Alerts table
export const aethex_alerts = pgTable("aethex_alerts", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  site_id: varchar("site_id"),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  is_resolved: boolean("is_resolved").default(false),
  created_at: timestamp("created_at").defaultNow(),
  resolved_at: timestamp("resolved_at"),
});

export const insertAethexAlertSchema = createInsertSchema(aethex_alerts).omit({
  created_at: true,
});

export type InsertAethexAlert = z.infer<typeof insertAethexAlertSchema>;
export type AethexAlert = typeof aethex_alerts.$inferSelect;

// AeThex Applications table
export const aethex_applications = pgTable("aethex_applications", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  creator_id: varchar("creator_id").notNull(),
  opportunity_id: varchar("opportunity_id").notNull(),
  status: text("status").default("submitted"),
  cover_letter: text("cover_letter"),
  response_message: text("response_message"),
  applied_at: timestamp("applied_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertAethexApplicationSchema = createInsertSchema(aethex_applications).omit({
  applied_at: true,
  updated_at: true,
});

export type InsertAethexApplication = z.infer<typeof insertAethexApplicationSchema>;
export type AethexApplication = typeof aethex_applications.$inferSelect;

// AeThex Creators table
export const aethex_creators = pgTable("aethex_creators", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: varchar("user_id").notNull(),
  username: text("username").notNull().unique(),
  bio: text("bio"),
  skills: json("skills").$type<string[]>().default([]),
  avatar_url: text("avatar_url"),
  experience_level: text("experience_level"),
  arm_affiliations: json("arm_affiliations").$type<string[]>().default([]),
  primary_arm: text("primary_arm"),
  is_discoverable: boolean("is_discoverable").default(true),
  allow_recommendations: boolean("allow_recommendations").default(true),
  devconnect_linked: boolean("devconnect_linked").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertAethexCreatorSchema = createInsertSchema(aethex_creators).omit({
  created_at: true,
  updated_at: true,
});

export type InsertAethexCreator = z.infer<typeof insertAethexCreatorSchema>;
export type AethexCreator = typeof aethex_creators.$inferSelect;

// AeThex Passports table
export const aethex_passports = pgTable("aethex_passports", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: varchar("user_id").notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertAethexPassportSchema = createInsertSchema(aethex_passports).omit({
  created_at: true,
});

export type InsertAethexPassport = z.infer<typeof insertAethexPassportSchema>;
export type AethexPassport = typeof aethex_passports.$inferSelect;

// AeThex Projects table
export const aethex_projects = pgTable("aethex_projects", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  creator_id: varchar("creator_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  image_url: text("image_url"),
  tags: json("tags").$type<string[]>().default([]),
  is_featured: boolean("is_featured").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertAethexProjectSchema = createInsertSchema(aethex_projects).omit({
  created_at: true,
  updated_at: true,
});

export type InsertAethexProject = z.infer<typeof insertAethexProjectSchema>;
export type AethexProject = typeof aethex_projects.$inferSelect;

// User Profiles table (extended profiles)
export const user_profiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey(),
  username: text("username").unique(),
  full_name: text("full_name"),
  avatar_url: text("avatar_url"),
  user_type: text("user_type").notNull(),
  experience_level: text("experience_level").default("beginner"),
  bio: text("bio"),
  location: text("location"),
  website_url: text("website_url"),
  github_url: text("github_url"),
  twitter_url: text("twitter_url"),
  linkedin_url: text("linkedin_url"),
  total_xp: integer("total_xp").default(0),
  level: integer("level").default(1),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  current_streak: integer("current_streak").default(0),
  longest_streak: integer("longest_streak").default(0),
  last_streak_at: timestamp("last_streak_at"),
  loyalty_points: integer("loyalty_points").default(0),
  reputation_score: integer("reputation_score").default(0),
  wallet_address: varchar("wallet_address").unique(),
  show_in_creator_directory: boolean("show_in_creator_directory").default(false),
  arms: json("arms").$type<string[]>().default([]),
  roles: json("roles").$type<string[]>().default([]),
  last_active_at: timestamp("last_active_at").defaultNow(),
  streak_days: integer("streak_days").default(0),
  roblox_user_id: text("roblox_user_id").unique(),
  roblox_username: text("roblox_username"),
  unity_player_id: text("unity_player_id").unique(),
  unreal_player_id: text("unreal_player_id").unique(),
  godot_player_id: text("godot_player_id").unique(),
  merged_to_user_id: varchar("merged_to_user_id"),
  aethex_domain: text("aethex_domain"),
  discord_id: text("discord_id").unique(),
  discord_username: text("discord_username"),
  is_architect: boolean("is_architect").default(false),
  xp: integer("xp").default(0),
  daily_streak: integer("daily_streak").default(0),
  last_daily: timestamp("last_daily"),
  last_xp_message: timestamp("last_xp_message"),
  badges: json("badges").default([]),
});

export const insertUserProfileSchema = createInsertSchema(user_profiles).omit({
  created_at: true,
  updated_at: true,
  last_active_at: true,
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof user_profiles.$inferSelect;

// Achievements table
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  points_reward: integer("points_reward").default(0),
  badge_color: text("badge_color"),
  rarity: text("rarity"),
  xp_reward: integer("xp_reward").default(0),
  category: varchar("category").notNull().default("milestone"),
});

export const insertAchievementSchema = createInsertSchema(achievements);

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

// User Achievements table
export const user_achievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: varchar("user_id"),
  achievement_id: varchar("achievement_id"),
  site_id: text("site_id"),
  created_at: timestamp("created_at").defaultNow(),
  unlocked_at: timestamp("unlocked_at").defaultNow(),
  earned_at: timestamp("earned_at").defaultNow(),
});

export const insertUserAchievementSchema = createInsertSchema(user_achievements).omit({
  created_at: true,
  unlocked_at: true,
  earned_at: true,
});

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof user_achievements.$inferSelect;

// Applications table
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull(),
  full_name: text("full_name").notNull(),
  email: text("email").notNull(),
  location: text("location"),
  role_interest: text("role_interest"),
  primary_skill: text("primary_skill"),
  experience_level: text("experience_level"),
  availability: text("availability"),
  portfolio_url: text("portfolio_url"),
  resume_url: text("resume_url"),
  interests: json("interests").$type<string[] | null>(),
  message: text("message"),
  status: text("status").notNull().default("new"),
  submitted_at: timestamp("submitted_at").defaultNow(),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  submitted_at: true,
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

// AeThex Opportunities table
export const aethex_opportunities = pgTable("aethex_opportunities", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  job_type: text("job_type").notNull(),
  salary_min: integer("salary_min"),
  salary_max: integer("salary_max"),
  experience_level: text("experience_level"),
  arm_affiliation: text("arm_affiliation").notNull(),
  posted_by_id: varchar("posted_by_id").notNull(),
  status: text("status").default("open"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertAethexOpportunitySchema = createInsertSchema(aethex_opportunities).omit({
  created_at: true,
  updated_at: true,
});

export type InsertAethexOpportunity = z.infer<typeof insertAethexOpportunitySchema>;
export type AethexOpportunity = typeof aethex_opportunities.$inferSelect;

// AeThex Events table
export const aethex_events = pgTable("aethex_events", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  site_id: varchar("site_id"),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(), // Note: date is timestamp in Drizzle
  time: text("time").notNull(), // time as text
  location: text("location"),
  capacity: integer("capacity"),
  image_url: text("image_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at"),
  category: text("category"),
  price: decimal("price"),
  featured: boolean("featured"),
  speakers: json("speakers").$type<string[] | null>(),
  agenda: json("agenda"),
  full_description: text("full_description"),
  map_url: text("map_url"),
  ticket_types: json("ticket_types"),
});

export const insertAethexEventSchema = createInsertSchema(aethex_events).omit({
  created_at: true,
});

export type InsertAethexEvent = z.infer<typeof insertAethexEventSchema>;
export type AethexEvent = typeof aethex_events.$inferSelect;

// ============ NEW FEATURE TABLES ============

// Messages table for Messaging app
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sender_id: varchar("sender_id").notNull(),
  recipient_id: varchar("recipient_id").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  created_at: true,
  updated_at: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Marketplace Listings table
export const marketplace_listings = pgTable("marketplace_listings", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  seller_id: varchar("seller_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'achievement', 'code', 'service', 'credential'
  price: integer("price").notNull(), // in loyalty points
  image_url: text("image_url"),
  status: text("status").default("active"), // 'active', 'sold', 'removed'
  tags: json("tags").$type<string[]>().default([]),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  purchase_count: integer("purchase_count").default(0),
});

export const insertMarketplaceListingSchema = createInsertSchema(marketplace_listings).omit({
  created_at: true,
  updated_at: true,
});

export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;
export type MarketplaceListing = typeof marketplace_listings.$inferSelect;

// Marketplace Transactions table
export const marketplace_transactions = pgTable("marketplace_transactions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  buyer_id: varchar("buyer_id").notNull(),
  seller_id: varchar("seller_id").notNull(),
  listing_id: varchar("listing_id").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").default("completed"), // 'pending', 'completed', 'refunded'
  created_at: timestamp("created_at").defaultNow(),
});

export const insertMarketplaceTransactionSchema = createInsertSchema(marketplace_transactions).omit({
  created_at: true,
});

export type InsertMarketplaceTransaction = z.infer<typeof insertMarketplaceTransactionSchema>;
export type MarketplaceTransaction = typeof marketplace_transactions.$inferSelect;

// Workspace Settings table
export const workspace_settings = pgTable("workspace_settings", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: varchar("user_id").notNull().unique(),
  theme: text("theme").default("dark"), // 'dark', 'light', 'auto'
  font_size: text("font_size").default("medium"), // 'small', 'medium', 'large'
  editor_font: text("editor_font").default("Monaco"),
  sidebar_collapsed: boolean("sidebar_collapsed").default(false),
  notifications_enabled: boolean("notifications_enabled").default(true),
  email_notifications: boolean("email_notifications").default(true),
  sound_enabled: boolean("sound_enabled").default(true),
  auto_save: boolean("auto_save").default(true),
  privacy_level: text("privacy_level").default("private"), // 'private', 'friends', 'public'
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertWorkspaceSettingsSchema = createInsertSchema(workspace_settings).omit({
  created_at: true,
  updated_at: true,
});

export type InsertWorkspaceSettings = z.infer<typeof insertWorkspaceSettingsSchema>;
export type WorkspaceSettings = typeof workspace_settings.$inferSelect;

// Files table for File Manager
export const files = pgTable("files", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: varchar("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'file', 'folder'
  path: text("path").notNull(),
  size: integer("size"), // in bytes
  mime_type: text("mime_type"),
  parent_id: varchar("parent_id"), // for folders
  content: text("content"), // for code files
  language: text("language"), // 'typescript', 'javascript', etc
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertFileSchema = createInsertSchema(files).omit({
  created_at: true,
  updated_at: true,
});

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: varchar("user_id").notNull(),
  type: text("type").notNull(), // 'message', 'achievement', 'purchase', 'event', 'mention'
  title: text("title").notNull(),
  content: text("content"),
  related_id: varchar("related_id"), // link to source (message_id, achievement_id, etc)
  read: boolean("read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  created_at: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// User Analytics table
export const user_analytics = pgTable("user_analytics", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: varchar("user_id").notNull(),
  total_xp_earned: integer("total_xp_earned").default(0),
  total_projects: integer("total_projects").default(0),
  total_achievements: integer("total_achievements").default(0),
  messages_sent: integer("messages_sent").default(0),
  marketplace_purchases: integer("marketplace_purchases").default(0),
  marketplace_sales: integer("marketplace_sales").default(0),
  events_attended: integer("events_attended").default(0),
  last_active: timestamp("last_active"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertUserAnalyticsSchema = createInsertSchema(user_analytics).omit({
  created_at: true,
  updated_at: true,
});

export type InsertUserAnalytics = z.infer<typeof insertUserAnalyticsSchema>;
export type UserAnalytics = typeof user_analytics.$inferSelect;

// Code Gallery table
export const code_gallery = pgTable("code_gallery", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  creator_id: varchar("creator_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  code: text("code").notNull(),
  language: text("language").notNull(),
  tags: json("tags").$type<string[]>().default([]),
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  is_public: boolean("is_public").default(true),
  category: text("category"), // 'snippet', 'algorithm', 'component', 'utility'
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertCodeGallerySchema = createInsertSchema(code_gallery).omit({
  created_at: true,
  updated_at: true,
});

export type InsertCodeGallery = z.infer<typeof insertCodeGallerySchema>;
export type CodeGallery = typeof code_gallery.$inferSelect;

// Documentation pages table
export const documentation = pgTable("documentation", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // 'getting-started', 'api', 'features', 'tutorials'
  order: integer("order").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertDocumentationSchema = createInsertSchema(documentation).omit({
  created_at: true,
  updated_at: true,
});

export type InsertDocumentation = z.infer<typeof insertDocumentationSchema>;
export type Documentation = typeof documentation.$inferSelect;

// App Builder table
export const custom_apps = pgTable("custom_apps", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  creator_id: varchar("creator_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  config: json("config"), // JSON config for builder
  status: text("status").default("draft"), // 'draft', 'published'
  is_public: boolean("is_public").default(false),
  installations: integer("installations").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertCustomAppSchema = createInsertSchema(custom_apps).omit({
  created_at: true,
  updated_at: true,
});

export type InsertCustomApp = z.infer<typeof insertCustomAppSchema>;
export type CustomApp = typeof custom_apps.$inferSelect;

// ============================================
// OS KERNEL SCHEMA (Portable Proof System)
// ============================================

// Subjects: Internal coordination IDs
export const aethex_subjects = pgTable("aethex_subjects", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  created_at: timestamp("created_at").defaultNow(),
});

// Subject Identities: External ID bindings (Roblox, Discord, GitHub, Epic)
export const aethex_subject_identities = pgTable("aethex_subject_identities", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  subject_id: varchar("subject_id").notNull(),
  provider: varchar("provider").notNull(), // "roblox" | "discord" | "github" | "epic"
  external_id: varchar("external_id").notNull(),
  external_username: varchar("external_username"),
  verified_at: timestamp("verified_at"),
  revoked_at: timestamp("revoked_at"),
  created_at: timestamp("created_at").defaultNow(),
});

// Issuers: Who can issue entitlements
export const aethex_issuers = pgTable("aethex_issuers", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name").notNull(),
  issuer_class: varchar("issuer_class").notNull(), // "lab" | "platform" | "foundation" | "external"
  scopes: json("scopes").$type<string[]>().default(sql`'[]'::json`),
  public_key: text("public_key").notNull(),
  is_active: boolean("is_active").default(true),
  metadata: json("metadata").$type<Record<string, any>>().default(sql`'{}'::json`),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Issuer Keys: Key rotation
export const aethex_issuer_keys = pgTable("aethex_issuer_keys", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  issuer_id: varchar("issuer_id").notNull(),
  public_key: text("public_key").notNull(),
  private_key_hash: text("private_key_hash"),
  is_active: boolean("is_active").default(true),
  rotated_at: timestamp("rotated_at"),
  created_at: timestamp("created_at").defaultNow(),
});

// Entitlements: The proofs
export const aethex_entitlements = pgTable("aethex_entitlements", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  issuer_id: varchar("issuer_id").notNull(),
  subject_id: varchar("subject_id"),
  external_subject_ref: varchar("external_subject_ref"), // "roblox:12345"
  schema_version: varchar("schema_version").default("v0.1"),
  scope: varchar("scope").notNull(), // "achievement" | "project" | "release"
  entitlement_type: varchar("entitlement_type").notNull(),
  data: json("data").$type<Record<string, any>>().notNull(),
  status: varchar("status").default("active"), // "active" | "revoked" | "expired"
  signature: text("signature"),
  evidence_hash: varchar("evidence_hash"),
  issued_by_subject_id: varchar("issued_by_subject_id"),
  expires_at: timestamp("expires_at"),
  revoked_at: timestamp("revoked_at"),
  revocation_reason: text("revocation_reason"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Entitlement Events: Audit trail
export const aethex_entitlement_events = pgTable("aethex_entitlement_events", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  entitlement_id: varchar("entitlement_id").notNull(),
  event_type: varchar("event_type").notNull(), // "issued" | "verified" | "revoked" | "expired"
  actor_id: varchar("actor_id"),
  actor_type: varchar("actor_type").notNull(), // "user" | "issuer" | "system"
  reason: text("reason"),
  metadata: json("metadata").$type<Record<string, any>>().default(sql`'{}'::json`),
  created_at: timestamp("created_at").defaultNow(),
});

// ============================================
// Funnel Events (Sales & engagement tracking)
// ============================================
export const funnel_events = pgTable("funnel_events", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: varchar("user_id"),
  event_type: text("event_type").notNull(), // e.g., 'intel_open', 'directory_view', 'drive_d_open', 'upgrade_click'
  source: text("source"), // e.g., 'tray-upgrade', 'intel-app', 'drives-app'
  payload: json("payload").$type<Record<string, any> | null>(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertFunnelEventSchema = createInsertSchema(funnel_events).omit({
  created_at: true,
});

export type InsertFunnelEvent = z.infer<typeof insertFunnelEventSchema>;
export type FunnelEvent = typeof funnel_events.$inferSelect;

// Audit Log: All OS actions
export const aethex_audit_log = pgTable("aethex_audit_log", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  action: varchar("action").notNull(), // "link_identity" | "issue_entitlement" | etc
  actor_id: varchar("actor_id"),
  actor_type: varchar("actor_type").notNull(), // "user" | "issuer" | "admin" | "system"
  resource_type: varchar("resource_type").notNull(), // "subject" | "entitlement" | "issuer"
  resource_id: varchar("resource_id").notNull(),
  changes: json("changes").$type<Record<string, any>>().default(sql`'{}'::json`),
  ip_address: varchar("ip_address"),
  user_agent: text("user_agent"),
  status: varchar("status").default("success"), // "success" | "failure"
  error_message: text("error_message"),
  created_at: timestamp("created_at").defaultNow(),
});

// User Mode Preference: UI preference for Foundation vs Corporation
export const aethex_user_mode_preference = pgTable("aethex_user_mode_preference", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: varchar("user_id").notNull().unique(),
  mode: varchar("mode").notNull().default("foundation"), // "foundation" | "corporation"
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Workspace Policy: Enforcement layer for realm and capabilities
export const aethex_workspace_policy = pgTable("aethex_workspace_policy", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspace_id: varchar("workspace_id").notNull().unique(),
  enforced_realm: varchar("enforced_realm"), // If set, users cannot switch realms
  allowed_modes: json("allowed_modes").$type<string[]>().default(sql`'["foundation","corporation"]'::json`),
  commerce_enabled: boolean("commerce_enabled").default(false),
  social_enabled: boolean("social_enabled").default(false),
  messaging_enabled: boolean("messaging_enabled").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// ============================================
// Revenue & Ledger (LEDGER-2)
// ============================================
export const revenue_events = pgTable("revenue_events", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  org_id: varchar("org_id"), // Optional org scoping (for multi-org revenue tracking)
  project_id: varchar("project_id"), // Optional project association
  source_type: varchar("source_type").notNull(), // 'marketplace', 'api', 'subscription', 'donation'
  source_id: varchar("source_id").notNull(), // Reference to transaction/event
  gross_amount: varchar("gross_amount").notNull(), // Stored as string for decimal precision
  platform_fee: varchar("platform_fee").default(sql`'0'`), // Stored as string
  net_amount: varchar("net_amount").notNull(), // Calculated: gross_amount - platform_fee
  currency: varchar("currency").default("USD").notNull(),
  metadata: json("metadata").$type<Record<string, any> | null>(), // Flexible event data
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertRevenueEventSchema = createInsertSchema(revenue_events).omit({
  created_at: true,
  updated_at: true,
});

export type InsertRevenueEvent = z.infer<typeof insertRevenueEventSchema>;
export type RevenueEvent = typeof revenue_events.$inferSelect;

// ============================================
// Revenue Splits (SPLITS-1)
// ============================================
// Project collaborators: Who contributes to a project
export const project_collaborators = pgTable("project_collaborators", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  project_id: varchar("project_id").notNull(),
  user_id: varchar("user_id").notNull(),
  role: varchar("role").notNull(), // 'creator', 'contributor', 'maintainer'
  joined_at: timestamp("joined_at").defaultNow(),
  left_at: timestamp("left_at"), // Null if still active
});

export const insertProjectCollaboratorSchema = createInsertSchema(
  project_collaborators
).omit({
  joined_at: true,
});

export type InsertProjectCollaborator = z.infer<
  typeof insertProjectCollaboratorSchema
>;
export type ProjectCollaborator = typeof project_collaborators.$inferSelect;

// Revenue splits: Time-versioned allocation rules
export const revenue_splits = pgTable("revenue_splits", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  project_id: varchar("project_id").notNull(),
  split_version: integer("split_version").notNull(), // Version number (1, 2, 3, ...)
  active_from: timestamp("active_from").notNull(), // When this split rule becomes active
  active_until: timestamp("active_until"), // Null = currently active
  rule: json("rule")
    .$type<Record<string, number>>()
    .notNull(), // e.g., { "user-123": 0.7, "user-456": 0.3 }
  created_by: varchar("created_by").notNull(), // Who created this split rule
  created_at: timestamp("created_at").defaultNow(),
});

export const insertRevenueSplitSchema = createInsertSchema(revenue_splits).omit({
  created_at: true,
});

export type InsertRevenueSplit = z.infer<typeof insertRevenueSplitSchema>;
export type RevenueSplit = typeof revenue_splits.$inferSelect;

// Split allocations: Immutable record of how revenue was allocated
export const split_allocations = pgTable("split_allocations", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  revenue_event_id: varchar("revenue_event_id").notNull(),
  project_id: varchar("project_id").notNull(),
  user_id: varchar("user_id").notNull(),
  split_version: integer("split_version").notNull(),
  allocated_amount: varchar("allocated_amount").notNull(), // Stored as string for precision
  allocated_percentage: numeric("allocated_percentage", { precision: 5, scale: 2 }), // e.g., 70.00
  created_at: timestamp("created_at").defaultNow(),
});

export const insertSplitAllocationSchema = createInsertSchema(
  split_allocations
).omit({
  created_at: true,
});

export type InsertSplitAllocation = z.infer<typeof insertSplitAllocationSchema>;
export type SplitAllocation = typeof split_allocations.$inferSelect;

// Split proposals: Propose new split rules for voting
export const split_proposals = pgTable("split_proposals", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  project_id: varchar("project_id").notNull(),
  proposed_by: varchar("proposed_by").notNull(), // User who created the proposal
  proposed_rule: json("proposed_rule")
    .$type<Record<string, number>>()
    .notNull(), // New rule being proposed
  proposal_status: text("proposal_status").default("pending"), // pending, approved, rejected
  voting_rule: text("voting_rule").notNull().default("unanimous"), // unanimous or majority
  description: text("description"), // Why this change is being proposed
  created_at: timestamp("created_at").defaultNow(),
  expires_at: timestamp("expires_at"), // When voting closes
});

export const insertSplitProposalSchema = createInsertSchema(
  split_proposals
).omit({
  created_at: true,
});

export type InsertSplitProposal = z.infer<typeof insertSplitProposalSchema>;
export type SplitProposal = typeof split_proposals.$inferSelect;

// Split votes: Track votes on split proposals
export const split_votes = pgTable("split_votes", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  proposal_id: varchar("proposal_id").notNull(),
  voter_id: varchar("voter_id").notNull(), // User voting
  vote: text("vote").notNull(), // 'approve' or 'reject'
  reason: text("reason"), // Optional reason for vote
  created_at: timestamp("created_at").defaultNow(),
});

export const insertSplitVoteSchema = createInsertSchema(split_votes).omit({
  created_at: true,
});

export type InsertSplitVote = z.infer<typeof insertSplitVoteSchema>;
export type SplitVote = typeof split_votes.$inferSelect;

// Escrow accounts: Track allocated revenue held for users per project
export const escrow_accounts = pgTable("escrow_accounts", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  project_id: varchar("project_id").notNull(),
  user_id: varchar("user_id").notNull(),
  balance: varchar("balance").notNull().default("0.00"), // Stored as string for precision
  held_amount: varchar("held_amount").notNull().default("0.00"), // Amount pending payout
  released_amount: varchar("released_amount").notNull().default("0.00"), // Total paid out
  last_updated: timestamp("last_updated").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertEscrowAccountSchema = createInsertSchema(
  escrow_accounts
).omit({
  created_at: true,
  last_updated: true,
});

export type InsertEscrowAccount = z.infer<typeof insertEscrowAccountSchema>;
export type EscrowAccount = typeof escrow_accounts.$inferSelect;

// Payout methods: How users prefer to receive payments (Stripe, PayPal, bank transfer)
export const payout_methods = pgTable("payout_methods", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: varchar("user_id").notNull(),
  method_type: text("method_type").notNull(), // 'stripe_connect', 'paypal', 'bank_transfer', 'crypto'
  is_primary: boolean("is_primary").default(false),
  metadata: json("metadata")
    .$type<Record<string, any>>()
    .notNull(), // Store API identifiers, account details (encrypted in prod)
  verified: boolean("verified").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertPayoutMethodSchema = createInsertSchema(
  payout_methods
).omit({
  created_at: true,
  updated_at: true,
});

export type InsertPayoutMethod = z.infer<typeof insertPayoutMethodSchema>;
export type PayoutMethod = typeof payout_methods.$inferSelect;

// Payout requests: User initiated payout requests
export const payout_requests = pgTable("payout_requests", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: varchar("user_id").notNull(),
  escrow_account_id: varchar("escrow_account_id").notNull(),
  request_amount: varchar("request_amount").notNull(), // Amount requested
  requested_at: timestamp("requested_at").defaultNow(),
  status: text("status").default("pending"), // pending, approved, rejected, processing
  reason: text("reason"), // Why requesting payout
  notes: text("notes"), // Admin notes on approval/rejection
  expires_at: timestamp("expires_at"), // When request expires if not processed
});

export const insertPayoutRequestSchema = createInsertSchema(
  payout_requests
).omit({
  requested_at: true,
});

export type InsertPayoutRequest = z.infer<typeof insertPayoutRequestSchema>;
export type PayoutRequest = typeof payout_requests.$inferSelect;

// Payouts: Completed or in-progress payments to users
export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  payout_request_id: varchar("payout_request_id"),
  user_id: varchar("user_id").notNull(),
  escrow_account_id: varchar("escrow_account_id").notNull(),
  payout_method_id: varchar("payout_method_id").notNull(),
  amount: varchar("amount").notNull(), // Stored as string for precision
  currency: text("currency").default("USD"),
  status: text("status").default("pending"), // pending, processing, completed, failed
  external_transaction_id: varchar("external_transaction_id"), // Stripe/PayPal ref
  failure_reason: text("failure_reason"),
  processed_at: timestamp("processed_at"),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertPayoutSchema = createInsertSchema(payouts).omit({
  created_at: true,
  processed_at: true,
  completed_at: true,
});

export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type Payout = typeof payouts.$inferSelect;
