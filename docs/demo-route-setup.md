# Kalaikunda demo route (5 dustbins)

The truck simulation visits **exactly 5 bins** laid out on a small rectangle. It only moves between those coordinates.

```
  01 SW ───────── 02 SE
    │                 │
  04 NW ───────── 03 NE
         05 center
```

Visit order: **01 → 02 → 03 → 04 → 05** (clockwise around the rectangle, then center).

---

## Option A — Edit bin coordinates (recommended)

Edit **`lib/demo/demo-bin-placements.json`** with latitude/longitude for each bin:

```json
{ "suffix": "-01", "latitude": 22.335974, "longitude": 87.220821, ... }
```

Then seed:

```bash
npm run seed:demo-route
```

Set map center in `.env.local` (average of your bins is fine):

```env
DEMO_ROUTE_CENTER_LAT=22.333298
DEMO_ROUTE_CENTER_LNG=87.222896
DEMO_SIMULATION_BINS_ONLY=true
```

With `DEMO_ROUTE_LOOP=true` (default), the truck **loops forever**: BIN-DEMO-01 → 02 → 03 → 04 → 05 → 01 → …  
The route stays **active** and is never marked completed.

Restart simulation:

```bash
npm run dev
npm run simulate:all
```

---

## Option B — SQL in Supabase

1. Open **Supabase → SQL Editor**.
2. Open `supabase/seed_demo_rectangle.sql`.
3. Edit the `params` CTE at the top (`center_lat`, `center_lng`, `lat_span`, `lng_span`).
4. Run the script.

---

## Only use these 5 bins (remove old demo data)

If you still see many bins on the map, run once in SQL Editor:

```sql
-- Destructive: removes bins that are NOT part of the rectangle demo
DELETE FROM public.pickups
WHERE bin_id IN (SELECT id FROM public.bins WHERE label NOT LIKE 'BIN-DEMO-%');

DELETE FROM public.bins
WHERE label NOT LIKE 'BIN-DEMO-%';
```

Then run `npm run seed:demo-route` again.

---

## Verify

- **Citizen dashboard** — shows **Kalaikunda** route with live truck and bin updates.

## Citizen on-demand pickup

1. Run migration: `supabase/migrations/000002_citizen_pickup_requests.sql` in Supabase SQL Editor.
2. On the citizen home page, tap **Request pickup at my location** (or the demo pin link).
3. Banner shows **ETA** and **distance**; when the truck arrives it **blinks** — tap **Confirm pickup done**.
4. Truck resumes the normal bin loop (`npm run simulate:all` must be running).
- **Admin → Routes** — active route `Kalaikunda` with 5 bins.
- **Admin → Fleet / route detail** — green radar moves only inside the rectangle.
- Terminal: `npm run simulate:driver` should show `lat`/`lng` changing within your span.

---

## Mapbox tip

Set `NEXT_PUBLIC_MAPBOX_TOKEN`, then zoom the live map to your center. If the view is wrong, pan once; the map follows the driver after the first GPS ping.
