import { Router } from "express";
import { supabase } from "@/lib/supabase";

const router = Router();

/**
 * POST /api/os/link/start
 * Begin identity linking flow
 */
router.post("/link/start", async (req, res) => {
  try {
    const { provider } = req.body;
    const userId = req.headers["x-user-id"] as string;

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

/**
 * POST /api/os/link/complete
 * Complete identity linking
 */
router.post("/link/complete", async (req, res) => {
  try {
    const { provider, external_id, external_username } = req.body;
    const userId = req.headers["x-user-id"] as string;

    if (!provider || !external_id || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create or update subject identity
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

    // Log audit event
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

/**
 * POST /api/os/link/unlink
 * Remove identity link
 */
router.post("/link/unlink", async (req, res) => {
  try {
    const { provider, external_id } = req.body;
    const userId = req.headers["x-user-id"] as string;

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

/**
 * POST /api/os/entitlements/issue
 * Issue new entitlement (authorized issuers only)
 */
router.post("/entitlements/issue", async (req, res) => {
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

/**
 * POST /api/os/entitlements/verify
 * Verify entitlement authenticity
 */
router.post("/entitlements/verify", async (req, res) => {
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

    // Log verification event
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

/**
 * GET /api/os/entitlements/resolve
 * Resolve entitlements by platform identity
 */
router.get("/entitlements/resolve", async (req, res) => {
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

/**
 * POST /api/os/entitlements/revoke
 * Revoke entitlement
 */
router.post("/entitlements/revoke", async (req, res) => {
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

/**
 * GET /api/os/issuers/:id
 * Get issuer metadata
 */
router.get("/issuers/:id", async (req, res) => {
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

export default router;
