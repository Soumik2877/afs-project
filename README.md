# Smart Waste Management System

Next.js 14 app with Supabase (auth, Postgres, RLS, Realtime, Storage), Mapbox maps, and demo simulations for IoT fill levels and driver fleet movement.

## Quick start

1. **Supabase** — Create a project, run [`supabase/migrations/000001_init.sql`](supabase/migrations/000001_init.sql) in the SQL editor, then enable Realtime on `bins`, `driver_locations`, `complaints`, and `routes`.
2. **Env** — Copy [`.env.example`](.env.example) to `.env.local` and fill in Supabase + Mapbox keys.
3. **Demo data** — Run [`supabase/seed_demo.sql`](supabase/seed_demo.sql) after creating at least one **driver** account via `/auth/signup`.
4. **Install & run**

```bash
npm install
npm run dev
```

5. **Simulations** (optional, no hardware):

```bash
# Terminal 2 — IoT fill levels every 30s
npm run simulate:iot

# Terminal 3 — driver GPS on active routes every 20s
npm run simulate:driver

# Or both together
npm run simulate:all
```

Set `IOT_SIMULATION_ENABLED=true` and `DRIVER_SIMULATION_ENABLED=true` in `.env.local`. Cron routes use `Authorization: Bearer $CRON_SECRET`.

## Demo simulation endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET/POST /api/iot-simulate` | Random walk on bin `fill_level`; triggers `bin_alerts` at ≥80% |
| `GET/POST /api/driver-simulate` | Moves drivers along active route `bin_ids` (fleet map) |
| `GET/POST /api/anomaly-check` | Flags idle drivers far from waypoints |
| `POST /api/iot-ping` | Single-bin update (`x-iot-secret` or Bearer) |

Enable anomaly demos: `DRIVER_SIMULATION_ANOMALY=true` (places some drivers far from route with stale GPS).

## Roles & routes

- **Admin** — `/admin` (bins, routes, fleet, complaints, decomposition, reports)
- **Driver** — `/driver` (today’s routes, check-in, QR scan)
- **Citizen** — `/citizen` (track map, report, QR bags, eco points)

## Vercel deployment

[`vercel.json`](vercel.json) schedules IoT simulation, driver simulation, anomaly check, and decomposition cron. Hobby plans may need longer intervals.

## Scripts

- `npm run build` — production build
- `npm run simulate:iot` — local IoT loop
- `npm run simulate:driver` — local fleet loop
- `npm run simulate:all` — both loops
