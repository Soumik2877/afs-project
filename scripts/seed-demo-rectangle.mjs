#!/usr/bin/env node

/**
 * Seeds exactly 5 dustbins in a rectangle + one active demo route.
 * Reads coordinates from .env.local (DEMO_ROUTE_*). See docs/demo-route-setup.md
 *
 * Usage: npm run seed:demo-route
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { readFileSync as readJson } from "node:fs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const explicitPlacements = JSON.parse(
  readJson(resolve(projectRoot, "lib/demo/demo-bin-placements.json"), "utf8"),
);

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

function num(raw, fallback) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const config = {
  centerLat: num(process.env.DEMO_ROUTE_CENTER_LAT, 12.9716),
  centerLng: num(process.env.DEMO_ROUTE_CENTER_LNG, 77.5946),
  latSpan: num(process.env.DEMO_ROUTE_LAT_SPAN, 0.0012),
  lngSpan: num(process.env.DEMO_ROUTE_LNG_SPAN, 0.0018),
  locality: process.env.DEMO_ROUTE_LOCALITY ?? "Kalaikunda",
  labelPrefix: process.env.DEMO_ROUTE_BIN_LABEL_PREFIX ?? "BIN-DEMO",
  routeName: process.env.DEMO_ROUTE_NAME ?? "Kalaikunda",
};

const LEGACY_ROUTE_NAMES = ["Demo Koramangala Loop", "Demo Rectangle Loop", "Koramangala Loop"];
const LEGACY_BIN_PREFIXES = ["BIN-KR-", "BIN-IN-", "BIN-HS-"];

const bins = explicitPlacements.map((row) => ({
  label: `${config.labelPrefix}${row.suffix}`,
  lat: row.latitude,
  lng: row.longitude,
  fill: row.fillLevel,
  status: row.status,
  type: row.binType,
}));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function removeLegacyDemoData() {
  const { data: legacyRoutes } = await supabase
    .from("routes")
    .select("id, name")
    .in("name", [...LEGACY_ROUTE_NAMES, "Demo Rectangle Loop"]);

  const legacyRouteIds = (legacyRoutes ?? [])
    .filter((row) => row.name !== config.routeName)
    .map((row) => row.id);

  if (legacyRouteIds.length) {
    await supabase.from("pickups").delete().in("route_id", legacyRouteIds);
    await supabase.from("driver_locations").delete().in("route_id", legacyRouteIds);
    await supabase.from("routes").delete().in("id", legacyRouteIds);
    console.log(`Removed ${legacyRouteIds.length} legacy route(s)`);
  }

  await supabase.from("routes").update({ status: "completed" }).neq("name", config.routeName);

  for (const prefix of LEGACY_BIN_PREFIXES) {
    const { data: staleBins } = await supabase.from("bins").select("id").like("label", `${prefix}%`);
    const staleIds = (staleBins ?? []).map((row) => row.id);
    if (!staleIds.length) continue;

    await supabase.from("pickups").delete().in("bin_id", staleIds);
    await supabase.from("bin_alerts").delete().in("bin_id", staleIds);
    await supabase.from("bins").delete().in("id", staleIds);
    console.log(`Removed ${staleIds.length} bin(s) with prefix ${prefix}`);
  }
}

async function main() {
  console.log("Demo rectangle config:", config);

  await removeLegacyDemoData();

  const binIds = [];

  for (const bin of bins) {
    const { data: existing } = await supabase.from("bins").select("id").eq("label", bin.label).maybeSingle();

    const row = {
      label: bin.label,
      latitude: bin.lat,
      longitude: bin.lng,
      locality: config.locality,
      fill_level: bin.fill,
      status: bin.status,
      bin_type: bin.type,
      last_updated: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await supabase.from("bins").update(row).eq("id", existing.id);
      if (error) throw new Error(`Update ${bin.label}: ${error.message}`);
      binIds.push(existing.id);
      console.log(`Updated ${bin.label}`);
    } else {
      const { data, error } = await supabase.from("bins").insert(row).select("id").single();
      if (error) throw new Error(`Insert ${bin.label}: ${error.message}`);
      binIds.push(data.id);
      console.log(`Inserted ${bin.label}`);
    }
  }

  const { data: driver } = await supabase
    .from("users")
    .select("id")
    .eq("role", "driver")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!driver?.id) {
    console.error("No driver user found. Create demo_driver1@gmail.com first (supabase/create_demo_users.sql).");
    process.exit(1);
  }

  await supabase
    .from("routes")
    .update({ status: "completed" })
    .eq("assigned_driver_id", driver.id)
    .eq("status", "active")
    .neq("name", config.routeName);

  const today = new Date().toISOString().slice(0, 10);

  let { data: existingRoute } = await supabase
    .from("routes")
    .select("id")
    .eq("name", config.routeName)
    .order("shift_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existingRoute?.id) {
    const { data: renamed } = await supabase
      .from("routes")
      .select("id")
      .eq("name", "Demo Rectangle Loop")
      .order("shift_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    existingRoute = renamed;
  }

  const routeRow = {
    name: config.routeName,
    assigned_driver_id: driver.id,
    vehicle_number: "KA-DEMO-01",
    status: "active",
    bin_ids: binIds,
    shift_date: today,
  };

  let routeId;

  if (existingRoute?.id) {
    const { error } = await supabase.from("routes").update(routeRow).eq("id", existingRoute.id);
    if (error) throw new Error(error.message);
    routeId = existingRoute.id;
    console.log(`Updated route ${config.routeName}`);
  } else {
    const { data, error } = await supabase.from("routes").insert(routeRow).select("id").single();
    if (error) throw new Error(error.message);
    routeId = data.id;
    console.log(`Created route ${config.routeName}`);
  }

  const start = bins[0];
  await supabase.from("driver_locations").upsert(
    {
      driver_id: driver.id,
      route_id: routeId,
      latitude: start.lat,
      longitude: start.lng,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "driver_id" },
  );

  await supabase.from("pickups").delete().eq("route_id", routeId);

  console.log("\nDone. 5 bins, demo route active (loops 01→05 during simulation).");
  console.log("Center:", config.centerLat, config.centerLng);
  console.log("Map: open Admin → Routes or Citizen home with simulation running.");
  console.log("Run: npm run simulate:all");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
