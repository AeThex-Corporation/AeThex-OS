import { readFileSync } from "fs";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pkg;

async function runModeMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("✅ Connected to database");

    const migrationSQL = readFileSync("./migrations/0003_mode_system.sql", "utf-8");
    const statements = migrationSQL
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`\nExecuting ${statements.length} statements...`);

    for (let i = 0; i < statements.length; i++) {
      try {
        await client.query(statements[i]);
        console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (err: any) {
        if (err.message.includes("already exists")) {
          console.log(`⚠ Statement ${i + 1} skipped (already exists)`);
        } else {
          console.error(`✗ Statement ${i + 1} failed: ${err.message}`);
          throw err;
        }
      }
    }

    console.log("\n✅ Mode system migration completed successfully!");
  } catch (err) {
    console.error("\n❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runModeMigration();
