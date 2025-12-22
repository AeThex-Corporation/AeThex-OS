import { pgTable, text, varchar, boolean, integer, timestamp, json, decimal } from "drizzle-orm/pg-core";
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
