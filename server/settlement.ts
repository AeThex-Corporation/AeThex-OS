import { supabase } from "./supabase";
import { toDecimalString } from "./revenue";
import {
  InsertPayoutRequest,
  InsertPayout,
  InsertPayoutMethod,
} from "../shared/schema";

interface PayoutRequestResult {
  success: boolean;
  request_id?: string;
  error?: string;
}

interface PayoutResult {
  success: boolean;
  payout_id?: string;
  error?: string;
}

interface EscrowResult {
  success: boolean;
  balance?: string;
  held?: string;
  released?: string;
  error?: string;
}

/**
 * Get user's escrow balance for a specific project
 */
export async function getEscrowBalance(
  userId: string,
  projectId: string
): Promise<EscrowResult> {
  try {
    const { data, error } = await supabase
      .from("escrow_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        error: `Failed to fetch escrow balance: ${error.message}`,
      };
    }

    if (!data) {
      return {
        success: true,
        balance: "0.00",
        held: "0.00",
        released: "0.00",
      };
    }

    return {
      success: true,
      balance: data.balance,
      held: data.held_amount,
      released: data.released_amount,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

/**
 * Add allocated revenue to user's escrow account
 * Called after split allocations are recorded
 */
export async function depositToEscrow(
  userId: string,
  projectId: string,
  amount: string // Pre-formatted with toDecimalString
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if escrow account exists
    const { data: existing, error: checkError } = await supabase
      .from("escrow_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (checkError) {
      return {
        success: false,
        error: `Failed to check escrow: ${checkError.message}`,
      };
    }

    if (existing) {
      // Update balance
      const currentBalance = parseFloat(existing.balance);
      const depositAmount = parseFloat(amount);
      const newBalance = currentBalance + depositAmount;

      const { error: updateError } = await supabase
        .from("escrow_accounts")
        .update({
          balance: toDecimalString(newBalance),
          last_updated: new Date(),
        })
        .eq("id", existing.id);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update escrow: ${updateError.message}`,
        };
      }
    } else {
      // Create new escrow account
      const { error: insertError } = await supabase
        .from("escrow_accounts")
        .insert({
          user_id: userId,
          project_id: projectId,
          balance: amount,
          held_amount: "0.00",
          released_amount: "0.00",
        });

      if (insertError) {
        return {
          success: false,
          error: `Failed to create escrow: ${insertError.message}`,
        };
      }
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

/**
 * Create a payout request (user initiates)
 */
export async function createPayoutRequest(
  input: {
    user_id: string;
    escrow_account_id: string;
    request_amount: string;
    reason?: string;
  }
): Promise<PayoutRequestResult> {
  try {
    // Verify escrow account exists and belongs to user
    const { data: escrow, error: escrowError } = await supabase
      .from("escrow_accounts")
      .select("*")
      .eq("id", input.escrow_account_id)
      .eq("user_id", input.user_id)
      .maybeSingle();

    if (escrowError) {
      return {
        success: false,
        error: `Failed to verify escrow: ${escrowError.message}`,
      };
    }

    if (!escrow) {
      return {
        success: false,
        error: "Escrow account not found or does not belong to you",
      };
    }

    // Verify sufficient balance
    const escrowBalance = parseFloat(escrow.balance);
    const requestAmount = parseFloat(input.request_amount);

    if (requestAmount > escrowBalance) {
      return {
        success: false,
        error: `Insufficient balance. Available: $${escrowBalance.toFixed(2)}, Requested: $${requestAmount.toFixed(2)}`,
      };
    }

    if (requestAmount <= 0) {
      return {
        success: false,
        error: "Request amount must be greater than 0",
      };
    }

    // Create payout request with 30-day expiration
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("payout_requests")
      .insert({
        user_id: input.user_id,
        escrow_account_id: input.escrow_account_id,
        request_amount: input.request_amount,
        reason: input.reason,
        expires_at: expiresAt,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to create payout request: ${error.message}`,
      };
    }

    return {
      success: true,
      request_id: data.id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

/**
 * Approve or reject a payout request (admin)
 */
export async function reviewPayoutRequest(
  requestId: string,
  approved: boolean,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const newStatus = approved ? "approved" : "rejected";

    const { error } = await supabase
      .from("payout_requests")
      .update({
        status: newStatus,
        notes,
      })
      .eq("id", requestId);

    if (error) {
      return {
        success: false,
        error: `Failed to update payout request: ${error.message}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

/**
 * Register or update a payout method for a user
 */
export async function registerPayoutMethod(
  input: {
    user_id: string;
    method_type: "stripe_connect" | "paypal" | "bank_transfer" | "crypto";
    metadata: Record<string, any>;
    is_primary?: boolean;
  }
): Promise<{ success: boolean; method_id?: string; error?: string }> {
  try {
    if (!input.metadata || Object.keys(input.metadata).length === 0) {
      return {
        success: false,
        error: "Metadata required for payout method",
      };
    }

    const { data, error } = await supabase
      .from("payout_methods")
      .insert({
        user_id: input.user_id,
        method_type: input.method_type,
        metadata: input.metadata,
        is_primary: input.is_primary || false,
        verified: false,
      })
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to register payout method: ${error.message}`,
      };
    }

    return {
      success: true,
      method_id: data.id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

/**
 * Process a payout (admin/system action)
 * Creates payout record and updates escrow
 */
export async function processPayout(
  input: {
    payout_request_id?: string;
    user_id: string;
    escrow_account_id: string;
    payout_method_id: string;
    amount: string;
  }
): Promise<PayoutResult> {
  try {
    // Verify payout method exists
    const { data: method, error: methodError } = await supabase
      .from("payout_methods")
      .select("*")
      .eq("id", input.payout_method_id)
      .eq("user_id", input.user_id)
      .maybeSingle();

    if (methodError) {
      return {
        success: false,
        error: `Failed to verify payout method: ${methodError.message}`,
      };
    }

    if (!method) {
      return {
        success: false,
        error: "Payout method not found or does not belong to you",
      };
    }

    // Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .insert({
        payout_request_id: input.payout_request_id,
        user_id: input.user_id,
        escrow_account_id: input.escrow_account_id,
        payout_method_id: input.payout_method_id,
        amount: input.amount,
        currency: "USD",
        status: "processing",
      })
      .select("id")
      .single();

    if (payoutError) {
      return {
        success: false,
        error: `Failed to create payout: ${payoutError.message}`,
      };
    }

    // Update escrow: move from balance to held_amount
    const { data: escrow, error: escrowCheckError } = await supabase
      .from("escrow_accounts")
      .select("*")
      .eq("id", input.escrow_account_id)
      .maybeSingle();

    if (escrowCheckError) {
      return {
        success: false,
        error: `Failed to verify escrow: ${escrowCheckError.message}`,
      };
    }

    if (!escrow) {
      return {
        success: false,
        error: "Escrow account not found",
      };
    }

    const currentBalance = parseFloat(escrow.balance);
    const payoutAmount = parseFloat(input.amount);
    const newBalance = currentBalance - payoutAmount;
    const newHeld = parseFloat(escrow.held_amount) + payoutAmount;

    if (newBalance < 0) {
      return {
        success: false,
        error: "Insufficient escrow balance",
      };
    }

    const { error: updateError } = await supabase
      .from("escrow_accounts")
      .update({
        balance: toDecimalString(newBalance),
        held_amount: toDecimalString(newHeld),
        last_updated: new Date(),
      })
      .eq("id", input.escrow_account_id);

    if (updateError) {
      return {
        success: false,
        error: `Failed to update escrow: ${updateError.message}`,
      };
    }

    return {
      success: true,
      payout_id: payout.id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

/**
 * Mark payout as completed (after external payment confirms)
 */
export async function completePayout(
  payoutId: string,
  externalTransactionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch payout to update escrow
    const { data: payout, error: fetchError } = await supabase
      .from("payouts")
      .select("*")
      .eq("id", payoutId)
      .maybeSingle();

    if (fetchError) {
      return {
        success: false,
        error: `Failed to fetch payout: ${fetchError.message}`,
      };
    }

    if (!payout) {
      return {
        success: false,
        error: "Payout not found",
      };
    }

    // Update payout status
    const { error: updatePayoutError } = await supabase
      .from("payouts")
      .update({
        status: "completed",
        external_transaction_id: externalTransactionId,
        completed_at: new Date(),
        processed_at: new Date(),
      })
      .eq("id", payoutId);

    if (updatePayoutError) {
      return {
        success: false,
        error: `Failed to update payout: ${updatePayoutError.message}`,
      };
    }

    // Update escrow: move from held to released
    const { data: escrow, error: escrowError } = await supabase
      .from("escrow_accounts")
      .select("*")
      .eq("id", payout.escrow_account_id)
      .maybeSingle();

    if (escrowError) {
      return {
        success: false,
        error: `Failed to fetch escrow: ${escrowError.message}`,
      };
    }

    if (!escrow) {
      return {
        success: false,
        error: "Escrow account not found",
      };
    }

    const payoutAmount = parseFloat(payout.amount);
    const newHeld = parseFloat(escrow.held_amount) - payoutAmount;
    const newReleased = parseFloat(escrow.released_amount) + payoutAmount;

    const { error: updateEscrowError } = await supabase
      .from("escrow_accounts")
      .update({
        held_amount: toDecimalString(newHeld),
        released_amount: toDecimalString(newReleased),
        last_updated: new Date(),
      })
      .eq("id", payout.escrow_account_id);

    if (updateEscrowError) {
      return {
        success: false,
        error: `Failed to update escrow: ${updateEscrowError.message}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

/**
 * Mark payout as failed
 */
export async function failPayout(
  payoutId: string,
  failureReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch payout to restore escrow
    const { data: payout, error: fetchError } = await supabase
      .from("payouts")
      .select("*")
      .eq("id", payoutId)
      .maybeSingle();

    if (fetchError) {
      return {
        success: false,
        error: `Failed to fetch payout: ${fetchError.message}`,
      };
    }

    if (!payout) {
      return {
        success: false,
        error: "Payout not found",
      };
    }

    // Update payout status
    const { error: updatePayoutError } = await supabase
      .from("payouts")
      .update({
        status: "failed",
        failure_reason: failureReason,
        processed_at: new Date(),
      })
      .eq("id", payoutId);

    if (updatePayoutError) {
      return {
        success: false,
        error: `Failed to update payout: ${updatePayoutError.message}`,
      };
    }

    // Restore balance: move from held back to balance
    const { data: escrow, error: escrowError } = await supabase
      .from("escrow_accounts")
      .select("*")
      .eq("id", payout.escrow_account_id)
      .maybeSingle();

    if (escrowError) {
      return {
        success: false,
        error: `Failed to fetch escrow: ${escrowError.message}`,
      };
    }

    if (!escrow) {
      return {
        success: false,
        error: "Escrow account not found",
      };
    }

    const payoutAmount = parseFloat(payout.amount);
    const newBalance = parseFloat(escrow.balance) + payoutAmount;
    const newHeld = parseFloat(escrow.held_amount) - payoutAmount;

    const { error: updateEscrowError } = await supabase
      .from("escrow_accounts")
      .update({
        balance: toDecimalString(newBalance),
        held_amount: toDecimalString(newHeld),
        last_updated: new Date(),
      })
      .eq("id", payout.escrow_account_id);

    if (updateEscrowError) {
      return {
        success: false,
        error: `Failed to update escrow: ${updateEscrowError.message}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

/**
 * Get user's payout history
 */
export async function getPayoutHistory(userId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from("payouts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return {
        success: false,
        error: `Failed to fetch payouts: ${error.message}`,
      };
    }

    return {
      success: true,
      payouts: data || [],
      count: data?.length || 0,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}
