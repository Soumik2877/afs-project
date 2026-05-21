import type { BinStatus } from "@/types";

export interface BinTelemetryRow {
  id: string;
  fill_level: number;
  status: BinStatus;
}

/** Mulberry32 PRNG for reproducible demos when seed is set. */
function createRng(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickInt(rng: () => number, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

function weightedDelta(rng: () => number) {
  const roll = rng();
  if (roll < 0.08) {
    return -pickInt(rng, 1, 3);
  }
  if (roll < 0.55) {
    return pickInt(rng, 2, 4);
  }
  return pickInt(rng, 1, 6);
}

export function nextSimulatedFillLevel(bin: BinTelemetryRow, rng: () => number): number {
  if (bin.status === "collected" && bin.fill_level === 0) {
    if (rng() < 0.15) {
      return pickInt(rng, 5, 15);
    }
    return 0;
  }

  const delta = weightedDelta(rng);
  return Math.max(0, Math.min(100, bin.fill_level + delta));
}

export function shouldIncludeBin(bin: BinTelemetryRow, rng: () => number, totalBins: number) {
  if (totalBins <= 20) return true;
  return rng() < 0.75;
}

export function createSimulationRng(seed?: number) {
  if (seed !== undefined) {
    return createRng(seed);
  }
  return Math.random;
}
