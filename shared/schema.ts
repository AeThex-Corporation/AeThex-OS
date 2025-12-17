import { pgTable, text, varchar, boolean, integer, timestamp, json } from "drizzle-orm/pg-core";
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
