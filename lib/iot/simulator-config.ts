export function isIotSimulationEnabled() {
  return process.env.IOT_SIMULATION_ENABLED === "true";
}

export function getIotSimulationSeed(): number | undefined {
  const raw = process.env.IOT_SIMULATION_SEED;
  if (raw === undefined || raw === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}
