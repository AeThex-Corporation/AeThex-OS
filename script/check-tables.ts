import { supabase } from "./client/src/lib/supabase";

async function checkTables() {
  try {
    // Check Hub tables
    const hubTables = [
      "messages",
      "marketplace_listings",
      "workspace_settings",
      "files",
      "notifications",
      "user_analytics",
      "code_gallery",
      "documentation",
      "custom_apps",
      "projects",
    ];

    // Check OS kernel tables
    const osTables = [
      "aethex_subjects",
      "aethex_subject_identities",
      "aethex_issuers",
      "aethex_issuer_keys",
      "aethex_entitlements",
      "aethex_entitlement_events",
      "aethex_audit_log",
    ];

    console.log("🔍 Checking Hub tables...");
    for (const table of hubTables) {
      const { error } = await supabase.from(table).select("*").limit(0);
      if (error) {
        console.log(`  ❌ ${table} - NOT CREATED`);
      } else {
        console.log(`  ✅ ${table}`);
      }
    }

    console.log("\n🔍 Checking OS Kernel tables...");
    for (const table of osTables) {
      const { error } = await supabase.from(table).select("*").limit(0);
      if (error) {
        console.log(`  ❌ ${table} - NOT CREATED`);
      } else {
        console.log(`  ✅ ${table}`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

checkTables();
