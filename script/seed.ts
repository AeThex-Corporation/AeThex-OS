import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Client } = pkg as any;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    console.log("Seeding default issuer if missing...");
    const name = "AeThex Platform";

    const existing = await client.query(
      'SELECT id FROM public.aethex_issuers WHERE name = $1 LIMIT 1;',
      [name]
    );

    if (existing.rows.length) {
      console.log(`Issuer exists: ${existing.rows[0].id}`);
    } else {
      const insert = await client.query(
        'INSERT INTO public.aethex_issuers (name, issuer_class, scopes, public_key, is_active) VALUES ($1, $2, $3::json, $4, $5) RETURNING id;',
        [name, 'platform', JSON.stringify(["issue","revoke"]), 'PUBLIC_KEY_STRING', true]
      );
      console.log(`Issuer created: ${insert.rows[0].id}`);
    }

    console.log("Done.");
  } catch (err: any) {
    console.error("Seed failed:", err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
