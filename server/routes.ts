import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { randomUUID } from "crypto";
import { storage } from "./storage.js";
import { loginSchema, signupSchema } from "../shared/schema.js";
import { supabase } from "./supabase.js";
import { getChatResponse } from "./openai.js";
import { capabilityGuard } from "./capability-guard.js";
import { startOAuthLinking, handleOAuthCallback } from "./oauth-handlers.js";
import communityRoutes from "./community-routes.js";

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    isAdmin?: boolean;
    accessToken?: string;
  }
}

// Auth middleware - requires any authenticated user
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Admin middleware - requires authenticated admin user
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!req.session.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ===== Admin CLI process registry =====
  const CLI_ALLOWLIST: Record<string, { cmd: string; args: string[]; label: string }> = {
    build: { cmd: "npm", args: ["run", "build"], label: "npm run build" },
    "migrate-status": { cmd: "npx", args: ["drizzle-kit", "status"], label: "drizzle status" },
    migrate: { cmd: "npx", args: ["drizzle-kit", "migrate:push"], label: "drizzle migrate" },
    "migrate-os": { cmd: "npx", args: ["ts-node", "script/run-os-migration.ts"], label: "os kernel migrate" },
    seed: { cmd: "npx", args: ["ts-node", "script/seed.ts"], label: "seed" },
    test: { cmd: "bash", args: ["./test-implementation.sh"], label: "test-implementation" },
  };

  const cliProcesses = new Map<string, { proc: ChildProcessWithoutNullStreams; status: "running" | "exited" | "error" }>();
  
  // Apply capability guard to Hub and OS routes
  app.use("/api/hub/*", capabilityGuard);
  app.use("/api/os/entitlements/*", capabilityGuard);
  app.use("/api/os/link/*", capabilityGuard);
  
  // Mount community routes (events, opportunities, messages)
  app.use("/api", communityRoutes);
  
  // ========== OAUTH ROUTES ==========
  
  // Start OAuth linking flow (get authorization URL)
  app.post("/api/oauth/link/:provider", requireAuth, startOAuthLinking);
  
  // OAuth callback (provider redirects here with code)
  app.get("/api/oauth/callback/:provider", handleOAuthCallback);
  
  // ========== MODE MANAGEMENT ROUTES ==========
  
  // Get user mode preference
  app.get("/api/user/mode-preference", requireAuth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("aethex_user_mode_preference")
        .select("mode")
        .eq("user_id", req.session.userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      res.json({ mode: data?.mode || "foundation" });
    } catch (error) {
      console.error("Mode fetch error:", error);
      res.status(500).json({ error: "Failed to fetch mode preference" });
    }
  });

  // Update user mode preference
  app.put("/api/user/mode-preference", requireAuth, async (req, res) => {
    try {
      const { mode } = req.body;

      if (!mode || !["foundation", "corporation"].includes(mode)) {
        return res.status(400).json({ error: "Invalid mode" });
      }

      const { error } = await supabase
        .from("aethex_user_mode_preference")
        .upsert({
          user_id: req.session.userId,
          mode,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      res.json({ success: true, mode });
    } catch (error) {
      console.error("Mode update error:", error);
      res.status(500).json({ error: "Failed to update mode preference" });
    }
  });

  // Get workspace policy
  app.get("/api/workspace/policy", requireAuth, async (req, res) => {
    try {
      // For now, use a default workspace
      const workspaceId = "default";

      const { data, error } = await supabase
        .from("aethex_workspace_policy")
        .select("*")
        .eq("workspace_id", workspaceId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      res.json(data || {});
    } catch (error) {
      console.error("Policy fetch error:", error);
      res.status(500).json({ error: "Failed to fetch workspace policy" });
    }
  });
  
  // ========== AUTH ROUTES (Supabase Auth) ==========
  
  // Login via Supabase Auth
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid email or password format" });
      }
      
      const { email, password } = result.data;
      
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error || !data.user) {
        return res.status(401).json({ error: error?.message || "Invalid credentials" });
      }
      
      // Get user profile from public.profiles
      const profile = await storage.getProfile(data.user.id);
      
      // Check if user is admin (based on profile role or email)
      const isAdmin = ['admin', 'oversee', 'employee'].includes(profile?.role || '') || email.includes('admin');
      
      // Set express session
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ error: "Session error" });
        }
        
        req.session.userId = data.user.id;
        req.session.isAdmin = isAdmin;
        req.session.accessToken = data.session?.access_token;
        
        req.session.save((saveErr) => {
          if (saveErr) {
            return res.status(500).json({ error: "Session save error" });
          }
          
          res.json({ 
            success: true,
            user: { 
              id: data.user.id,
              email: data.user.email,
              username: profile?.username || data.user.email?.split('@')[0],
              isAdmin
            }
          });
        });
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // Signup via Supabase Auth
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const result = signupSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }
      
      const { email, password, username } = result.data;
      
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username || email.split('@')[0] }
        }
      });
      
      if (error || !data.user) {
        return res.status(400).json({ error: error?.message || "Signup failed" });
      }
      
      res.json({ 
        success: true,
        message: data.session ? "Account created successfully" : "Please check your email to confirm your account",
        user: {
          id: data.user.id,
          email: data.user.email
        }
      });
    } catch (err: any) {
      console.error('Signup error:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get current session
  app.get("/api/auth/session", async (req, res) => {
    if (!req.session.userId) {
      return res.json({ authenticated: false });
    }
    
    // Get profile from storage
    const profile = await storage.getProfile(req.session.userId);
    
    res.json({ 
      authenticated: true,
      user: {
        id: req.session.userId,
        username: profile?.username || 'User',
        email: profile?.email,
        isAdmin: req.session.isAdmin
      }
    });
  });
  
  // ========== AUTHENTICATED USER ROUTES ==========
  
  // Get current user's profile (for Passport app)
  app.get("/api/me/profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.session.userId!);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get current user's achievements
  app.get("/api/me/achievements", requireAuth, async (req, res) => {
    try {
      const userAchievements = await storage.getUserAchievements(req.session.userId!);
      res.json(userAchievements);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get current user's passport
  app.get("/api/me/passport", requireAuth, async (req, res) => {
    try {
      const passport = await storage.getUserPassport(req.session.userId!);
      if (!passport) {
        return res.status(404).json({ error: "Passport not found" });
      }
      res.json(passport);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create passport for current user
  app.post("/api/me/passport", requireAuth, async (req, res) => {
    try {
      const passport = await storage.createUserPassport(req.session.userId!);
      res.json(passport);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // ========== PUBLIC API ROUTES ==========
  
  // Get ecosystem metrics (public - for dashboard)
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Minimal tracking endpoint for upgrade clicks
  app.post("/api/track/upgrade-click", async (req, res) => {
    try {
      const { source, timestamp } = req.body || {};
      await storage.logFunnelEvent({
        user_id: req.session.userId,
        event_type: 'upgrade_click',
        source: source || 'unknown',
        created_at: timestamp,
      });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Generic funnel event tracking
  app.post("/api/track/event", async (req, res) => {
    try {
      const { event_type, source, payload, timestamp } = req.body || {};
      if (!event_type) return res.status(400).json({ error: 'event_type is required' });
      await storage.logFunnelEvent({
        user_id: req.session.userId,
        event_type,
        source,
        payload,
        created_at: timestamp,
      });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== PAYMENTS ==========
  // Create Stripe Checkout Session
  app.post("/api/payments/create-checkout-session", async (req, res) => {
    try {
      const secret = process.env.STRIPE_SECRET_KEY;
      if (!secret) {
        return res.status(400).json({ error: "Stripe not configured" });
      }
      const priceId = process.env.STRIPE_PRICE_ID; // optional
      const successUrl = process.env.STRIPE_SUCCESS_URL || `${req.headers.origin || "https://aethex.network"}/success`;
      const cancelUrl = process.env.STRIPE_CANCEL_URL || `${req.headers.origin || "https://aethex.network"}/cancel`;

      const body = new URLSearchParams();
      body.set("mode", "payment");
      body.set("success_url", successUrl);
      body.set("cancel_url", cancelUrl);
      body.set("client_reference_id", req.session.userId || "guest");

      if (priceId) {
        body.set("line_items[0][price]", priceId);
        body.set("line_items[0][quantity]", "1");
      } else {
        body.set("line_items[0][price_data][currency]", "usd");
        body.set("line_items[0][price_data][product_data][name]", "Architect Access");
        body.set("line_items[0][price_data][unit_amount]", String(50000)); // $500.00
        body.set("line_items[0][quantity]", "1");
      }

      const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      const json = await resp.json();
      if (!resp.ok) {
        return res.status(400).json({ error: json.error?.message || "Stripe error" });
      }
      res.json({ url: json.url, id: json.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // ========== PUBLIC DIRECTORY ROUTES ==========
  
  // Get public directory of founding architects only
  app.get("/api/directory/architects", async (req, res) => {
    try {
      const profiles = await storage.getProfiles();
      // Only show the founding team members with leadership roles
      const LEADERSHIP_ROLES = ['oversee', 'admin'];
      const publicProfiles = profiles
        .filter(p => {
          const role = (p.role || '').toLowerCase();
          return LEADERSHIP_ROLES.includes(role);
        })
        .map((p, index) => ({
          id: String(index + 1).padStart(3, '0'),
          name: p.full_name || p.username || p.email?.split('@')[0] || 'Architect',
          role: p.role || 'member',
          bio: p.bio,
          level: p.level,
          xp: p.total_xp,
          passportId: p.aethex_passport_id,
          skills: p.skills,
          username: p.username,
        }));
      res.json(publicProfiles);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get public directory of projects
  app.get("/api/directory/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      // Map to public-safe fields
      const publicProjects = projects.map(p => ({
        id: p.id,
        name: p.title,
        description: p.description,
        techStack: p.technologies,
        status: p.status,
      }));
      res.json(publicProjects);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get single architect profile by username/slug
  app.get("/api/directory/architects/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const profiles = await storage.getProfiles();
      const profile = profiles.find(p => 
        p.aethex_passport_id?.toLowerCase() === slug.toLowerCase() ||
        p.full_name?.toLowerCase() === slug.toLowerCase() ||
        p.username?.toLowerCase() === slug.toLowerCase() ||
        p.email?.split('@')[0].toLowerCase() === slug.toLowerCase()
      );
      
      if (!profile) {
        return res.status(404).json({ error: "Architect not found" });
      }
      
      // Return public-safe fields only
      const socialLinks = profile.social_links || {};
      res.json({
        id: profile.id,
        name: profile.full_name || profile.username || profile.email?.split('@')[0] || 'Architect',
        role: profile.role,
        bio: profile.bio,
        level: profile.level,
        xp: profile.total_xp,
        passportId: profile.aethex_passport_id,
        skills: profile.skills,
        isVerified: profile.is_verified,
        avatarUrl: profile.avatar_url,
        github: socialLinks.github,
        twitter: socialLinks.twitter,
        website: socialLinks.website,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // ========== ADMIN-PROTECTED API ROUTES ==========
  
  // Get all profiles (admin only)
  app.get("/api/profiles", requireAdmin, async (req, res) => {
    try {
      const profiles = await storage.getProfiles();
      res.json(profiles);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get single profile (admin only)
  app.get("/api/profiles/:id", requireAdmin, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Update profile (admin only)
  app.patch("/api/profiles/:id", requireAdmin, async (req, res) => {
    try {
      const profile = await storage.updateProfile(req.params.id, req.body);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get all projects (admin only)
  app.get("/api/projects", requireAdmin, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get single project (admin only)
  app.get("/api/projects/:id", requireAdmin, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // ========== NEW ADMIN ROUTES ==========
  
  // Get all aethex sites (admin only)
  // List all sites
  app.get("/api/sites", requireAdmin, async (req, res) => {
    try {
      const sites = await storage.getSites();
      res.json(sites);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create a new site
  app.post("/api/sites", requireAdmin, async (req, res) => {
    try {
      const site = await storage.createSite(req.body);
      res.status(201).json(site);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update a site
  app.patch("/api/sites/:id", requireAdmin, async (req, res) => {
    try {
      const site = await storage.updateSite(req.params.id, req.body);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }
      res.json(site);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a site
  app.delete("/api/sites/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteSite(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Site not found" });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get auth logs (admin only)
  app.get("/api/auth-logs", requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getAuthLogs();
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get all achievements (public - shows what achievements exist)
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get applications (admin only)
  app.get("/api/applications", requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getApplications();
      res.json(applications);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get alerts for Aegis (admin only)
  app.get("/api/alerts", requireAdmin, async (req, res) => {
    try {
      const alerts = await storage.getAlerts();
      res.json(alerts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Resolve alert (admin only)
  app.patch("/api/alerts/:id", requireAdmin, async (req, res) => {
    try {
      const alert = await storage.updateAlert(req.params.id, req.body);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Update application status (admin only)
  app.patch("/api/applications/:id", requireAdmin, async (req, res) => {
    try {
      const application = await storage.updateApplication(req.params.id, req.body);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      res.json(application);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== PUBLIC OS API ROUTES ==========
  
  // Get public project summaries for OS (limited data, no auth required)
  app.get("/api/os/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      const summaries = projects.slice(0, 10).map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        engine: p.engine,
      }));
      res.json(summaries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get public architect summaries for OS (limited data, no auth required)
  app.get("/api/os/architects", async (req, res) => {
    try {
      const profiles = await storage.getProfiles();
      const summaries = profiles.slice(0, 10).map(p => ({
        id: p.id,
        username: p.username,
        level: p.level || 1,
        xp: p.total_xp || 0,
        verified: p.is_verified || false,
      }));
      res.json(summaries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get achievements list for OS (public)
  app.get("/api/os/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements.slice(0, 20));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get recent activity/notifications for OS (public summary)
  app.get("/api/os/notifications", async (req, res) => {
    try {
      const metrics = await storage.getMetrics();
      const notifications = [
        { id: 1, message: `${metrics.totalProfiles} architects in network`, type: 'info' },
        { id: 2, message: `${metrics.totalProjects} active projects`, type: 'info' },
        { id: 3, message: 'Aegis security active', type: 'success' },
      ];
      res.json(notifications);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== CHATBOT API (Rate limited) ==========
  
  const chatRateLimits = new Map<string, { count: number; resetTime: number }>();
  
  // Get chat history
  app.get("/api/chat/history", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const history = await storage.getChatHistory(userId, 20);
      res.json({ history });
    } catch (err: any) {
      console.error("Get chat history error:", err);
      res.status(500).json({ error: "Failed to get chat history" });
    }
  });
  
  app.post("/api/chat", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
      const rateLimitKey = userId ? `user:${userId}` : `ip:${clientIP}`;
      const maxRequests = userId ? 30 : 10;
      
      const now = Date.now();
      const rateLimit = chatRateLimits.get(rateLimitKey);
      
      if (rateLimit) {
        if (now < rateLimit.resetTime) {
          if (rateLimit.count >= maxRequests) {
            return res.status(429).json({ error: "Rate limit exceeded. Please wait before sending more messages." });
          }
          rateLimit.count++;
        } else {
          chatRateLimits.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
        }
      } else {
        chatRateLimits.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
      }
      
      const { message, history } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }
      
      // Save user message if user is authenticated
      if (userId) {
        const messageId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await storage.saveChatMessage(messageId, userId, 'user', message);
      }
      
      // Get full chat history for context if user is authenticated
      let fullHistory = history || [];
      if (userId) {
        const savedHistory = await storage.getChatHistory(userId, 20);
        fullHistory = savedHistory.map(msg => ({ role: msg.role, content: msg.content }));
      }
      
      const response = await getChatResponse(message, fullHistory, userId);
      
      // Save assistant response if user is authenticated
      if (userId) {
        const responseId = `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await storage.saveChatMessage(responseId, userId, 'assistant', response);
      }
      
      res.json({ response });
    } catch (err: any) {
      console.error("Chat error:", err);
      res.status(500).json({ error: "Failed to get response" });
    }
  });

  // ========== AXIOM OPPORTUNITIES ROUTES ==========
  
  // Get all opportunities (public)
  app.get("/api/opportunities", async (req, res) => {
    try {
      const opportunities = await storage.getOpportunities();
      res.json(opportunities);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single opportunity
  app.get("/api/opportunities/:id", async (req, res) => {
    try {
      const opportunity = await storage.getOpportunity(req.params.id);
      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      res.json(opportunity);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create opportunity (admin only)
  app.post("/api/opportunities", requireAdmin, async (req, res) => {
    try {
      const opportunity = await storage.createOpportunity(req.body);
      res.status(201).json(opportunity);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update opportunity (admin only)
  app.patch("/api/opportunities/:id", requireAdmin, async (req, res) => {
    try {
      const opportunity = await storage.updateOpportunity(req.params.id, req.body);
      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      res.json(opportunity);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete opportunity (admin only)
  app.delete("/api/opportunities/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteOpportunity(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== AXIOM EVENTS ROUTES ==========
  
  // Get all events (public)
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single event
  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create event (admin only)
  app.post("/api/events", requireAdmin, async (req, res) => {
    try {
      const event = await storage.createEvent(req.body);
      res.status(201).json(event);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update event (admin only)
  app.patch("/api/events/:id", requireAdmin, async (req, res) => {
    try {
      const event = await storage.updateEvent(req.params.id, req.body);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete event (admin only)
  app.delete("/api/events/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== MARKETPLACE ROUTES (LEDGER-3) ==========
  // Purchase marketplace listing
  app.post("/api/marketplace/purchase", requireAuth, async (req, res) => {
    try {
      const { listing_id } = req.body;
      const buyer_id = req.session.userId!;

      if (!listing_id) {
        return res.status(400).json({ error: "listing_id is required" });
      }

      // Fetch listing details
      const { data: listing, error: listingError } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("id", listing_id)
        .single();

      if (listingError || !listing) {
        return res.status(404).json({ error: "Listing not found" });
      }

      // Prevent self-purchase
      if (listing.seller_id === buyer_id) {
        return res.status(400).json({ error: "Cannot purchase your own listing" });
      }

      // Create transaction
      const transactionId = randomUUID();
      const { error: transError } = await supabase
        .from("marketplace_transactions")
        .insert({
          id: transactionId,
          buyer_id,
          seller_id: listing.seller_id,
          listing_id,
          amount: listing.price,
          status: "completed",
        });

      if (transError) throw transError;

      // Emit revenue event (LEDGER-3)
      const { recordRevenueEvent } = await import("./revenue.js");
      const revResult = await recordRevenueEvent({
        source_type: "marketplace",
        source_id: transactionId,
        gross_amount: listing.price,
        platform_fee: 0, // Can be configured per transaction or org policy
        currency: "POINTS",
        project_id: (listing as any).project_id || null,
        metadata: {
          listing_id,
          buyer_id,
          seller_id: listing.seller_id,
          title: listing.title,
          category: listing.category,
        },
      });

      if (revResult.success && revResult.id && (listing as any).project_id) {
        // Compute and record splits if project_id exists (SPLITS-1)
        const { computeRevenueSplits, recordSplitAllocations } = await import(
          "./splits.js"
        );
        const splitsResult = await computeRevenueSplits(
          (listing as any).project_id,
          listing.price
        );
        if (splitsResult.success && splitsResult.allocations) {
          await recordSplitAllocations(
            revResult.id,
            (listing as any).project_id,
            splitsResult.allocations,
            splitsResult.splitVersion || 1
          );
        }
      }

      // Update listing purchase count
      await supabase
        .from("marketplace_listings")
        .update({ purchase_count: (listing.purchase_count || 0) + 1 })
        .eq("id", listing_id);

      res.status(201).json({
        success: true,
        transaction_id: transactionId,
        message: "Purchase completed",
      });
    } catch (err: any) {
      console.error("Marketplace purchase error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get organization revenue summary by month (LEDGER-4)
  app.get("/api/revenue/summary", requireAuth, async (req, res) => {
    try {
      const org_id = (req.headers["x-org-id"] as string) || req.session.userId; // Org context from header or user
      const monthsParam = parseInt(req.query.months as string) || 6;
      const months = Math.min(monthsParam, 24); // Cap at 24 months

      if (!org_id) {
        return res.status(400).json({ error: "Org context required" });
      }

      // Query revenue events for this org, past N months
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data: events, error } = await supabase
        .from("revenue_events")
        .select("*")
        .eq("org_id", org_id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Aggregate by month
      const byMonth: Record<
        string,
        { gross: number; fees: number; net: number }
      > = {};

      (events || []).forEach((event: any) => {
        const date = new Date(event.created_at);
        const monthKey = date.toISOString().substring(0, 7); // "2026-01"
        if (!byMonth[monthKey]) {
          byMonth[monthKey] = { gross: 0, fees: 0, net: 0 };
        }
        byMonth[monthKey].gross += parseFloat(event.gross_amount || "0");
        byMonth[monthKey].fees += parseFloat(event.platform_fee || "0");
        byMonth[monthKey].net += parseFloat(event.net_amount || "0");
      });

      // Format response
      const summary = Object.entries(byMonth)
        .map(([month, { gross, fees, net }]) => ({
          month,
          gross: gross.toFixed(2),
          fees: fees.toFixed(2),
          net: net.toFixed(2),
        }))
        .sort();

      res.json(summary);
    } catch (err: any) {
      console.error("Revenue summary error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get revenue splits for a project (SPLITS-1)
  app.get("/api/revenue/splits/:projectId", requireAuth, async (req, res) => {
    try {
      const { projectId } = req.params;

      // Fetch the currently active split rule
      const { data: splits, error: splitsError } = await supabase
        .from("revenue_splits")
        .select("*")
        .eq("project_id", projectId)
        .is("active_until", null) // Only active rules
        .order("split_version", { ascending: false })
        .limit(1);

      if (splitsError) throw splitsError;

      if (!splits || splits.length === 0) {
        return res.json({
          split_version: 0,
          rule: {},
          allocations: [],
        });
      }

      const split = splits[0];

      // Fetch all allocations for this project (for reporting)
      const { data: allocations, error: allocError } = await supabase
        .from("split_allocations")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (allocError) throw allocError;

      // Aggregate allocations by user
      const byUser: Record<
        string,
        {
          user_id: string;
          total_allocated: number;
          allocation_count: number;
        }
      > = {};

      (allocations || []).forEach((alloc: any) => {
        if (!byUser[alloc.user_id]) {
          byUser[alloc.user_id] = {
            user_id: alloc.user_id,
            total_allocated: 0,
            allocation_count: 0,
          };
        }
        byUser[alloc.user_id].total_allocated += parseFloat(
          alloc.allocated_amount || "0"
        );
        byUser[alloc.user_id].allocation_count += 1;
      });

      res.json({
        split_version: split.split_version,
        rule: split.rule,
        active_from: split.active_from,
        allocations_summary: Object.values(byUser),
      });
    } catch (err: any) {
      console.error("Revenue splits fetch error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get split rule history for a project (SPLITS-HISTORY)
  app.get("/api/revenue/splits/:projectId/history", requireAuth, async (req, res) => {
    try {
      const { projectId } = req.params;

      // Fetch all split versions for this project, ordered by version desc
      const { data: splitHistory, error: historyError } = await supabase
        .from("revenue_splits")
        .select("*")
        .eq("project_id", projectId)
        .order("split_version", { ascending: false });

      if (historyError) throw historyError;

      if (!splitHistory || splitHistory.length === 0) {
        return res.json({
          project_id: projectId,
          total_versions: 0,
          history: [],
        });
      }

      // Enrich history with allocation counts per version
      const enriched = await Promise.all(
        splitHistory.map(async (split: any) => {
          const { count, error: countError } = await supabase
            .from("split_allocations")
            .select("id", { count: "exact" })
            .eq("project_id", projectId)
            .eq("split_version", split.split_version);

          if (countError) console.error("Count error:", countError);

          return {
            split_version: split.split_version,
            rule: split.rule,
            active_from: split.active_from,
            active_until: split.active_until,
            is_active: !split.active_until,
            created_by: split.created_by,
            created_at: split.created_at,
            allocations_count: count || 0,
          };
        })
      );

      res.json({
        project_id: projectId,
        total_versions: enriched.length,
        history: enriched,
      });
    } catch (err: any) {
      console.error("Split history fetch error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ========== GOVERNANCE: SPLIT VOTING SYSTEM ==========
  // Import voting functions
  const { createSplitProposal, castVote, evaluateProposal, getProposalWithVotes } = await import(
    "./votes.js"
  );

  // Create a proposal to change split rules (SPLITS-VOTING-1)
  app.post("/api/revenue/splits/:projectId/propose", requireAuth, async (req, res) => {
    try {
      const { projectId } = req.params;
      const { proposed_rule, voting_rule, description, expires_at } = req.body;
      const userId = req.session.userId;

      if (!proposed_rule || !voting_rule) {
        return res
          .status(400)
          .json({ error: "Missing proposed_rule or voting_rule" });
      }

      if (voting_rule !== "unanimous" && voting_rule !== "majority") {
        return res
          .status(400)
          .json({ error: "voting_rule must be 'unanimous' or 'majority'" });
      }

      const result = await createSplitProposal({
        project_id: projectId,
        proposed_by: userId,
        proposed_rule,
        voting_rule,
        description,
        expires_at: expires_at ? new Date(expires_at) : undefined,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({
        success: true,
        proposal_id: result.proposal_id,
        message: "Proposal created successfully",
      });
    } catch (err: any) {
      console.error("Create proposal error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Cast a vote on a proposal (SPLITS-VOTING-2)
  app.post("/api/revenue/splits/proposals/:proposalId/vote", requireAuth, async (req, res) => {
    try {
      const { proposalId } = req.params;
      const { vote, reason } = req.body;
      const userId = req.session.userId;

      if (!vote || (vote !== "approve" && vote !== "reject")) {
        return res.status(400).json({ error: "vote must be 'approve' or 'reject'" });
      }

      const result = await castVote({
        proposal_id: proposalId,
        voter_id: userId,
        vote,
        reason,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({
        success: true,
        vote_id: result.vote_id,
        message: "Vote recorded successfully",
      });
    } catch (err: any) {
      console.error("Cast vote error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get proposal details with vote counts (SPLITS-VOTING-3)
  app.get(
    "/api/revenue/splits/proposals/:proposalId",
    requireAuth,
    async (req, res) => {
      try {
        const { proposalId } = req.params;

        const result = await getProposalWithVotes(proposalId);

        if (!result.success) {
          return res.status(404).json({ error: result.error });
        }

        res.json({
          proposal: result.proposal,
          votes: result.votes,
          stats: result.stats,
        });
      } catch (err: any) {
        console.error("Get proposal error:", err);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // Evaluate proposal consensus and apply if approved (SPLITS-VOTING-4)
  app.post(
    "/api/revenue/splits/proposals/:proposalId/evaluate",
    requireAuth,
    async (req, res) => {
      try {
        const { proposalId } = req.params;
        const userId = req.session.userId;

        const result = await evaluateProposal(proposalId, userId);

        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }

        res.json({
          success: result.success,
          approved: result.approved,
          stats: {
            approve_count: result.approve_count,
            reject_count: result.reject_count,
            total_votes: result.total_votes,
          },
          message: result.message,
        });
      } catch (err: any) {
        console.error("Evaluate proposal error:", err);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // List all proposals for a project (SPLITS-VOTING-5)
  app.get(
    "/api/revenue/splits/:projectId/proposals",
    requireAuth,
    async (req, res) => {
      try {
        const { projectId } = req.params;

        const { data: proposals, error } = await supabase
          .from("split_proposals")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        res.json({
          project_id: projectId,
          proposals: proposals || [],
          count: proposals?.length || 0,
        });
      } catch (err: any) {
        console.error("List proposals error:", err);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // ========== SETTLEMENT: ESCROW & PAYOUT SYSTEM ==========
  // Import settlement functions
  const {
    getEscrowBalance,
    depositToEscrow,
    createPayoutRequest,
    reviewPayoutRequest,
    registerPayoutMethod,
    processPayout,
    completePayout,
    failPayout,
    getPayoutHistory,
  } = await import("./settlement.js");

  // Get escrow balance for user on a project (SETTLEMENT-1)
  app.get(
    "/api/settlement/escrow/:projectId",
    requireAuth,
    async (req, res) => {
      try {
        const { projectId } = req.params;
        const userId = req.session.userId;

        const result = await getEscrowBalance(userId, projectId);

        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }

        res.json({
          user_id: userId,
          project_id: projectId,
          balance: result.balance,
          held_amount: result.held,
          released_amount: result.released,
        });
      } catch (err: any) {
        console.error("Get escrow balance error:", err);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // Create a payout request (SETTLEMENT-2)
  app.post("/api/settlement/payout-request", requireAuth, async (req, res) => {
    try {
      const { escrow_account_id, request_amount, reason } = req.body;
      const userId = req.session.userId;

      if (!escrow_account_id || !request_amount) {
        return res
          .status(400)
          .json({ error: "Missing escrow_account_id or request_amount" });
      }

      const result = await createPayoutRequest({
        user_id: userId,
        escrow_account_id,
        request_amount,
        reason,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({
        success: true,
        request_id: result.request_id,
        message: "Payout request created successfully",
      });
    } catch (err: any) {
      console.error("Create payout request error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get user's payout requests (SETTLEMENT-3)
  app.get("/api/settlement/payout-requests", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;

      const { data: requests, error } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("user_id", userId)
        .order("requested_at", { ascending: false });

      if (error) throw error;

      res.json({
        user_id: userId,
        payout_requests: requests || [],
        count: requests?.length || 0,
      });
    } catch (err: any) {
      console.error("Get payout requests error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Register a payout method (SETTLEMENT-4)
  app.post("/api/settlement/payout-methods", requireAuth, async (req, res) => {
    try {
      const { method_type, metadata, is_primary } = req.body;
      const userId = req.session.userId;

      if (!method_type || !metadata) {
        return res
          .status(400)
          .json({ error: "Missing method_type or metadata" });
      }

      const result = await registerPayoutMethod({
        user_id: userId,
        method_type,
        metadata,
        is_primary,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({
        success: true,
        method_id: result.method_id,
        message: "Payout method registered successfully",
      });
    } catch (err: any) {
      console.error("Register payout method error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get user's payout methods (SETTLEMENT-5)
  app.get(
    "/api/settlement/payout-methods",
    requireAuth,
    async (req, res) => {
      try {
        const userId = req.session.userId;

        const { data: methods, error } = await supabase
          .from("payout_methods")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        res.json({
          user_id: userId,
          payout_methods: methods || [],
          count: methods?.length || 0,
        });
      } catch (err: any) {
        console.error("Get payout methods error:", err);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // Process a payout (admin/system) (SETTLEMENT-6)
  app.post(
    "/api/settlement/payouts/process",
    requireAuth,
    async (req, res) => {
      try {
        const {
          payout_request_id,
          escrow_account_id,
          payout_method_id,
          amount,
        } = req.body;
        const userId = req.session.userId;

        if (
          !escrow_account_id ||
          !payout_method_id ||
          !amount
        ) {
          return res.status(400).json({
            error:
              "Missing escrow_account_id, payout_method_id, or amount",
          });
        }

        const result = await processPayout({
          payout_request_id,
          user_id: userId,
          escrow_account_id,
          payout_method_id,
          amount,
        });

        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }

        res.status(201).json({
          success: true,
          payout_id: result.payout_id,
          message: "Payout processing started",
        });
      } catch (err: any) {
        console.error("Process payout error:", err);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // Complete a payout (SETTLEMENT-7)
  app.post(
    "/api/settlement/payouts/:payoutId/complete",
    requireAuth,
    async (req, res) => {
      try {
        const { payoutId } = req.params;
        const { external_transaction_id } = req.body;

        const result = await completePayout(payoutId, external_transaction_id);

        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }

        res.json({
          success: true,
          message: "Payout completed successfully",
        });
      } catch (err: any) {
        console.error("Complete payout error:", err);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // Fail a payout (SETTLEMENT-8)
  app.post(
    "/api/settlement/payouts/:payoutId/fail",
    requireAuth,
    async (req, res) => {
      try {
        const { payoutId } = req.params;
        const { failure_reason } = req.body;

        const result = await failPayout(payoutId, failure_reason);

        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }

        res.json({
          success: true,
          message: "Payout marked as failed, funds restored to escrow",
        });
      } catch (err: any) {
        console.error("Fail payout error:", err);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // Get user's payout history (SETTLEMENT-9)
  app.get("/api/settlement/payouts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await getPayoutHistory(userId, limit);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        user_id: userId,
        payouts: result.payouts,
        count: result.count,
      });
    } catch (err: any) {
      console.error("Get payout history error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ========== CONTRIBUTOR DASHBOARD: EARNINGS VIEW ==========
  // Import dashboard functions
  const {
    getUserEarnings,
    getProjectEarnings,
    getEarningsSummary,
    getProjectLeaderboard,
  } = await import("./dashboard.js");

  // Get all earnings for authenticated user (DASHBOARD-1)
  app.get("/api/dashboard/earnings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const result = await getUserEarnings(userId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json(result.data);
    } catch (err: any) {
      console.error("Get user earnings error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get earnings for a specific project (DASHBOARD-2)
  app.get("/api/dashboard/earnings/:projectId", requireAuth, async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.session.userId;

      const result = await getProjectEarnings(userId, projectId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json(result.data);
    } catch (err: any) {
      console.error("Get project earnings error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get earnings summary for user (DASHBOARD-3)
  app.get("/api/dashboard/summary", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const result = await getEarningsSummary(userId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json(result.data);
    } catch (err: any) {
      console.error("Get earnings summary error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get leaderboard for a project (DASHBOARD-4)
  app.get(
    "/api/dashboard/leaderboard/:projectId",
    async (req, res) => {
      try {
        const { projectId } = req.params;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await getProjectLeaderboard(projectId, limit);

        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }

        res.json(result.data);
      } catch (err: any) {
        console.error("Get leaderboard error:", err);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // ========== API-TRIGGERED REVENUE ==========
  // Record custom revenue event (API trigger) (API-REVENUE-1)
  app.post("/api/revenue/trigger", requireAuth, async (req, res) => {
    try {
      const {
        source_type,
        project_id,
        gross_amount,
        platform_fee,
        metadata,
      } = req.body;
      const userId = req.session.userId;

      if (!source_type || !project_id || !gross_amount) {
        return res.status(400).json({
          error: "Missing source_type, project_id, or gross_amount",
        });
      }

      if (!["api", "subscription", "donation"].includes(source_type)) {
        return res.status(400).json({
          error: "source_type must be 'api', 'subscription', or 'donation'",
        });
      }

      // Record revenue event
      const eventResult = await recordRevenueEvent({
        source_type,
        source_id: `api-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        gross_amount: parseFloat(gross_amount),
        platform_fee: platform_fee ? parseFloat(platform_fee) : 0,
        currency: "USD",
        project_id,
        org_id: null,
        metadata,
        requester_org_id: userId,
      });

      if (!eventResult.success) {
        return res.status(400).json({ error: eventResult.error });
      }

      // Compute and record splits
      const splitsResult = await computeRevenueSplits(
        project_id,
        (parseFloat(gross_amount) - (platform_fee ? parseFloat(platform_fee) : 0)).toFixed(2),
        new Date()
      );

      if (!splitsResult.success) {
        return res.status(400).json({
          error: `Failed to compute splits: ${splitsResult.error}`,
        });
      }

      // Record allocations
      const allocResult = await recordSplitAllocations(
        eventResult.id,
        project_id,
        splitsResult.allocations,
        splitsResult.split_version
      );

      if (!allocResult.success) {
        return res.status(400).json({
          error: `Failed to record allocations: ${allocResult.error}`,
        });
      }

      // Deposit to escrow for each contributor
      for (const [userId, allocation] of Object.entries(
        splitsResult.allocations || {}
      )) {
        const allocationData = allocation as any;
        await depositToEscrow(
          userId,
          project_id,
          allocationData.allocated_amount
        );
      }

      res.status(201).json({
        success: true,
        revenue_event_id: eventResult.id,
        allocations: splitsResult.allocations,
        message: "Revenue recorded and splits computed",
      });
    } catch (err: any) {
      console.error("API revenue trigger error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get API revenue events for a project (API-REVENUE-2)
  app.get(
    "/api/revenue/api-events/:projectId",
    requireAuth,
    async (req, res) => {
      try {
        const { projectId } = req.params;

        const { data: events, error } = await supabase
          .from("revenue_events")
          .select("*")
          .eq("project_id", projectId)
          .eq("source_type", "api")
          .order("created_at", { ascending: false });

        if (error) throw error;

        res.json({
          project_id: projectId,
          api_events: events || [],
          count: events?.length || 0,
        });
      } catch (err: any) {
        console.error("Get API revenue events error:", err);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // ========== OS KERNEL ROUTES ==========
  // Identity Linking
  app.post("/api/os/link/start", async (req, res) => {
    try {
      const { provider } = req.body;
      const userId = (req.headers["x-user-id"] as string) || req.session.userId;

      if (!provider || !userId) {
        return res.status(400).json({ error: "Missing provider or user" });
      }

      const linkingSession = {
        id: `link_${Date.now()}`,
        state: Math.random().toString(36).substring(7),
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
      };

      res.json({
        linking_session_id: linkingSession.id,
        state: linkingSession.state,
        redirect_url: `/os/link/redirect?provider=${provider}&state=${linkingSession.state}`,
      });
    } catch (error) {
      console.error("Link start error:", error);
      res.status(500).json({ error: "Failed to start linking" });
    }
  });

  app.post("/api/os/link/complete", async (req, res) => {
    try {
      const { provider, external_id, external_username } = req.body;
      const userId = (req.headers["x-user-id"] as string) || req.session.userId;

      if (!provider || !external_id || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { data, error } = await supabase
        .from("aethex_subject_identities")
        .upsert(
          {
            provider,
            external_id,
            external_username,
            verified_at: new Date().toISOString(),
          },
          {
            onConflict: "provider,external_id",
          }
        )
        .select();

      if (error) throw error;

      await supabase.from("aethex_audit_log").insert({
        action: "link_identity",
        actor_id: userId,
        actor_type: "user",
        resource_type: "subject_identity",
        resource_id: data?.[0]?.id || "unknown",
        changes: { provider, external_id },
        status: "success",
      });

      res.json({
        success: true,
        identity: {
          provider,
          external_id,
          verified_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Link complete error:", error);
      res.status(500).json({ error: "Failed to complete linking" });
    }
  });

  app.post("/api/os/link/unlink", async (req, res) => {
    try {
      const { provider, external_id } = req.body;
      const userId = (req.headers["x-user-id"] as string) || req.session.userId;

      if (!provider || !external_id) {
        return res.status(400).json({ error: "Missing provider or external_id" });
      }

      const { data, error } = await supabase
        .from("aethex_subject_identities")
        .update({ revoked_at: new Date().toISOString() })
        .match({ provider, external_id })
        .select();

      if (error) throw error;

      await supabase.from("aethex_audit_log").insert({
        action: "unlink_identity",
        actor_id: userId,
        actor_type: "user",
        resource_type: "subject_identity",
        resource_id: data?.[0]?.id || "unknown",
        changes: { revoked: true },
        status: "success",
      });

      res.json({ success: true, message: "Identity unlinked" });
    } catch (error) {
      console.error("Unlink error:", error);
      res.status(500).json({ error: "Failed to unlink identity" });
    }
  });

  // Entitlements
  app.post("/api/os/entitlements/issue", async (req, res) => {
    try {
      const issuerId = req.headers["x-issuer-id"] as string;
      const {
        subject_id,
        external_subject_ref,
        entitlement_type,
        scope,
        data,
        expires_at,
      } = req.body;

      if (!issuerId || (!subject_id && !external_subject_ref)) {
        return res
          .status(400)
          .json({ error: "Missing issuer_id or subject reference" });
      }

      const { data: entitlement, error } = await supabase
        .from("aethex_entitlements")
        .insert({
          issuer_id: issuerId,
          subject_id: subject_id || null,
          external_subject_ref: external_subject_ref || null,
          entitlement_type,
          scope,
          data: data || {},
          status: "active",
          expires_at: expires_at || null,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("aethex_audit_log").insert({
        action: "issue_entitlement",
        actor_id: issuerId,
        actor_type: "issuer",
        resource_type: "entitlement",
        resource_id: entitlement?.id || "unknown",
        changes: { entitlement_type, scope },
        status: "success",
      });

      res.json({
        success: true,
        entitlement: {
          id: entitlement?.id,
          type: entitlement_type,
          scope,
          created_at: entitlement?.created_at,
        },
      });
    } catch (error) {
      console.error("Issue error:", error);
      res.status(500).json({ error: "Failed to issue entitlement" });
    }
  });

  app.post("/api/os/entitlements/verify", async (req, res) => {
    try {
      const { entitlement_id } = req.body;

      if (!entitlement_id) {
        return res.status(400).json({ error: "Missing entitlement_id" });
      }

      const { data: entitlement, error } = await supabase
        .from("aethex_entitlements")
        .select("*, issuer:aethex_issuers(*)")
        .eq("id", entitlement_id)
        .single();

      if (error || !entitlement) {
        return res
          .status(404)
          .json({ valid: false, reason: "Entitlement not found" });
      }

      if (entitlement.status === "revoked") {
        return res.json({
          valid: false,
          reason: "revoked",
          revoked_at: entitlement.revoked_at,
          revocation_reason: entitlement.revocation_reason,
        });
      }

      if (
        entitlement.status === "expired" ||
        (entitlement.expires_at && new Date() > new Date(entitlement.expires_at))
      ) {
        return res.json({
          valid: false,
          reason: "expired",
          expires_at: entitlement.expires_at,
        });
      }

      await supabase.from("aethex_entitlement_events").insert({
        entitlement_id,
        event_type: "verified",
        actor_type: "system",
        reason: "API verification",
      });

      res.json({
        valid: true,
        entitlement: {
          id: entitlement.id,
          type: entitlement.entitlement_type,
          scope: entitlement.scope,
          data: entitlement.data,
          issuer: {
            id: entitlement.issuer?.id,
            name: entitlement.issuer?.name,
            class: entitlement.issuer?.issuer_class,
          },
          issued_at: entitlement.created_at,
          expires_at: entitlement.expires_at,
        },
      });
    } catch (error) {
      console.error("Verify error:", error);
      res.status(500).json({ error: "Failed to verify entitlement" });
    }
  });

  app.get("/api/os/entitlements/resolve", async (req, res) => {
    try {
      const { platform, id, subject_id } = req.query;

      let entitlements: any[] = [];

      if (subject_id) {
        const { data, error } = await supabase
          .from("aethex_entitlements")
          .select("*, issuer:aethex_issuers(*)")
          .eq("subject_id", subject_id as string)
          .eq("status", "active");

        if (error) throw error;
        entitlements = data || [];
      } else if (platform && id) {
        const externalRef = `${platform}:${id}`;
        const { data, error } = await supabase
          .from("aethex_entitlements")
          .select("*, issuer:aethex_issuers(*)")
          .eq("external_subject_ref", externalRef)
          .eq("status", "active");

        if (error) throw error;
        entitlements = data || [];
      } else {
        return res.status(400).json({ error: "Missing platform/id or subject_id" });
      }

      res.json({
        entitlements: entitlements.map((e) => ({
          id: e.id,
          type: e.entitlement_type,
          scope: e.scope,
          data: e.data,
          issuer: {
            name: e.issuer?.name,
            class: e.issuer?.issuer_class,
          },
          issued_at: e.created_at,
          expires_at: e.expires_at,
        })),
      });
    } catch (error) {
      console.error("Resolve error:", error);
      res.status(500).json({ error: "Failed to resolve entitlements" });
    }
  });

  app.post("/api/os/entitlements/revoke", async (req, res) => {
    try {
      const issuerId = req.headers["x-issuer-id"] as string;
      const { entitlement_id, reason } = req.body;

      if (!entitlement_id || !reason) {
        return res
          .status(400)
          .json({ error: "Missing entitlement_id or reason" });
      }

      const { data, error } = await supabase
        .from("aethex_entitlements")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString(),
          revocation_reason: reason,
        })
        .eq("id", entitlement_id)
        .select();

      if (error) throw error;

      await supabase.from("aethex_entitlement_events").insert({
        entitlement_id,
        event_type: "revoked",
        actor_id: issuerId,
        actor_type: "issuer",
        reason,
      });

      await supabase.from("aethex_audit_log").insert({
        action: "revoke_entitlement",
        actor_id: issuerId,
        actor_type: "issuer",
        resource_type: "entitlement",
        resource_id: entitlement_id,
        changes: { status: "revoked", reason },
        status: "success",
      });

      res.json({ success: true, message: "Entitlement revoked" });
    } catch (error) {
      console.error("Revoke error:", error);
      res.status(500).json({ error: "Failed to revoke entitlement" });
    }
  });

  // Simple in-memory file storage (per-user, session-based)
  const fileStore = new Map<string, any[]>();

  app.get("/api/files", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const files = fileStore.get(userId) || [];
      const { path } = req.query;

      // Filter by path
      const filtered = path 
        ? files.filter(f => f.path.startsWith(`${path}/`) || f.path === path)
        : files.filter(f => f.path === '/');

      res.json({ files: filtered });
    } catch (error) {
      console.error("File list error:", error);
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  app.post("/api/files", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { name, type, path, content, language } = req.body;
      if (!name || !type || !path) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const fileId = randomUUID();
      const newFile = {
        id: fileId,
        user_id: userId,
        name,
        type,
        path,
        content: content || '',
        language: language || null,
        size: content?.length || 0,
        mime_type: null,
        parent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const files = fileStore.get(userId) || [];
      files.push(newFile);
      fileStore.set(userId, files);

      res.json(newFile);
    } catch (error) {
      console.error("File creation error:", error);
      res.status(500).json({ error: "Failed to create file" });
    }
  });

  app.patch("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      const { name, content } = req.body;

      const files = fileStore.get(userId) || [];
      const file = files.find(f => f.id === id);

      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      if (name) file.name = name;
      if (content !== undefined) file.content = content;
      file.updated_at = new Date().toISOString();

      res.json(file);
    } catch (error) {
      console.error("File update error:", error);
      res.status(500).json({ error: "Failed to update file" });
    }
  });

  app.delete("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      let files = fileStore.get(userId) || [];
      const fileToDelete = files.find(f => f.id === id);

      if (!fileToDelete) {
        return res.status(404).json({ error: "File not found" });
      }

      // If folder, delete all files inside
      if (fileToDelete.type === 'folder') {
        files = files.filter(f => !f.path.startsWith(fileToDelete.path + '/') && f.id !== id);
      } else {
        files = files.filter(f => f.id !== id);
      }

      fileStore.set(userId, files);
      res.json({ id, deleted: true });
    } catch (error) {
      console.error("File delete error:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  app.get("/api/os/issuers/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const { data: issuer, error } = await supabase
        .from("aethex_issuers")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !issuer) {
        return res.status(404).json({ error: "Issuer not found" });
      }

      res.json({
        id: issuer.id,
        name: issuer.name,
        class: issuer.issuer_class,
        scopes: issuer.scopes,
        public_key: issuer.public_key,
        is_active: issuer.is_active,
        metadata: issuer.metadata,
      });
    } catch (error) {
      console.error("Issuer fetch error:", error);
      res.status(500).json({ error: "Failed to fetch issuer" });
    }
  });

  return httpServer;
}
