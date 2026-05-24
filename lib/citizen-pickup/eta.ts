import { haversineMeters } from "@/lib/utils/geo";
import { getDriverSimulationStepMeters } from "@/lib/simulation/config";

export function getSimulatedTruckSpeedMps() {
  const stepMeters = getDriverSimulationStepMeters();
  const intervalMs = Number(process.env.DRIVER_SIMULATE_INTERVAL_MS ?? process.env.NEXT_PUBLIC_DRIVER_ANIMATION_MS ?? 3000);
  const intervalSec = Math.max(intervalMs / 1000, 1);
  return stepMeters / intervalSec;
}

export function distanceToPickupMeters(
  truck: { latitude: number; longitude: number } | null | undefined,
  pickup: { latitude: number; longitude: number },
) {
  if (!truck) return null;
  return haversineMeters(
    { lat: truck.latitude, lng: truck.longitude },
    { lat: pickup.latitude, lng: pickup.longitude },
  );
}

export function formatDistanceMeters(meters: number | null) {
  if (meters == null) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function estimateArrivalMinutes(distanceMeters: number | null) {
  if (distanceMeters == null) return null;
  if (distanceMeters <= 80) return 0;
  const speedMps = getSimulatedTruckSpeedMps();
  const seconds = distanceMeters / speedMps;
  return Math.max(1, Math.ceil(seconds / 60));
}

export function formatEtaMinutes(minutes: number | null) {
  if (minutes == null) return "Calculating…";
  if (minutes <= 0) return "Arriving now";
  if (minutes === 1) return "~1 min";
  return `~${minutes} min`;
}
