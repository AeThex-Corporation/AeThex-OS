import { supabase } from "./supabase";

interface EarningsResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Get all earnings for a user across all projects
 */
export async function getUserEarnings(userId: string): Promise<EarningsResult> {
  try {
    // Get all split allocations for this user
    const { data: allocations, error: allocError } = await supabase
      .from("split_allocations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (allocError) {
      return {
        success: false,
        error: `Failed to fetch allocations: ${allocError.message}`,
      };
    }

    // Group by project and sum amounts
    const earningsByProject: Record<string, any> = {};
    let totalEarned = 0;

    (allocations || []).forEach((alloc: any) => {
      const projectId = alloc.project_id;
      const amount = parseFloat(alloc.allocated_amount);
      totalEarned += amount;

      if (!earningsByProject[projectId]) {
        earningsByProject[projectId] = {
          project_id: projectId,
          total_earned: 0,
          allocation_count: 0,
          recent_allocations: [],
        };
      }

      earningsByProject[projectId].total_earned += amount;
      earningsByProject[projectId].allocation_count += 1;

      // Keep last 5 allocations per project
      if (
        earningsByProject[projectId].recent_allocations.length < 5
      ) {
        earningsByProject[projectId].recent_allocations.push({
          amount: alloc.allocated_amount,
          percentage: alloc.allocated_percentage,
          revenue_event_id: alloc.revenue_event_id,
          created_at: alloc.created_at,
        });
      }
    });

    // Get escrow balances for each project
    const projectIds = Object.keys(earningsByProject);
    const { data: escrowAccounts, error: escrowError } = await supabase
      .from("escrow_accounts")
      .select("*")
      .eq("user_id", userId);

    if (escrowError) {
      console.error("Escrow fetch error:", escrowError);
    }

    // Attach escrow data to projects
    (escrowAccounts || []).forEach((escrow: any) => {
      if (earningsByProject[escrow.project_id]) {
        earningsByProject[escrow.project_id].escrow_balance =
          escrow.balance;
        earningsByProject[escrow.project_id].escrow_held = escrow.held_amount;
        earningsByProject[escrow.project_id].escrow_released =
          escrow.released_amount;
      }
    });

    const projects = Object.values(earningsByProject).sort(
      (a: any, b: any) => b.total_earned - a.total_earned
    );

    return {
      success: true,
      data: {
        user_id: userId,
        total_earned_all_projects: totalEarned.toFixed(2),
        projects_count: projects.length,
        projects,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

/**
 * Get earnings for a user on a specific project
 */
export async function getProjectEarnings(
  userId: string,
  projectId: string
): Promise<EarningsResult> {
  try {
    // Get all allocations for this user on this project
    const { data: allocations, error: allocError } = await supabase
      .from("split_allocations")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (allocError) {
      return {
        success: false,
        error: `Failed to fetch allocations: ${allocError.message}`,
      };
    }

    let totalEarned = 0;
    const allocations_list = (allocations || []).map((alloc: any) => {
      const amount = parseFloat(alloc.allocated_amount);
      totalEarned += amount;
      return {
        amount: alloc.allocated_amount,
        percentage: alloc.allocated_percentage,
        revenue_event_id: alloc.revenue_event_id,
        split_version: alloc.split_version,
        created_at: alloc.created_at,
      };
    });

    // Get escrow balance for this project
    const { data: escrow, error: escrowError } = await supabase
      .from("escrow_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (escrowError) {
      console.error("Escrow fetch error:", escrowError);
    }

    // Get current split rule to show latest allocation percentage
    const { data: currentSplit } = await supabase
      .from("revenue_splits")
      .select("rule")
      .eq("project_id", projectId)
      .is("active_until", null)
      .maybeSingle();

    const userAllocationPercent = currentSplit?.rule?.[userId] || 0;

    return {
      success: true,
      data: {
        user_id: userId,
        project_id: projectId,
        total_earned: totalEarned.toFixed(2),
        allocation_count: allocations_list.length,
        current_allocation_percent: (userAllocationPercent * 100).toFixed(2),
        escrow_balance: escrow?.balance || "0.00",
        escrow_held: escrow?.held_amount || "0.00",
        escrow_released: escrow?.released_amount || "0.00",
        recent_allocations: allocations_list.slice(0, 10),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

/**
 * Get summary statistics for a user's earnings
 */
export async function getEarningsSummary(userId: string): Promise<EarningsResult> {
  try {
    // Total earned across all projects
    const { data: allocations, error: allocError } = await supabase
      .from("split_allocations")
      .select("allocated_amount")
      .eq("user_id", userId);

    if (allocError) {
      return {
        success: false,
        error: `Failed to fetch allocations: ${allocError.message}`,
      };
    }

    const totalEarned = (allocations || []).reduce(
      (sum: number, alloc: any) => sum + parseFloat(alloc.allocated_amount),
      0
    );

    // Total in escrow (across all projects)
    const { data: escrowAccounts, error: escrowError } = await supabase
      .from("escrow_accounts")
      .select("balance, held_amount, released_amount")
      .eq("user_id", userId);

    if (escrowError) {
      console.error("Escrow fetch error:", escrowError);
    }

    const totalEscrowBalance = (escrowAccounts || []).reduce(
      (sum: number, escrow: any) => sum + parseFloat(escrow.balance),
      0
    );

    const totalHeld = (escrowAccounts || []).reduce(
      (sum: number, escrow: any) => sum + parseFloat(escrow.held_amount),
      0
    );

    const totalReleased = (escrowAccounts || []).reduce(
      (sum: number, escrow: any) => sum + parseFloat(escrow.released_amount),
      0
    );

    // Count of projects user has earned from
    const { data: projects, error: projectsError } = await supabase
      .from("split_allocations")
      .select("project_id")
      .eq("user_id", userId)
      .distinct();

    if (projectsError) {
      console.error("Projects fetch error:", projectsError);
    }

    return {
      success: true,
      data: {
        user_id: userId,
        total_earned: totalEarned.toFixed(2),
        total_in_escrow: totalEscrowBalance.toFixed(2),
        total_held_pending: totalHeld.toFixed(2),
        total_paid_out: totalReleased.toFixed(2),
        projects_earned_from: projects?.length || 0,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

/**
 * Get leaderboard - top earners on a project
 */
export async function getProjectLeaderboard(
  projectId: string,
  limit = 20
): Promise<EarningsResult> {
  try {
    // Get allocations grouped by user
    const { data: allocations, error } = await supabase
      .from("split_allocations")
      .select("user_id, allocated_amount")
      .eq("project_id", projectId);

    if (error) {
      return {
        success: false,
        error: `Failed to fetch allocations: ${error.message}`,
      };
    }

    const earnerMap: Record<string, number> = {};

    (allocations || []).forEach((alloc: any) => {
      if (!earnerMap[alloc.user_id]) {
        earnerMap[alloc.user_id] = 0;
      }
      earnerMap[alloc.user_id] += parseFloat(alloc.allocated_amount);
    });

    const leaderboard = Object.entries(earnerMap)
      .map(([userId, totalEarned]) => ({
        rank: 0, // Will be set below
        user_id: userId,
        total_earned: totalEarned.toFixed(2),
      }))
      .sort((a, b) => parseFloat(b.total_earned) - parseFloat(a.total_earned))
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return {
      success: true,
      data: {
        project_id: projectId,
        leaderboard,
        count: leaderboard.length,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}
