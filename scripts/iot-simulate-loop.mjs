#!/usr/bin/env node

/**
 * Local IoT demo loop — pings /api/iot-simulate every 30s.
 * Requires: npm run dev, CRON_SECRET and IOT_SIMULATION_ENABLED=true in .env.local
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
const intervalMs = Number(process.env.SIMULATE_INTERVAL_MS ?? 30_000);

if (!secret) {
  console.error(
    "CRON_SECRET not found. Add it to .env.local in the project root, then run npm run simulate:iot again.",
  );
  process.exit(1);
}

if (process.env.IOT_SIMULATION_ENABLED !== "true") {
  console.warn(
    "Warning: IOT_SIMULATION_ENABLED is not 'true' in .env.local — /api/iot-simulate will return { skipped: true }.",
  );
}

async function tick() {
  const url = `${baseUrl.replace(/\/$/, "")}/api/iot-simulate`;
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

console.log(`IoT simulate loop → ${baseUrl}/api/iot-simulate every ${intervalMs}ms`);
void tick();
setInterval(tick, intervalMs);
