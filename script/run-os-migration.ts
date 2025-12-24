import { readFileSync } from "fs";
import { join } from "path";
import pkg from "pg";
const { Client } = pkg;

async function runOSMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Read the OS kernel migration file
    const migrationPath = join(process.cwd(), "migrations", "0002_os_kernel.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Split by statement-breakpoint
    const statements = migrationSQL
      .split("--> statement-breakpoint")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`Executing ${statements.length} statements...`);

    for (let i = 0; i < statements.length; i++) {
      try {
        await client.query(statements[i]);
        console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (err: any) {
        // Only fail on actual errors, not "already exists" type errors
        if (
          err.message.includes("already exists") ||
          err.message.includes("UNIQUE constraint failed")
        ) {
          console.log(
            `⚠ Statement ${i + 1}/${statements.length} skipped (${err.message})`
          );
        } else {
          console.error(`✗ Statement ${i + 1} failed: ${err.message}`);
          throw err;
        }
      }
    }

    console.log("\n✅ OS Kernel migration completed successfully!");
  } catch (err) {
    console.error("\n❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runOSMigration();
