# Live driver marker

The live route map shows a **green blinking radar** (`components/maps/DriverRadarMarker.tsx`):

- Pulsing rings when the driver is moving
- Triangle rotates with GPS bearing (0° = north)

Smooth movement uses `useSmoothMapPosition` and `NEXT_PUBLIC_DRIVER_ANIMATION_MS`.

## Tuning simulation

In `.env.local`:

```env
DRIVER_SIMULATE_INTERVAL_MS=3000
NEXT_PUBLIC_DRIVER_ANIMATION_MS=3000
NEXT_PUBLIC_DRIVER_LOCATION_POLL_MS=2000
```

Restart `npm run dev` and `npm run simulate:all` after changes.
