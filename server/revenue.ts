import { supabase } from "./supabase.js";
import type { InsertRevenueEvent } from "../shared/schema.js";

/**
 * Format a number to a decimal string with 2 places.
 * Safe for use with Postgres decimal columns.
 * @param n The number to format
 * @returns String like "12.34"
 */
export function toDecimalString(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

export interface RecordRevenueEventInput {
  source_type: "marketplace" | "api" | "subscription" | "donation";
  source_id: string;
  gross_amount: number;
  platform_fee?: number;
  currency?: string;
  project_id?: string | null;
  org_id?: string | null;
  metadata?: Record<string, any> | null;
  requester_org_id?: string; // For access control
}

/**
 * Record a revenue event in the ledger.
 * Validates amounts and computes net server-side.
 * Enforces org isolation if requester_org_id is provided.
 */
export async function recordRevenueEvent(
  input: RecordRevenueEventInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const {
    source_type,
    source_id,
    gross_amount,
    platform_fee = 0,
    currency = "USD",
    project_id = null,
    org_id = null,
    metadata = null,
    requester_org_id,
  } = input;

  // Validate amounts
  if (gross_amount < 0) {
    return { success: false, error: "gross_amount cannot be negative" };
  }
  if (platform_fee < 0) {
    return { success: false, error: "platform_fee cannot be negative" };
  }

  const net_amount = gross_amount - platform_fee;
  if (net_amount < 0) {
    return {
      success: false,
      error: "net_amount (gross_amount - platform_fee) cannot be negative",
    };
  }

  // Org isolation: if requester_org_id is provided and differs from org_id, reject (unless admin bypass)
  if (requester_org_id && org_id && requester_org_id !== org_id) {
    return { success: false, error: "Org mismatch: cannot write to different org" };
  }

  // Convert amounts to safe decimal strings
  const gross_amount_str = toDecimalString(gross_amount);
  const platform_fee_str = toDecimalString(platform_fee);
  const net_amount_str = toDecimalString(net_amount);

  const event: InsertRevenueEvent = {
    source_type,
    source_id,
    gross_amount: gross_amount_str,
    platform_fee: platform_fee_str,
    net_amount: net_amount_str,
    currency,
    project_id,
    organization_id: org_id || '',
    metadata,
  };

  try {
    const { data, error } = await supabase
      .from("revenue_events")
      .insert([event])
      .select("id");

    if (error) {
      console.error("Revenue event insert error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.[0]?.id };
  } catch (err) {
    console.error("Unexpected error recording revenue event:", err);
    return { success: false, error: "Internal server error" };
  }
}
