import { Request, Response, NextFunction } from "express";
import { realmCapabilities, type Capability, type Realm } from "../shared/app-registry.js";

// Map endpoints to required capabilities
const endpointPolicies: Record<string, { realm?: Realm; capabilities: Capability[] }> = {
  "/api/hub/messaging": { realm: "corporation", capabilities: ["social", "messaging"] },
  "/api/hub/marketplace": { realm: "corporation", capabilities: ["commerce", "marketplace"] },
  "/api/hub/projects": { realm: "corporation", capabilities: ["social"] },
  "/api/hub/analytics": { realm: "corporation", capabilities: ["analytics"] },
  "/api/hub/file-manager": { realm: "corporation", capabilities: ["file_storage"] },
  "/api/hub/code-gallery": { realm: "corporation", capabilities: ["social"] },
  "/api/hub/notifications": { realm: "corporation", capabilities: ["social"] },
  "/api/os/entitlements/issue": { capabilities: ["credential_verification"] },
  "/api/os/entitlements/verify": { capabilities: ["credential_verification"] },
  "/api/os/link": { capabilities: ["identity_linking"] },
};

export function capabilityGuard(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  const userRealm = (req.headers["x-user-realm"] as Realm) || "foundation";

  // Find matching policy
  const policyEntry = Object.entries(endpointPolicies).find(([pattern]) =>
    path.startsWith(pattern)
  );

  if (!policyEntry) {
    // No policy = allowed
    return next();
  }

  const [, { realm: requiredRealm, capabilities: requiredCaps }] = policyEntry;

  // Check realm
  if (requiredRealm && userRealm !== requiredRealm) {
    return res.status(403).json({
      error: "Access denied",
      reason: `This endpoint requires ${requiredRealm} realm`,
    });
  }

  // Check capabilities
  const userCaps = realmCapabilities[userRealm];
  const hasCapabilities = requiredCaps.every((cap) => userCaps.includes(cap));

  if (!hasCapabilities) {
    return res.status(403).json({
      error: "Access denied",
      reason: "Missing required capabilities",
      required: requiredCaps,
      available: userCaps,
    });
  }

  next();
}
