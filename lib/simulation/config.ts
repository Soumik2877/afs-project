export function isDriverSimulationEnabled() {
  return process.env.DRIVER_SIMULATION_ENABLED === "true";
}

/** When true, some ticks place drivers far from route bins with stale GPS (anomaly demo). */
export function isDriverAnomalyDemoEnabled() {
  return process.env.DRIVER_SIMULATION_ANOMALY === "true";
}

export function getDriverSimulationStepMeters() {
  const raw = process.env.DRIVER_SIMULATION_STEP_METERS;
  if (!raw) return 55;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 55;
}
