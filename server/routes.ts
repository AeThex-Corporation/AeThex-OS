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
import { attachOrgContext, requireOrgMember, assertProjectAccess } from "./org-middleware.js";
import { orgScoped, orgEq, getOrgIdOrThrow } from "./org-storage.js";

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

// Project access middleware - requires project access with minimum role
function requireProjectAccess(minRole: 'owner' | 'admin' | 'contributor' | 'viewer' = 'viewer') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const projectId = req.params.id || req.params.projectId || req.body.project_id;
    if (!projectId) {
      return res.status(400).json({ error: "Project ID required" });
    }

    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const accessCheck = await assertProjectAccess(projectId, userId, minRole);
    
    if (!accessCheck.hasAccess) {
      return res.status(403).json({ 
        error: "Access denied",
        message: accessCheck.reason || "You do not have permission to access this project"
      });
    }

    // Attach project to request for later use
    (req as any).project = accessCheck.project;
    next();
  };
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
  
  // ========== ORGANIZATION ROUTES (Multi-tenancy) ==========
  
  // Apply org context middleware to all org-scoped routes
  app.use("/api/orgs", requireAuth, attachOrgContext);
  app.use("/api/projects", attachOrgContext);
  app.use("/api/files", attachOrgContext);
  app.use("/api/marketplace", attachOrgContext);
  
  // Get user's organizations
  app.get("/api/orgs", async (req, res) => {
    try {
      const { data: memberships, error } = await supabase
        .from("organization_members")
        .select("organization_id, role, organizations(*)")
        .eq("user_id", req.session.userId);

      if (error) throw error;

      const orgs = memberships?.map(m => ({
        ...m.organizations,
        userRole: m.role,
      })) || [];

      res.json({ organizations: orgs });
    } catch (error: any) {
      console.error("Fetch orgs error:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  // Create new organization
  app.post("/api/orgs", async (req, res) => {
    try {
      const { name, slug } = req.body;
      
      if (!name || !slug) {
        return res.status(400).json({ error: "Name and slug are required" });
      }

      // Check slug uniqueness
      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existing) {
        return res.status(400).json({ error: "Slug already taken" });
      }

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name,
          slug,
          owner_user_id: req.session.userId,
          plan: "free",
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add creator as owner member
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: org.id,
          user_id: req.session.userId,
          role: "owner",
        });

      if (memberError) throw memberError;

      res.status(201).json({ organization: org });
    } catch (error: any) {
      console.error("Create org error:", error);
      res.status(500).json({ error: error.message || "Failed to create organization" });
    }
  });

  // Get organization by slug
  app.get("/api/orgs/:slug", async (req, res) => {
    try {
      const { data: org, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", req.params.slug)
        .single();

      if (error || !org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Check if user is member
      const { data: membership } = await supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", org.id)
        .eq("user_id", req.session.userId)
        .single();

      if (!membership) {
        return res.status(403).json({ error: "Not a member of this organization" });
      }

      res.json({ organization: { ...org, userRole: membership.role } });
    } catch (error: any) {
      console.error("Fetch org error:", error);
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  });

  // Get organization members
  app.get("/api/orgs/:slug/members", async (req, res) => {
    try {
      // Get org
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", req.params.slug)
        .single();

      if (orgError || !org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Check if user is member
      const { data: userMembership } = await supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", org.id)
        .eq("user_id", req.session.userId)
        .single();

      if (!userMembership) {
        return res.status(403).json({ error: "Not a member of this organization" });
      }

      // Get all members
      const { data: members, error: membersError } = await supabase
        .from("organization_members")
        .select("id, user_id, role, created_at, profiles(username, full_name, avatar_url, email)")
        .eq("organization_id", org.id);

      if (membersError) throw membersError;

      res.json({ members });
    } catch (error: any) {
      console.error("Fetch members error:", error);
      res.status(500).json({ error: "Failed to fetch members" });
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
  
  // Update profile (self-update OR org admin)
  app.patch("/api/profiles/:id", requireAuth, attachOrgContext, async (req, res) => {
    try {
      const targetProfileId = req.params.id;
      const requesterId = req.session.userId!;
      
      // Check authorization: self-update OR org admin/owner
      const isSelfUpdate = requesterId === targetProfileId;
      const isOrgAdmin = req.orgRole && ['admin', 'owner'].includes(req.orgRole);
      
      if (!isSelfUpdate && !isOrgAdmin) {
        return res.status(403).json({ 
          error: "Forbidden",
          message: "You can only update your own profile or must be an org admin/owner"
        });
      }
      
      // Log org admin updates for audit trail
      if (!isSelfUpdate && isOrgAdmin && req.orgId) {
        console.log(`[AUDIT] Org ${req.orgRole} ${requesterId} updating profile ${targetProfileId} (org: ${req.orgId})`);
      }
      
      const profile = await storage.updateProfile(targetProfileId, req.body);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get all projects (admin only OR org-scoped for user)
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      // Admin sees all
      if (req.session.isAdmin) {
        const projects = await storage.getProjects();
        return res.json(projects);
      }

      // Regular user: filter by org if available
      if (req.orgId) {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("organization_id", req.orgId);

        if (error) throw error;
        return res.json(data || []);
      }

      // Fallback: user's own projects
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .or(`owner_user_id.eq.${req.session.userId},user_id.eq.${req.session.userId}`);

      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get single project
  app.get("/api/projects/:id", requireAuth, requireProjectAccess('viewer'), async (req, res) => {
    try {
      res.json((req as any).project);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get project collaborators
  app.get("/api/projects/:id/collaborators", requireAuth, requireProjectAccess('contributor'), async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("project_collaborators")
        .select("id, user_id, role, permissions, created_at, profiles(username, full_name, avatar_url, email)")
        .eq("project_id", req.params.id);

      if (error) throw error;

      res.json({ collaborators: data || [] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add project collaborator
  app.post("/api/projects/:id/collaborators", requireAuth, async (req, res) => {
    try {
      const accessCheck = await assertProjectAccess(
        req.params.id,
        req.session.userId!,
        'admin'
      );

      if (!accessCheck.hasAccess) {
        return res.status(403).json({ error: "Only project owners/admins can add collaborators" });
      }

      const { user_id, role = 'contributor' } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: "user_id is required" });
      }

      // Check if user exists
      const { data: userExists } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user_id)
        .single();

      if (!userExists) {
        return res.status(404).json({ error: "User not found" });
      }

      // Add collaborator
      const { data, error } = await supabase
        .from("project_collaborators")
        .insert({
          project_id: req.params.id,
          user_id,
          role,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          return res.status(400).json({ error: "User is already a collaborator" });
        }
        throw error;
      }

      res.status(201).json({ collaborator: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update collaborator role/permissions
  app.patch("/api/projects/:id/collaborators/:collabId", requireAuth, async (req, res) => {
    try {
      const accessCheck = await assertProjectAccess(
        req.params.id,
        req.session.userId!,
        'admin'
      );

      if (!accessCheck.hasAccess) {
        return res.status(403).json({ error: "Only project owners/admins can modify collaborators" });
      }

      const { role, permissions } = req.body;
      const updates: any = {};

      if (role) updates.role = role;
      if (permissions !== undefined) updates.permissions = permissions;

      const { data, error } = await supabase
        .from("project_collaborators")
        .update(updates)
        .eq("id", req.params.collabId)
        .eq("project_id", req.params.id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: "Collaborator not found" });
      }

      res.json({ collaborator: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Remove collaborator
  app.delete("/api/projects/:id/collaborators/:collabId", requireAuth, async (req, res) => {
    try {
      const accessCheck = await assertProjectAccess(
        req.params.id,
        req.session.userId!,
        'admin'
      );

      if (!accessCheck.hasAccess) {
        return res.status(403).json({ error: "Only project owners/admins can remove collaborators" });
      }

      const { error } = await supabase
        .from("project_collaborators")
        .delete()
        .eq("id", req.params.collabId)
        .eq("project_id", req.params.id);

      if (error) throw error;

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // ========== NEW ADMIN ROUTES ==========
  
  // Get all aethex sites (admin only)
  // List all sites
  app.get("/api/sites", requireAuth, attachOrgContext, requireOrgMember, async (req, res) => {
    try {
      const { data, error } = await orgScoped('aethex_sites', req)
        .select('*')
        .order('last_check', { ascending: false });
      
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create a new site
  app.post("/api/sites", requireAuth, attachOrgContext, requireOrgMember, async (req, res) => {
    try {
      const orgId = getOrgIdOrThrow(req);
      const { data, error } = await supabase
        .from('aethex_sites')
        .insert({ ...req.body, organization_id: orgId })
        .select()
        .single();
      
      if (error) throw error;
      res.status(201).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update a site
  app.patch("/api/sites/:id", requireAuth, attachOrgContext, requireOrgMember, async (req, res) => {
    try {
      const orgId = getOrgIdOrThrow(req);
      const { data, error } = await supabase
        .from('aethex_sites')
        .update(req.body)
        .eq('id', req.params.id)
        .eq('organization_id', orgId)
        .select()
        .single();
      
      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: "Site not found or access denied" });
      }
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a site
  app.delete("/api/sites/:id", requireAuth, attachOrgContext, requireOrgMember, async (req, res) => {
    try {
      const orgId = getOrgIdOrThrow(req);
      const { error, count } = await supabase
        .from('aethex_sites')
        .delete({ count: 'exact' })
        .eq('id', req.params.id)
        .eq('organization_id', orgId);
      
      if (error) throw error;
      if ((count ?? 0) === 0) {
        return res.status(404).json({ error: "Site not found or access denied" });
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
      let query = supabase
        .from('aethex_opportunities')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Optional org filter
      if (req.query.org_id) {
        query = query.eq('organization_id', req.query.org_id as string);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single opportunity
  // PUBLIC: Opportunities are publicly viewable for discovery
  app.get("/api/opportunities/:id", async (req, res) => {
    const IS_PUBLIC = true; // Intentionally public for marketplace discovery
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
  app.post("/api/opportunities", requireAuth, attachOrgContext, requireOrgMember, async (req, res) => {
    try {
      const orgId = getOrgIdOrThrow(req);
      const { data, error } = await supabase
        .from('aethex_opportunities')
        .insert({ ...req.body, organization_id: orgId })
        .select()
        .single();
      
      if (error) throw error;
      res.status(201).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update opportunity (admin only)
  app.patch("/api/opportunities/:id", requireAuth, attachOrgContext, requireOrgMember, async (req, res) => {
    try {
      const orgId = getOrgIdOrThrow(req);
      const { data, error } = await supabase
        .from('aethex_opportunities')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .eq('organization_id', orgId)
        .select()
        .single();
      
      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: "Opportunity not found or access denied" });
      }
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete opportunity (admin only)
  app.delete("/api/opportunities/:id", requireAuth, attachOrgContext, requireOrgMember, async (req, res) => {
    try {
      const orgId = getOrgIdOrThrow(req);
      const { error, count } = await supabase
        .from('aethex_opportunities')
        .delete({ count: 'exact' })
        .eq('id', req.params.id)
        .eq('organization_id', orgId);
      
      if (error) throw error;
      if ((count ?? 0) === 0) {
        return res.status(404).json({ error: "Opportunity not found or access denied" });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== AXIOM EVENTS ROUTES ==========
  
  // Get all events (public)
  // PUBLIC: Events are publicly viewable for community discovery, with optional org filtering
  app.get("/api/events", async (req, res) => {
    const IS_PUBLIC = true; // Intentionally public for community calendar
    try {
      let query = supabase
        .from('aethex_events')
        .select('*')
        .order('date', { ascending: true });
      
      // Optional org filter
      if (req.query.org_id) {
        query = query.eq('organization_id', req.query.org_id as string);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single event
  // PUBLIC: Events are publicly viewable for sharing/discovery
  app.get("/api/events/:id", async (req, res) => {
    const IS_PUBLIC = true; // Intentionally public for event sharing
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
  app.post("/api/events", requireAuth, attachOrgContext, requireOrgMember, async (req, res) => {
    try {
      const orgId = getOrgIdOrThrow(req);
      const { data, error } = await supabase
        .from('aethex_events')
        .insert({ ...req.body, organization_id: orgId })
        .select()
        .single();
      
      if (error) throw error;
      res.status(201).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update event (admin only)
  app.patch("/api/events/:id", requireAuth, attachOrgContext, requireOrgMember, async (req, res) => {
    try {
      const orgId = getOrgIdOrThrow(req);
      const { data, error } = await supabase
        .from('aethex_events')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .eq('organization_id', orgId)
        .select()
        .single();
      
      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: "Event not found or access denied" });
      }
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete event (admin only)
  app.delete("/api/events/:id", requireAuth, attachOrgContext, requireOrgMember, async (req, res) => {
    try {
      const orgId = getOrgIdOrThrow(req);
      const { error, count } = await supabase
        .from('aethex_events')
        .delete({ count: 'exact' })
        .eq('id', req.params.id)
        .eq('organization_id', orgId);
      
      if (error) throw error;
      if ((count ?? 0) === 0) {
        return res.status(404).json({ error: "Event not found or access denied" });
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

  // Simple in-memory file storage (per-user, per-org, session-based)
  const fileStore = new Map<string, any[]>();

  app.get("/api/files", requireAuth, attachOrgContext, requireOrgMember, async (req, res) => {
    try {
      const userId = req.session.userId;
      const orgId = getOrgIdOrThrow(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const key = `${userId}:${orgId}`;
      const files = fileStore.get(key) || [];
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

  app.post("/api/files", requireAuth, attachOrgContext, requireOrgMember, async (req, res) => {
    try {
      const userId = req.session.userId;
      const orgId = getOrgIdOrThrow(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { name, type, path, content, language, project_id } = req.body;
      if (!name || !type || !path) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const fileId = randomUUID();
      const newFile = {
        id: fileId,
        user_id: userId,
        organization_id: orgId,
        project_id: project_id || null,
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

      const key = `${userId}:${orgId}`;
      const files = fileStore.get(key) || [];
      files.push(newFile);
      fileStore.set(key, files);

      res.json(newFile);
    } catch (error) {
      console.error("File creation error:", error);
      res.status(500).json({ error: "Failed to create file" });
    }
  });

  app.patch("/api/files/:id", requireAuth, attachOrgContext, requireOrgMember, async (req, res) => {
    try {
      const userId = req.session.userId;
      const orgId = getOrgIdOrThrow(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      const { name, content } = req.body;

      const key = `${userId}:${orgId}`;
      const files = fileStore.get(key) || [];
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

  app.delete("/api/files/:id", requireAuth, attachOrgContext, requireOrgMember, async (req, res) => {
    try {
      const userId = req.session.userId;
      const orgId = getOrgIdOrThrow(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      const key = `${userId}:${orgId}`;
      let files = fileStore.get(key) || [];
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

      fileStore.set(key, files);
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
