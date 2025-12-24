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

  // ========== OS KERNEL ROUTES ==========
  // Identity Linking
  app.post("/api/os/link/start", async (req, res) => {
    try {
      const { provider } = req.body;
      const userId = req.session.userId;

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
      const userId = req.session.userId;

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
      const userId = req.session.userId;

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
