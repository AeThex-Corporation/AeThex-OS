import { Request, Response } from "express";
import { supabase } from "./supabase.js";
import { GameDevAPIs } from "./game-dev-apis.js";
import { requireAuth } from "./auth.js";
import crypto from "crypto";

// Game Marketplace Routes
export function registerGameRoutes(app: Express) {
  
  // ========== GAME MARKETPLACE ==========
  
  // Get marketplace items
  app.get("/api/game/marketplace", async (req, res) => {
    try {
      const { category, platform, search, sort = "newest", limit = 20, offset = 0 } = req.query;
      
      let query = supabase.from("game_items").select("*");
      
      if (category && category !== "all") {
        query = query.eq("type", category);
      }
      if (platform && platform !== "all") {
        query = query.eq("platform", platform);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      // Sorting
      switch(sort) {
        case "popular":
          query = query.order("purchase_count", { ascending: false });
          break;
        case "price-low":
          query = query.order("price", { ascending: true });
          break;
        case "price-high":
          query = query.order("price", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }
      
      query = query.range(Number(offset), Number(offset) + Number(limit) - 1);
      
      const { data, error } = await query;
      if (error) throw error;
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get item details
  app.get("/api/game/marketplace/:itemId", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("game_items")
        .select("*")
        .eq("id", req.params.itemId)
        .single();
      
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(404).json({ error: "Item not found" });
    }
  });

  // Purchase marketplace item
  app.post("/api/game/marketplace/purchase", requireAuth, async (req, res) => {
    try {
      const { itemId, price } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      // Check user wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from("game_wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();
      
      if (walletError) throw walletError;
      if (!wallet || wallet.balance < price) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Create transaction
      const transactionId = crypto.randomUUID();
      const { error: transError } = await supabase
        .from("game_transactions")
        .insert({
          id: transactionId,
          user_id: userId,
          wallet_id: wallet.id,
          type: "purchase",
          amount: price,
          currency: "LP",
          platform: "game-marketplace",
          status: "completed",
          metadata: { item_id: itemId }
        });
      
      if (transError) throw transError;
      
      // Update wallet balance
      await supabase
        .from("game_wallets")
        .update({ balance: wallet.balance - price })
        .eq("user_id", userId);
      
      // Update item purchase count
      await supabase.rpc("increment_purchase_count", { item_id: itemId });
      
      res.status(201).json({
        success: true,
        transaction_id: transactionId,
        new_balance: wallet.balance - price
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== MOD WORKSHOP ==========
  
  // Get mods
  app.get("/api/game/workshop", async (req, res) => {
    try {
      const { category, game, search, sort = "trending", limit = 20, offset = 0 } = req.query;
      
      let query = supabase.from("game_mods").select("*");
      
      if (category && category !== "all") {
        query = query.eq("category", category);
      }
      if (game && game !== "all") {
        query = query.or(`game.eq.${game},game.eq.All Games`);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,author.ilike.%${search}%`);
      }
      
      // Sorting
      switch(sort) {
        case "popular":
          query = query.order("download_count", { ascending: false });
          break;
        case "rating":
          query = query.order("rating", { ascending: false });
          break;
        case "trending":
          query = query.order("like_count", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }
      
      query = query.eq("status", "approved").range(Number(offset), Number(offset) + Number(limit) - 1);
      
      const { data, error } = await query;
      if (error) throw error;
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Upload mod
  app.post("/api/game/workshop/upload", requireAuth, async (req, res) => {
    try {
      const { name, description, category, game, version, fileSize } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const modId = crypto.randomUUID();
      
      const { error } = await supabase.from("game_mods").insert({
        id: modId,
        name,
        description,
        category,
        game,
        version,
        author_id: userId,
        file_size: fileSize,
        status: "reviewing", // Under review by default
        rating: 0,
        review_count: 0,
        download_count: 0,
        like_count: 0,
        view_count: 0
      });
      
      if (error) throw error;
      
      res.status(201).json({
        success: true,
        mod_id: modId,
        message: "Mod uploaded successfully and is under review"
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Rate mod
  app.post("/api/game/workshop/:modId/rate", requireAuth, async (req, res) => {
    try {
      const { modId } = req.params;
      const { rating, review } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be 1-5" });
      }
      
      const { error } = await supabase.from("game_mod_reviews").insert({
        mod_id: modId,
        user_id: userId,
        rating,
        review: review || null
      });
      
      if (error) throw error;
      
      // Update mod rating average
      const { data: reviews } = await supabase
        .from("game_mod_reviews")
        .select("rating")
        .eq("mod_id", modId);
      
      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await supabase
          .from("game_mods")
          .update({ rating: avgRating, review_count: reviews.length })
          .eq("id", modId);
      }
      
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Download mod
  app.post("/api/game/workshop/:modId/download", requireAuth, async (req, res) => {
    try {
      const { modId } = req.params;
      const userId = req.session?.userId;
      
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      // Increment download count
      await supabase.rpc("increment_mod_downloads", { mod_id: modId });
      
      // Record download
      await supabase.from("game_mod_downloads").insert({
        mod_id: modId,
        user_id: userId,
        downloaded_at: new Date()
      });
      
      res.json({ success: true, download_url: `/api/game/workshop/${modId}/file` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== GAME STREAMING ==========
  
  // Get streams
  app.get("/api/game/streams", async (req, res) => {
    try {
      const { platform, live = false, limit = 20 } = req.query;
      
      let query = supabase.from("game_streams").select("*");
      
      if (platform && platform !== "all") {
        query = query.eq("platform", platform);
      }
      if (live) {
        query = query.eq("is_live", true);
      }
      
      query = query.order("created_at", { ascending: false }).limit(Number(limit));
      
      const { data, error } = await query;
      if (error) throw error;
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create stream event
  app.post("/api/game/streams", requireAuth, async (req, res) => {
    try {
      const { title, platform, game, description, streamUrl } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const { error } = await supabase.from("game_streams").insert({
        user_id: userId,
        title,
        platform,
        game,
        description,
        stream_url: streamUrl,
        is_live: true,
        viewer_count: 0,
        start_time: new Date()
      });
      
      if (error) throw error;
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== GAME WALLET & TRANSACTIONS ==========
  
  // Get user wallet
  app.get("/api/game/wallet", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const { data, error } = await supabase
        .from("game_wallets")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) {
        // Create wallet if doesn't exist
        const { data: newWallet } = await supabase
          .from("game_wallets")
          .insert({ user_id: userId, balance: 5000 })
          .select()
          .single();
        return res.json(newWallet);
      }
      
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get transaction history
  app.get("/api/game/transactions", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const { limit = 50 } = req.query;
      const { data, error } = await supabase
        .from("game_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(Number(limit));
      
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== PLAYER PROFILES & ACHIEVEMENTS ==========
  
  // Get player profile
  app.get("/api/game/profiles/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const { data, error } = await supabase
        .from("game_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get achievements
  app.get("/api/game/achievements/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const { data, error } = await supabase
        .from("game_achievements")
        .select("*")
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false });
      
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Grant achievement
  app.post("/api/game/achievements/grant", requireAuth, async (req, res) => {
    try {
      const { achievementId } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const { error } = await supabase.from("game_achievements").insert({
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date()
      });
      
      if (error) throw error;
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== OAUTH GAME LINKING ==========
  
  // Link game account (Minecraft, Steam, etc.)
  app.post("/api/game/oauth/link/:provider", requireAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      const { accountId, accountName, metadata } = req.body;
      const userId = req.session?.userId;
      
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const { error } = await supabase.from("game_accounts").insert({
        user_id: userId,
        platform: provider,
        account_id: accountId,
        username: accountName,
        verified: true,
        metadata: metadata || {}
      });
      
      if (error) throw error;
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get linked accounts
  app.get("/api/game/accounts", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const { data, error } = await supabase
        .from("game_accounts")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  console.log("✓ Game feature routes registered");
}
