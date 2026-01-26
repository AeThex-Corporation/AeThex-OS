import { supabase } from "./supabase";
import {
  InsertSplitProposal,
  InsertSplitVote,
  SplitProposal,
  SplitVote,
} from "../shared/schema";
import { updateRevenueSplit } from "./splits";

interface ProposalResult {
  success: boolean;
  proposal_id?: string;
  error?: string;
}

interface VoteResult {
  success: boolean;
  vote_id?: string;
  error?: string;
}

interface VoteOutcomeResult {
  success: boolean;
  approved: boolean;
  total_votes?: number;
  approve_count?: number;
  reject_count?: number;
  message?: string;
  error?: string;
}

/**
 * Create a proposal to change the revenue split rule for a project
 * Only current collaborators can propose splits
 */
export async function createSplitProposal(
  input: {
    project_id: string;
    proposed_by: string;
    proposed_rule: Record<string, number>;
    voting_rule: "unanimous" | "majority";
    description?: string;
    expires_at?: Date;
  }
): Promise<ProposalResult> {
  try {
    // Validate percentages sum to 1.0
    const sum = Object.values(input.proposed_rule).reduce(
      (acc, val) => acc + val,
      0
    );
    if (Math.abs(sum - 1.0) > 0.001) {
      return {
        success: false,
        error: `Percentages must sum to 1.0, got ${sum.toFixed(4)}`,
      };
    }

    // Check that proposer is a collaborator on the project
    const { data: collaborator, error: collabError } = await supabase
      .from("project_collaborators")
      .select("*")
      .eq("project_id", input.project_id)
      .eq("user_id", input.proposed_by)
      .maybeSingle();

    if (collabError) {
      return {
        success: false,
        error: `Failed to check collaborator status: ${collabError.message}`,
      };
    }

    if (!collaborator) {
      return {
        success: false,
        error: "Only project collaborators can propose split changes",
      };
    }

    const expiresAt = input.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { data, error } = await supabase
      .from("split_proposals")
      .insert({
        project_id: input.project_id,
        proposed_by: input.proposed_by,
        proposed_rule: input.proposed_rule,
        voting_rule: input.voting_rule,
        description: input.description,
        expires_at: expiresAt,
        proposal_status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to create proposal: ${error.message}`,
      };
    }

    return {
      success: true,
      proposal_id: data.id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

/**
 * Cast a vote on a split proposal
 * Only project collaborators can vote
 */
export async function castVote(
  input: {
    proposal_id: string;
    voter_id: string;
    vote: "approve" | "reject";
    reason?: string;
  }
): Promise<VoteResult> {
  try {
    // Fetch the proposal to verify it exists and get project_id
    const { data: proposal, error: proposalError } = await supabase
      .from("split_proposals")
      .select("*")
      .eq("id", input.proposal_id)
      .maybeSingle();

    if (proposalError) {
      return {
        success: false,
        error: `Failed to fetch proposal: ${proposalError.message}`,
      };
    }

    if (!proposal) {
      return {
        success: false,
        error: "Proposal not found",
      };
    }

    // Check if proposal is still open (not expired)
    if (proposal.expires_at && new Date(proposal.expires_at) < new Date()) {
      return {
        success: false,
        error: "Proposal voting period has expired",
      };
    }

    // Check if voter is a collaborator
    const { data: collaborator, error: collabError } = await supabase
      .from("project_collaborators")
      .select("*")
      .eq("project_id", proposal.project_id)
      .eq("user_id", input.voter_id)
      .maybeSingle();

    if (collabError) {
      return {
        success: false,
        error: `Failed to check voter status: ${collabError.message}`,
      };
    }

    if (!collaborator) {
      return {
        success: false,
        error: "Only project collaborators can vote",
      };
    }

    // Check if voter has already voted
    const { data: existingVote, error: checkError } = await supabase
      .from("split_votes")
      .select("*")
      .eq("proposal_id", input.proposal_id)
      .eq("voter_id", input.voter_id)
      .maybeSingle();

    if (checkError) {
      return {
        success: false,
        error: `Failed to check existing vote: ${checkError.message}`,
      };
    }

    if (existingVote) {
      return {
        success: false,
        error: "You have already voted on this proposal",
      };
    }

    // Insert the vote
    const { data, error } = await supabase
      .from("split_votes")
      .insert({
        proposal_id: input.proposal_id,
        voter_id: input.voter_id,
        vote: input.vote,
        reason: input.reason,
      })
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to record vote: ${error.message}`,
      };
    }

    return {
      success: true,
      vote_id: data.id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

/**
 * Check if a proposal has reached consensus and apply the split if approved
 */
export async function evaluateProposal(
  proposalId: string,
  requester_user_id: string
): Promise<VoteOutcomeResult> {
  try {
    // Fetch proposal
    const { data: proposal, error: proposalError } = await supabase
      .from("split_proposals")
      .select("*")
      .eq("id", proposalId)
      .maybeSingle();

    if (proposalError) {
      return {
        success: false,
        approved: false,
        error: `Failed to fetch proposal: ${proposalError.message}`,
      };
    }

    if (!proposal) {
      return {
        success: false,
        approved: false,
        error: "Proposal not found",
      };
    }

    // If already voted on, return current status
    if (proposal.proposal_status !== "pending") {
      return {
        success: true,
        approved: proposal.proposal_status === "approved",
        message: `Proposal already ${proposal.proposal_status}`,
      };
    }

    // Get all votes
    const { data: votes, error: votesError } = await supabase
      .from("split_votes")
      .select("*")
      .eq("proposal_id", proposalId);

    if (votesError) {
      return {
        success: false,
        approved: false,
        error: `Failed to fetch votes: ${votesError.message}`,
      };
    }

    // Get all collaborators (eligible voters)
    const { data: collaborators, error: collabError } = await supabase
      .from("project_collaborators")
      .select("*")
      .eq("project_id", proposal.project_id);

    if (collabError) {
      return {
        success: false,
        approved: false,
        error: `Failed to fetch collaborators: ${collabError.message}`,
      };
    }

    const totalEligible = collaborators?.length || 1;
    const approveCount = votes?.filter((v: any) => v.vote === "approve").length || 0;
    const rejectCount = votes?.filter((v: any) => v.vote === "reject").length || 0;
    const totalVotes = approveCount + rejectCount;

    // Determine if proposal is approved based on voting rule
    let approved = false;

    if (proposal.voting_rule === "unanimous") {
      // All eligible voters must approve, OR all votes cast must be approve
      approved = totalVotes > 0 && rejectCount === 0 && approveCount === totalEligible;
    } else {
      // Majority: > 50% of eligible voters approve
      approved = approveCount > totalEligible / 2;
    }

    // Update proposal status
    const newStatus = approved ? "approved" : "rejected";
    const { error: updateError } = await supabase
      .from("split_proposals")
      .update({ proposal_status: newStatus })
      .eq("id", proposalId);

    if (updateError) {
      return {
        success: false,
        approved: false,
        error: `Failed to update proposal status: ${updateError.message}`,
      };
    }

    // If approved, apply the split
    if (approved) {
      // Get the current split version
      const { data: currentSplit, error: splitError } = await supabase
        .from("revenue_splits")
        .select("split_version")
        .eq("project_id", proposal.project_id)
        .is("active_until", null)
        .maybeSingle();

      if (splitError) {
        return {
          success: true,
          approved: true,
          total_votes: totalVotes,
          approve_count: approveCount,
          reject_count: rejectCount,
          message: "Proposal approved but failed to apply split (no previous version)",
        };
      }

      const nextVersion = (currentSplit?.split_version || 0) + 1;

      // Apply the new split rule
      const splitResult = await updateRevenueSplit(
        proposal.project_id,
        {
          split_version: nextVersion,
          rule: proposal.proposed_rule,
          created_by: requester_user_id,
        },
        requester_user_id
      );

      if (!splitResult.success) {
        return {
          success: true,
          approved: true,
          total_votes: totalVotes,
          approve_count: approveCount,
          reject_count: rejectCount,
          message: `Proposal approved but failed to apply split: ${splitResult.error}`,
        };
      }
    }

    return {
      success: true,
      approved,
      total_votes: totalVotes,
      approve_count: approveCount,
      reject_count: rejectCount,
      message: approved
        ? `Proposal approved! Applied new split rule version ${(currentSplit?.split_version || 0) + 1}`
        : `Proposal rejected. Approvals: ${approveCount}, Rejections: ${rejectCount}, Required: ${proposal.voting_rule === "unanimous" ? totalEligible : Math.ceil(totalEligible / 2)}`,
    };
  } catch (err: any) {
    return {
      success: false,
      approved: false,
      error: `Unexpected error: ${err.message}`,
    };
  }
}

/**
 * Get proposal details with vote counts
 */
export async function getProposalWithVotes(proposalId: string) {
  try {
    const { data: proposal, error: proposalError } = await supabase
      .from("split_proposals")
      .select("*")
      .eq("id", proposalId)
      .maybeSingle();

    if (proposalError) {
      return { success: false, error: proposalError.message };
    }

    if (!proposal) {
      return { success: false, error: "Proposal not found" };
    }

    const { data: votes, error: votesError } = await supabase
      .from("split_votes")
      .select("*")
      .eq("proposal_id", proposalId);

    if (votesError) {
      return { success: false, error: votesError.message };
    }

    const { data: collaborators } = await supabase
      .from("project_collaborators")
      .select("*")
      .eq("project_id", proposal.project_id);

    const approveCount = votes?.filter((v: any) => v.vote === "approve").length || 0;
    const rejectCount = votes?.filter((v: any) => v.vote === "reject").length || 0;
    const totalEligible = collaborators?.length || 0;

    return {
      success: true,
      proposal,
      votes,
      stats: {
        approve_count: approveCount,
        reject_count: rejectCount,
        total_votes: approveCount + rejectCount,
        total_eligible: totalEligible,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
