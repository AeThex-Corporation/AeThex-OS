import { Request, Response, NextFunction } from "express";
import { supabase } from "./supabase.js";

// Extend Express Request to include org context
declare global {
  namespace Express {
    interface Request {
      orgId?: string;
      orgRole?: string;
      orgMemberId?: string;
      orgMembership?: {
        id: string;
        organization_id: string;
        user_id: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware: Attach organization context to request
 * Looks for org ID in header 'x-org-id' or session
 * Non-blocking - sets orgId if found, continues if not
 */
export async function attachOrgContext(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return next(); // No user, no org context
    }

    // Try to get org ID from header first
    let orgId = req.headers['x-org-id'] as string;

    // If no header, try session (if we add session-based org selection later)
    if (!orgId && (req.session as any).currentOrgId) {
      orgId = (req.session as any).currentOrgId;
    }

    // If still no org, try to get user's default/first org
    if (!orgId) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (membership) {
        orgId = membership.organization_id;
      }
    }

    // If we have an org, verify membership and attach context
    if (orgId) {
      const { data: membership, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId)
        .eq('user_id', userId)
        .single();

      if (!error && membership) {
        req.orgId = orgId;
        req.orgRole = membership.role;
        req.orgMemberId = membership.id;
        req.orgMembership = membership;
      }
    }

    next();
  } catch (error) {
    console.error('Error attaching org context:', error);
    next(); // Continue even on error
  }
}

/**
 * Middleware: Require organization membership
 * Must be used after attachOrgContext
 */
export function requireOrgMember(req: Request, res: Response, next: NextFunction) {
  if (!req.orgId || !req.orgRole) {
    return res.status(400).json({ 
      error: "Organization context required",
      message: "Please select an organization (x-org-id header) to access this resource"
    });
  }
  next();
}

/**
 * Middleware: Require specific org role
 */
export function requireOrgRole(minRole: 'owner' | 'admin' | 'member' | 'viewer') {
  const roleHierarchy = ['viewer', 'member', 'admin', 'owner'];
  const minLevel = roleHierarchy.indexOf(minRole);

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.orgRole) {
      return res.status(403).json({ error: "Organization role required" });
    }

    const userLevel = roleHierarchy.indexOf(req.orgRole);
    if (userLevel < minLevel) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        required: minRole,
        current: req.orgRole
      });
    }

    next();
  };
}

/**
 * Helper: Check if user has access to a project
 * Returns true if user is:
 * - Project owner
 * - Project collaborator with sufficient role
 * - Org member (if project is in an org)
 */
export async function assertProjectAccess(
  projectId: string,
  userId: string,
  minRole: 'owner' | 'admin' | 'contributor' | 'viewer' = 'viewer'
): Promise<{ hasAccess: boolean; reason?: string; project?: any }> {
  try {
    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return { hasAccess: false, reason: 'Project not found' };
    }

    // Check if user is owner
    const ownerId = project.owner_user_id || project.user_id || project.owner_id;
    if (ownerId === userId) {
      return { hasAccess: true, project };
    }

    // Check collaborator status
    const { data: collab } = await supabase
      .from('project_collaborators')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (collab) {
      const roleHierarchy = ['viewer', 'contributor', 'admin', 'owner'];
      const userLevel = roleHierarchy.indexOf(collab.role);
      const minLevel = roleHierarchy.indexOf(minRole);

      if (userLevel >= minLevel) {
        return { hasAccess: true, project };
      }
    }

    // Check org membership (if project is in an org)
    if (project.organization_id) {
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', project.organization_id)
        .eq('user_id', userId)
        .single();

      if (orgMember) {
        // Org members can at least view org projects
        if (minRole === 'viewer') {
          return { hasAccess: true, project };
        }
        
        // Admin+ can manage
        if (['admin', 'owner'].includes(orgMember.role)) {
          return { hasAccess: true, project };
        }
      }
    }

    return { hasAccess: false, reason: 'Insufficient permissions' };
  } catch (error) {
    console.error('Error checking project access:', error);
    return { hasAccess: false, reason: 'Access check failed' };
  }
}

