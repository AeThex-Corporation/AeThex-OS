#!/usr/bin/env tsx
/**
 * Capacitor Production Sync Script
 *
 * Reverts Capacitor configuration from live reload mode back to production mode.
 * This rebuilds the web assets and syncs them to native projects.
 *
 * Usage:
 *   npx tsx script/capacitor-production.ts [--android | --ios]
 *   npm run cap:production
 */

import { execSync } from 'child_process';

function parseArgs(): { platform: 'android' | 'ios' | 'all' } {
  const args = process.argv.slice(2);

  if (args.includes('--android')) return { platform: 'android' };
  if (args.includes('--ios')) return { platform: 'ios' };
  return { platform: 'all' };
}

function run(command: string): void {
  console.log(`\n> ${command}\n`);
  execSync(command, { stdio: 'inherit' });
}

async function main() {
  const { platform } = parseArgs();

  console.log('========================================');
  console.log('  Capacitor Production Build');
  console.log('========================================');
  console.log(`  Platform: ${platform}`);
  console.log('========================================\n');

  // Build production assets
  console.log('Building production assets...');
  run('npm run build');

  // Sync without live reload environment variables
  console.log('\nSyncing Capacitor (production mode)...');
  if (platform === 'all') {
    run('npx cap sync');
  } else {
    run(`npx cap sync ${platform}`);
  }

  console.log('\n========================================');
  console.log('  Production Build Complete!');
  console.log('========================================');
  console.log('\nThe app is now configured to use bundled assets.');
  console.log('Open your IDE to build and run:');
  console.log('  - Android Studio: npm run android');
  console.log('  - Xcode:          npm run ios');
  console.log('========================================\n');
}

main().catch(console.error);
