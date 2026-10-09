import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Copy .env.example to .env and add your Neon connection string.");
  process.exit(1);
}

// Neon requires SSL. Set DATABASE_SSL=false only for a local, non-SSL Postgres.
const useSsl = process.env.DATABASE_SSL !== "false";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

// Idle clients can be dropped by Neon (scale-to-zero); don't crash the process.
pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS participants (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(120) NOT NULL,
      amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}
