#!/usr/bin/env node

/**
 * Local driver fleet demo loop — pings /api/driver-simulate every 20s.
 * Requires: npm run dev, CRON_SECRET and DRIVER_SIMULATION_ENABLED=true in .env.local
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filename) {
  const filePath = resolve(projectRoot, filename);
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
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

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const baseUrl = process.env.SIMULATE_BASE_URL ?? "http://localhost:3000";
const secret = process.env.CRON_SECRET;
const intervalMs = Number(process.env.DRIVER_SIMULATE_INTERVAL_MS ?? 3_000);

if (!secret) {
  console.error("CRON_SECRET not found. Add it to .env.local, then run npm run simulate:driver again.");
  process.exit(1);
}

if (process.env.DRIVER_SIMULATION_ENABLED !== "true") {
  console.warn(
    "Warning: DRIVER_SIMULATION_ENABLED is not 'true' — /api/driver-simulate will return { skipped: true }.",
  );
}

async function tick() {
  const url = `${baseUrl.replace(/\/$/, "")}/api/driver-simulate`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = await res.json();
    const stamp = new Date().toISOString();
    console.log(`[${stamp}] ${res.status}`, JSON.stringify(body));
  } catch (err) {
    console.error(`[${new Date().toISOString()}] request failed:`, err.message);
  }
}

console.log(`Driver simulate loop → ${baseUrl}/api/driver-simulate every ${intervalMs}ms`);
void tick();
setInterval(tick, intervalMs);
