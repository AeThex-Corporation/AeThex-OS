#!/usr/bin/env tsx
/**
 * Capacitor Live Reload Setup Script
 *
 * This script configures Capacitor for live reload development by:
 * 1. Detecting the local network IP address
 * 2. Setting environment variables for the Capacitor config
 * 3. Running cap sync to update native projects
 *
 * Usage:
 *   npx tsx script/capacitor-live-reload.ts [--port 5000] [--ip 192.168.1.100]
 *   npm run cap:live-reload
 */

import { execSync, spawn } from 'child_process';
import { networkInterfaces } from 'os';

interface Options {
  port: number;
  ip?: string;
  platform?: 'android' | 'ios' | 'all';
}

function getLocalIP(): string {
  const nets = networkInterfaces();
  const results: string[] = [];

  for (const name of Object.keys(nets)) {
    const netList = nets[name];
    if (!netList) continue;

    for (const net of netList) {
      // Skip internal and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address);
      }
    }
  }

  // Prefer common local network ranges
  const preferred = results.find(ip =>
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.')
  );

  return preferred || results[0] || 'localhost';
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    port: 5000,
    platform: 'all'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === '--port' && next) {
      options.port = parseInt(next, 10);
      i++;
    } else if (arg === '--ip' && next) {
      options.ip = next;
      i++;
    } else if (arg === '--android') {
      options.platform = 'android';
    } else if (arg === '--ios') {
      options.platform = 'ios';
    }
  }

  return options;
}

function run(command: string, env?: Record<string, string>): void {
  console.log(`\n> ${command}\n`);
  execSync(command, {
    stdio: 'inherit',
    env: { ...process.env, ...env }
  });
}

async function main() {
  const options = parseArgs();
  const ip = options.ip || getLocalIP();
  const serverUrl = `http://${ip}:${options.port}`;

  console.log('========================================');
  console.log('  Capacitor Live Reload Setup');
  console.log('========================================');
  console.log(`  Server URL: ${serverUrl}`);
  console.log(`  Platform:   ${options.platform}`);
  console.log('========================================\n');

  // Set environment variables for Capacitor config
  const env = {
    CAPACITOR_LIVE_RELOAD: 'true',
    CAPACITOR_SERVER_URL: serverUrl
  };

  // Sync Capacitor with live reload configuration
  console.log('Syncing Capacitor with live reload configuration...');

  if (options.platform === 'all') {
    run('npx cap sync', env);
  } else {
    run(`npx cap sync ${options.platform}`, env);
  }

  console.log('\n========================================');
  console.log('  Live Reload Setup Complete!');
  console.log('========================================');
  console.log('\nNext steps:');
  console.log(`  1. Start the dev server:    npm run dev`);
  console.log(`  2. Open your IDE:`);
  console.log(`     - Android Studio:        npm run android`);
  console.log(`     - Xcode:                 npm run ios`);
  console.log(`  3. Run the app on your device`);
  console.log('\nThe app will connect to your dev server at:');
  console.log(`  ${serverUrl}`);
  console.log('\nMake sure:');
  console.log('  - Your device is on the same network as this machine');
  console.log('  - Firewall allows connections on port ' + options.port);
  console.log('  - The dev server is running before launching the app');
  console.log('========================================\n');
}

main().catch(console.error);
