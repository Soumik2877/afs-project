#!/usr/bin/env node

/**
 * Runs IoT + driver simulation loops together for full demo mode.
 */

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const children = [
  spawn("node", ["scripts/iot-simulate-loop.mjs"], { cwd: projectRoot, stdio: "inherit" }),
  spawn("node", ["scripts/driver-simulate-loop.mjs"], { cwd: projectRoot, stdio: "inherit" }),
];

function shutdown() {
  for (const child of children) {
    child.kill("SIGTERM");
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("Demo simulate: IoT fill levels + driver fleet movement (Ctrl+C to stop)");
