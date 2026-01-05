import { Request } from "express";
import { supabase } from "./supabase.js";

/**
 * Get orgId from request and throw if missing
 */
export function getOrgIdOrThrow(req: Request): string {
  if (!req.orgId) {
    throw new Error("Organization context required but not found");
  }
  return req.orgId;
}

/**
 * Return organization_id filter object
 */
export function orgEq(req: Request): { organization_id: string } {
  return { organization_id: getOrgIdOrThrow(req) };
}

/**
 * Return a Supabase query builder scoped to organization
 */
export function orgScoped(table: string, req: Request) {
  const orgId = getOrgIdOrThrow(req);
  return supabase.from(table).eq('organization_id', orgId);
}
