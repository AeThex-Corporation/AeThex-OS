/**
 * Game Platform Integration Schema Extensions
 * Adds support for Minecraft, Meta Horizon, Steam, and other game platforms
 */

import { pgTable, text, integer, boolean, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

// ============================================================================
// GAME PLATFORM ACCOUNTS
// ============================================================================

export const gameAccounts = pgTable("game_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  platform: text("platform").notNull(), // minecraft, roblox, steam, meta, twitch, etc
  accountId: text("account_id").notNull(), // Platform-specific ID
  username: text("username").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  verified: boolean("verified").default(false),
  metadata: jsonb("metadata").default({}), // Platform-specific data
  connectedAt: timestamp("connected_at").defaultNow(),
  lastSync: timestamp("last_sync"),
  accessToken: text("access_token"), // Encrypted
  refreshToken: text("refresh_token"), // Encrypted
  expiresAt: timestamp("expires_at"),
});

export const gameAccountsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  platform: z.enum(["minecraft", "roblox", "steam", "meta", "twitch", "youtube", "eos", "epic"]),
  accountId: z.string(),
  username: z.string(),
  displayName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  verified: z.boolean().default(false),
  metadata: z.record(z.any()).default({}),
  connectedAt: z.date(),
  lastSync: z.date().optional(),
});

// ============================================================================
// GAME PROFILES & STATISTICS
// ============================================================================

export const gameProfiles = pgTable("game_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  platform: text("platform").notNull(),
  
  // Minecraft specific
  minecraftUuid: text("minecraft_uuid"),
  skinUrl: text("skin_url"),
  skinModel: text("skin_model"), // classic or slim
  
  // Steam specific
  steamLevel: integer("steam_level"),
  steamBadges: integer("steam_badges"),
  steamProfileUrl: text("steam_profile_url"),
  
  // Roblox specific
  robloxLevel: integer("roblox_level"),
  robloxMembershipType: text("roblox_membership_type"),
  robloxFriendCount: integer("roblox_friend_count"),
  
  // Meta specific
  metaWorldsVisited: integer("meta_worlds_visited").default(0),
  metaFriendsCount: integer("meta_friends_count"),
  
  // General
  totalPlaytime: integer("total_playtime").default(0), // hours
  lastPlayed: timestamp("last_played"),
  preferences: jsonb("preferences").default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gameProfilesSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  platform: z.string(),
  minecraftUuid: z.string().optional(),
  steamLevel: z.number().optional(),
  robloxLevel: z.number().optional(),
  totalPlaytime: z.number().default(0),
  lastPlayed: z.date().optional(),
});

// ============================================================================
// PLAYER ACHIEVEMENTS & REWARDS
// ============================================================================

export const gameAchievements = pgTable("game_achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  platform: text("platform").notNull(),
  achievementId: text("achievement_id").notNull(),
  achievementName: text("achievement_name").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  points: integer("points").default(0),
  rarity: text("rarity"), // common, uncommon, rare, epic, legendary
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  platformData: jsonb("platform_data").default({}),
});

export const gameAchievementsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  platform: z.string(),
  achievementId: z.string(),
  achievementName: z.string(),
  description: z.string().optional(),
  points: z.number().default(0),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary"]).optional(),
  unlockedAt: z.date(),
});

// ============================================================================
// GAME SERVERS & HOSTING
// ============================================================================

export const gameServers = pgTable("game_servers", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  serverName: text("server_name").notNull(),
  location: text("location"), // us-east-1, eu-west-1, etc
  maxPlayers: integer("max_players").default(64),
  currentPlayers: integer("current_players").default(0),
  status: text("status").default("running"), // running, maintenance, offline
  gameType: text("game_type"), // pvp, pve, cooperative, etc
  
  // EOS Integration
  eosSessionId: text("eos_session_id"),
  eosLobbyId: text("eos_lobby_id"),
  
  // GameLift Integration
  gameLiftFleetId: text("gamelift_fleet_id"),
  gameLiftInstanceId: text("gamelift_instance_id"),
  
  // PlayFab Integration
  playfabServerId: text("playfab_server_id"),
  
  ipAddress: text("ip_address"),
  port: integer("port"),
  version: text("version"),
  
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  shutdownAt: timestamp("shutdown_at"),
});

export const gameServersSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  serverName: z.string(),
  location: z.string(),
  maxPlayers: z.number().default(64),
  currentPlayers: z.number().default(0),
  status: z.enum(["running", "maintenance", "offline"]),
  gameType: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  port: z.number().min(1024).max(65535).optional(),
});

// ============================================================================
// IN-GAME ASSETS & MARKETPLACE
// ============================================================================

export const gameAssets = pgTable("game_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  assetType: text("asset_type"), // model, texture, audio, animation, etc
  assetName: text("asset_name").notNull(),
  description: text("description"),
  
  // Asset sources
  sourceType: text("source_type"), // uploaded, sketchfab, polyhaven, turbosquid
  sourceId: text("source_id"), // External platform ID
  sourceUrl: text("source_url"),
  
  // Storage
  s3Key: text("s3_key"),
  s3Url: text("s3_url"),
  fileSize: integer("file_size"),
  format: text("format"), // glb, gltf, fbx, png, etc
  
  // Metadata
  tags: text("tags").array().default([]),
  metadata: jsonb("metadata").default({}),
  
  // Licensing
  license: text("license"), // MIT, CC-BY, etc
  attribution: text("attribution"),
  
  // Version control
  version: text("version").default("1.0.0"),
  uploadedBy: uuid("uploaded_by"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const gameAssetsSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  assetType: z.string(),
  assetName: z.string(),
  sourceType: z.enum(["uploaded", "sketchfab", "polyhaven", "turbosquid"]),
  s3Key: z.string(),
  format: z.string(),
  tags: z.array(z.string()).default([]),
  license: z.string().optional(),
});

// ============================================================================
// MULTIPLAYER & MATCHMAKING
// ============================================================================

export const matchmakingTickets = pgTable("matchmaking_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  gameType: text("game_type").notNull(),
  skillRating: integer("skill_rating").default(1500),
  preferredRegions: text("preferred_regions").array().default(["us-east-1"]),
  partySize: integer("party_size").default(1),
  
  // EOS Matchmaking
  eosTicketId: text("eos_ticket_id"),
  
  // Status
  status: text("status").default("searching"), // searching, matched, assigned, failed
  matchedSessionId: uuid("matched_session_id"),
  
  // Timing
  createdAt: timestamp("created_at").defaultNow(),
  matchedAt: timestamp("matched_at"),
  timeoutAt: timestamp("timeout_at"),
});

export const matchmakingTicketsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  gameType: z.string(),
  skillRating: z.number().default(1500),
  preferredRegions: z.array(z.string()),
  partySize: z.number().default(1),
  status: z.enum(["searching", "matched", "assigned", "failed"]),
});

export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id").notNull(),
  sessionCode: text("session_code").unique(),
  gameMode: text("game_mode"),
  mapName: text("map_name"),
  
  players: text("players").array().default([]),
  maxPlayers: integer("max_players").default(64),
  
  // Game state
  state: text("state").default("waiting"), // waiting, active, finished
  score: jsonb("score").default({}),
  
  // EOS Integration
  eosSessionId: text("eos_session_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
});

export const gameSessionsSchema = z.object({
  id: z.string().uuid(),
  serverId: z.string().uuid(),
  sessionCode: z.string(),
  gameMode: z.string(),
  players: z.array(z.string()),
  maxPlayers: z.number(),
  state: z.enum(["waiting", "active", "finished"]),
});

// ============================================================================
// GAME ANALYTICS & TELEMETRY
// ============================================================================

export const gameEvents = pgTable("game_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  sessionId: uuid("session_id"),
  eventType: text("event_type").notNull(), // player_joined, player_died, objective_completed, etc
  eventData: jsonb("event_data").default({}),
  
  // Analytics
  platform: text("platform"),
  gameVersion: text("game_version"),
  clientVersion: text("client_version"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameEventsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  eventType: z.string(),
  eventData: z.record(z.any()),
  platform: z.string().optional(),
  gameVersion: z.string().optional(),
});

// ============================================================================
// GAME MARKETPLACE & TRADING
// ============================================================================

export const gameItems = pgTable("game_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  itemName: text("item_name").notNull(),
  itemType: text("item_type"), // weapon, armor, cosmetic, consumable, etc
  description: text("description"),
  rarity: text("rarity"), // common, uncommon, rare, epic, legendary
  price: integer("price"), // in-game currency
  realPrice: text("real_price"), // fiat price
  
  // Ownership
  ownedBy: uuid("owned_by"),
  acquiredAt: timestamp("acquired_at").defaultNow(),
  
  // Trading
  tradeable: boolean("tradeable").default(true),
  listPrice: integer("list_price"),
  listedAt: timestamp("listed_at"),
  
  metadata: jsonb("metadata").default({}),
});

export const gameItemsSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  itemName: z.string(),
  itemType: z.string(),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary"]),
  price: z.number(),
  ownedBy: z.string().uuid().optional(),
  tradeable: z.boolean().default(true),
});

// ============================================================================
// PAYMENT & WALLET INTEGRATION
// ============================================================================

export const gameWallets = pgTable("game_wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  balance: integer("balance").default(0), // In-game currency
  realBalance: text("real_balance").default("0"), // Fiat/USD
  
  // Payment methods
  paypalEmail: text("paypal_email"),
  stripeCustomerId: text("stripe_customer_id"),
  applePayId: text("apple_pay_id"),
  googlePayId: text("google_pay_id"),
  
  // History
  totalSpent: text("total_spent").default("0"),
  totalEarned: text("total_earned").default("0"),
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gameTransactions = pgTable("game_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  walletId: uuid("wallet_id").notNull(),
  type: text("type"), // purchase, earned, withdrawal, refund
  amount: text("amount"),
  currency: text("currency").default("USD"),
  platform: text("platform"), // stripe, paypal, apple, google
  externalTransactionId: text("external_transaction_id"),
  description: text("description"),
  status: text("status").default("pending"), // pending, completed, failed
  
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Export all schemas
export const gameDBSchemas = {
  gameAccounts: gameAccountsSchema,
  gameProfiles: gameProfilesSchema,
  gameAchievements: gameAchievementsSchema,
  gameServers: gameServersSchema,
  gameAssets: gameAssetsSchema,
  matchmakingTickets: matchmakingTicketsSchema,
  gameSessions: gameSessionsSchema,
  gameEvents: gameEventsSchema,
  gameItems: gameItemsSchema,
};
