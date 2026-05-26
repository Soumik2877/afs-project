#!/usr/bin/env node

/**
 * Applies supabase/migrations/000002_citizen_pickup_requests.sql to your Supabase database.
 *
 * Requires DATABASE_URL in .env.local (Supabase → Project Settings → Database → URI).
 * Example:
 *   DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
 *
 * Usage: npm run db:migrate:citizen-pickup
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filename) {
  const filePath = resolve(projectRoot, filename);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const password = process.env.SUPABASE_DB_PASSWORD;
  const ref = process.env.SUPABASE_PROJECT_REF ?? "jftnsajundlxavynmsvi";
  if (!password) return null;

  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;
}

const databaseUrl = resolveDatabaseUrl();

if (!databaseUrl) {
  console.error(
    [
      "Missing DATABASE_URL (or SUPABASE_DB_PASSWORD) in .env.local.",
      "",
      "Add your Supabase database URI from:",
      "  Dashboard → Project Settings → Database → Connection string → URI",
      "",
      "Then run: npm run db:migrate:citizen-pickup",
      "",
      "Or paste this file in the SQL Editor:",
      "  supabase/migrations/000002_citizen_pickup_requests.sql",
    ].join("\n"),
  );
  process.exit(1);
}

const sqlPath = resolve(projectRoot, "supabase/migrations/000002_citizen_pickup_requests.sql");
const sql = readFileSync(sqlPath, "utf8");

const { default: pg } = await import("pg");

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Applied citizen_pickup_requests migration successfully.");
} catch (err) {
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
