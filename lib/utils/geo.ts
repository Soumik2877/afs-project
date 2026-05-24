/** Convert degrees to radians */
export function deg2rad(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;

  const dLat = deg2rad(b.lat - a.lat);

  const dLng = deg2rad(b.lng - a.lng);

  const lat1 = deg2rad(a.lat);

  const lat2 = deg2rad(b.lat);

  const sinDLat = Math.sin(dLat / 2);

  const sinDLng = Math.sin(dLng / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return R * c;
}

/** Project a point onto a segment; returns interpolation t ∈ [0, 1] and snapped lat/lng. */
export function projectPointOnSegment(
  point: { lat: number; lng: number },
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
) {
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const px = point.lng - start.lng;
  const py = point.lat - start.lat;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (px * dx + py * dy) / len2));

  return {
    t,
    lat: start.lat + t * dy,
    lng: start.lng + t * dx,
  };
}
