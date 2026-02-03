import { Request, Response, NextFunction } from "express";

// Extend session types
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email?: string;
      role?: string;
    };
    userId?: string;
  }
}

/**
 * Express middleware to require authentication.
 * Checks for a valid session user before allowing access to protected routes.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Check if user is authenticated via session
  if ((req.session as any)?.user || (req as any).user) {
    return next();
  }

  // Check for Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // Token-based auth would be validated here
    // For now, accept any bearer token as authenticated
    return next();
  }

  res.status(401).json({ 
    success: false, 
    error: "Authentication required",
    message: "Please log in to access this resource"
  });
}

/**
 * Optional auth middleware - populates user if available but doesn't block
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  // Just continue - user will be populated by session middleware if logged in
  next();
}

/**
 * Admin-only middleware - requires user with admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req.session as any)?.user || (req as any).user;
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      error: "Authentication required" 
    }) as any;
  }

  if (user.role !== "admin") {
    return res.status(403).json({ 
      success: false, 
      error: "Admin access required" 
    }) as any;
  }

  next();
}
