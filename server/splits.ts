import { supabase } from "./supabase.js";
import { toDecimalString } from "./revenue.js";
import type {
  InsertSplitAllocation,
  RevenueSplit,
} from "../shared/schema.js";

export interface ComputedAllocation {
  user_id: string;
  allocated_amount: string;
  allocated_percentage: number;
}

/**
 * Compute revenue splits for a project at a given timestamp.
 * Finds the active split rule and calculates allocations.
 */
export async function computeRevenueSplits(
  projectId: string,
  netAmount: number, // Use net_amount from revenue_event
  timestamp: Date = new Date()
): Promise<{
  success: boolean;
  allocations?: ComputedAllocation[];
  splitVersion?: number;
  error?: string;
}> {
  try {
    // Find the active split rule at this timestamp
    const { data: splits, error: splitsError } = await supabase
      .from("revenue_splits")
      .select("*")
      .eq("project_id", projectId)
      .lte("active_from", timestamp.toISOString())
      .order("active_from", { ascending: false })
      .limit(1);

    if (splitsError) throw splitsError;

    if (!splits || splits.length === 0) {
      return {
        success: false,
        error: "No active revenue split rule found for this project",
      };
    }

    const split = splits[0] as RevenueSplit;

    // Validate rule: percentages should sum to ~1.0 (100%)
    const rule = split.rule as Record<string, number>;
    const totalPercentage = Object.values(rule).reduce((a, b) => a + b, 0);

    if (Math.abs(totalPercentage - 1.0) > 0.01) {
      console.warn(
        `Split rule percentages sum to ${totalPercentage}, not 1.0 (project ${projectId})`
      );
      // Don't fail; allow slight rounding differences
    }

    // Allocate amounts
    const allocations: ComputedAllocation[] = Object.entries(rule).map(
      ([userId, percentage]) => {
        const allocatedAmount = netAmount * percentage;
        return {
          user_id: userId,
          allocated_amount: toDecimalString(allocatedAmount),
          allocated_percentage: percentage * 100, // Convert to percentage (0-100)
        };
      }
    );

    return {
      success: true,
      allocations,
      splitVersion: split.split_version,
    };
  } catch (err) {
    console.error("Error computing revenue splits:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Record split allocations as immutable records.
 * Called after a revenue event is recorded and splits are computed.
 */
export async function recordSplitAllocations(
  revenueEventId: string,
  projectId: string,
  allocations: ComputedAllocation[],
  splitVersion: number
): Promise<{
  success: boolean;
  allocated_count?: number;
  error?: string;
}> {
  try {
    const records: InsertSplitAllocation[] = allocations.map((a) => ({
      revenue_event_id: revenueEventId,
      project_id: projectId,
      user_id: a.user_id,
      split_version: splitVersion,
      allocated_amount: a.allocated_amount,
      allocated_percentage: a.allocated_percentage.toString(),
    }));

    const { error } = await supabase.from("split_allocations").insert(records);

    if (error) throw error;

    return { success: true, allocated_count: records.length };
  } catch (err) {
    console.error("Error recording split allocations:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Create or update a revenue split rule for a project.
 * Deactivates the previous rule (sets active_until).
 */
export async function updateRevenueSplit(
  projectId: string,
  rule: Record<string, number>, // e.g., { "user-123": 0.7, "user-456": 0.3 }
  createdBy: string
): Promise<{
  success: boolean;
  splitVersion?: number;
  error?: string;
}> {
  try {
    // Validate rule sums to 1.0
    const totalPercentage = Object.values(rule).reduce((a, b) => a + b, 0);
    if (Math.abs(totalPercentage - 1.0) > 0.01) {
      return {
        success: false,
        error: `Split rule percentages must sum to 1.0 (got ${totalPercentage})`,
      };
    }

    // Find the current highest split_version
    const { data: latest, error: latestError } = await supabase
      .from("revenue_splits")
      .select("split_version")
      .eq("project_id", projectId)
      .order("split_version", { ascending: false })
      .limit(1);

    if (latestError) throw latestError;

    const currentVersion = (latest?.[0]?.split_version as number) || 0;
    const newVersion = currentVersion + 1;

    // Deactivate the previous rule (if any)
    if (currentVersion > 0) {
      const { error: updateError } = await supabase
        .from("revenue_splits")
        .update({ active_until: new Date().toISOString() })
        .eq("project_id", projectId)
        .eq("split_version", currentVersion);

      if (updateError) throw updateError;
    }

    // Insert the new rule
    const { data, error: insertError } = await supabase
      .from("revenue_splits")
      .insert({
        project_id: projectId,
        split_version: newVersion,
        active_from: new Date().toISOString(),
        rule,
        created_by: createdBy,
      })
      .select("split_version");

    if (insertError) throw insertError;

    return { success: true, splitVersion: newVersion };
  } catch (err) {
    console.error("Error updating revenue split:", err);
    return { success: false, error: String(err) };
  }
}
