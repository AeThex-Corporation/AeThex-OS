import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, signupSchema } from "@shared/schema";
import { supabase } from "./supabase";
import { getChatResponse } from "./openai";

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
      const isAdmin = profile?.role === 'admin' || email.includes('admin');
      
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
  app.get("/api/sites", requireAdmin, async (req, res) => {
    try {
      const sites = await storage.getSites();
      res.json(sites);
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
  
  // Get achievements (admin only)
  app.get("/api/achievements", requireAdmin, async (req, res) => {
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
      
      const response = await getChatResponse(message, history);
      res.json({ response });
    } catch (err: any) {
      console.error("Chat error:", err);
      res.status(500).json({ error: "Failed to get response" });
    }
  });

  return httpServer;
}
