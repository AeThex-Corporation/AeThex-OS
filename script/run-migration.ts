import { readFile } from 'fs/promises';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const sql = await readFile('./migrations/0001_new_apps_expansion.sql', 'utf-8');
    
    // Split by statement breakpoints and execute each statement
    const statements = sql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} statements...`);

    for (const [index, statement] of statements.entries()) {
      try {
        await client.query(statement);
        console.log(`✓ Statement ${index + 1}/${statements.length} executed`);
      } catch (error: any) {
        console.error(`✗ Statement ${index + 1} failed:`, error.message);
        // Continue on duplicate errors
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
