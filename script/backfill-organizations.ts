import dotenv from "dotenv";
dotenv.config({ path: './.env' });

import { supabase } from "../server/supabase.js";

/**
 * Backfill Script: Create default organizations for existing users
 * 
 * This script:
 * 1. Creates a default organization for each existing user profile
 * 2. Adds the user as organization owner
 * 3. Backfills organization_id for user-owned entities
 */

async function generateSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Check if slug exists
  const { data: existing } = await supabase
    .from('organizations')
    .select('slug')
    .eq('slug', baseSlug)
    .single();
  
  if (!existing) return baseSlug;
  
  // Add random suffix if collision
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${suffix}`;
}

async function backfillOrganizations() {
  console.log('Starting organization backfill...\n');
  
  try {
    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, full_name, email');
    
    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }
    
    console.log(`Found ${profiles?.length || 0} user profiles\n`);
    
    for (const profile of profiles || []) {
      const displayName = profile.full_name || profile.username || profile.email?.split('@')[0] || 'User';
      const orgName = `${displayName}'s Workspace`;
      const slug = await generateSlug(displayName);
      
      console.log(`Creating organization for user ${profile.id} (${displayName})...`);
      
      // Check if org already exists for this user
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_user_id', profile.id)
        .single();
      
      let orgId: string;
      
      if (existingOrg) {
        console.log(`  ✓ Organization already exists: ${existingOrg.id}`);
        orgId = existingOrg.id;
      } else {
        // Create organization
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: orgName,
            slug: slug,
            owner_user_id: profile.id,
            plan: 'free',
          })
          .select()
          .single();
        
        if (orgError) {
          console.error(`  ✗ Failed to create org: ${orgError.message}`);
          continue;
        }
        
        orgId = newOrg!.id;
        console.log(`  ✓ Created organization: ${orgId} (${orgName})`);
        
        // Add user as organization member with 'owner' role
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: orgId,
            user_id: profile.id,
            role: 'owner',
          });
        
        if (memberError) {
          console.error(`  ✗ Failed to add member: ${memberError.message}`);
          continue;
        }
        
        console.log(`  ✓ Added user as owner`);
      }
      
      // Backfill organization_id for user's entities
      await backfillUserEntities(profile.id, orgId);
      
      console.log('');
    }
    
    console.log('\n✅ Backfill complete!');
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  }
}

async function backfillUserEntities(userId: string, orgId: string) {
  const tables = [
    { name: 'projects', ownerField: 'owner_user_id' },
    { name: 'aethex_projects', ownerField: 'creator_id' },
    { name: 'marketplace_listings', ownerField: 'seller_id' },
    { name: 'files', ownerField: 'user_id' },
    { name: 'custom_apps', ownerField: 'creator_id' },
    { name: 'aethex_sites', ownerField: 'owner_id' },
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .update({ organization_id: orgId })
        .eq(table.ownerField, userId)
        .is('organization_id', null)
        .select('id');
      
      if (error) {
        console.error(`  ✗ Failed to backfill ${table.name}: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`  ✓ Backfilled ${data.length} ${table.name} records`);
      }
    } catch (err) {
      console.error(`  ✗ Error backfilling ${table.name}:`, err);
    }
  }
}

// Run the script
backfillOrganizations();

