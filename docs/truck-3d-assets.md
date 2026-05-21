# Custom truck marker (image or 3D)

The live map renders **`public/magirus_d_serie_dump_truck.glb`** via Mapbox + Three.js (`components/maps/TruckGlbLayer.tsx`).

Configure in `.env.local`:

```env
NEXT_PUBLIC_TRUCK_GLB_URL=/magirus_d_serie_dump_truck.glb
NEXT_PUBLIC_TRUCK_MODEL_SCALE=2.2
```

Increase `NEXT_PUBLIC_TRUCK_MODEL_SCALE` if the truck looks too small.

---

## Legacy SVG fallback

`components/maps/ToyTruckMarker.tsx` is kept for reference. The app uses the GLB layer by default.

## Option A — PNG / SVG image (easiest)

1. Download a **top-down** truck icon (transparent PNG or SVG), e.g. from:
   - [Noun Project](https://thenounproject.com/) — search “garbage truck top view”
   - [Flaticon](https://www.flaticon.com/) — “truck map” / “delivery top view”
   - [Icons8](https://icons8.com/icons/set/truck)

2. Save as `public/truck-marker.png` (recommended ~128×128 px).

3. In `ToyTruckMarker.tsx`, replace the `<svg>...</svg>` block with:

```tsx
<img
  src="/truck-marker.png"
  alt=""
  width={56}
  height={56}
  className="drop-shadow-lg"
  style={{ transform: `rotate(${bearing}deg)` }}
/>
```

The truck must point **up** (north) in the image; the app rotates it with `bearing`.

## Option B — 3D model (GLB / GLTF)

You can use a free low-poly truck from:

- [Poly Pizza](https://poly.pizza/) — search “truck”, export GLB
- [Sketchfab](https://sketchfab.com/) — filter “Downloadable” + CC license
- [Kenney assets](https://kenney.nl/assets) — game-ready vehicles

Place the file at:

`public/models/truck.glb`

**Note:** Mapbox + true 3D models need extra setup (Three.js custom layer or Mapbox `ModelLayer`). That is not wired in this repo yet. For a quick win, **render your 3D truck to a PNG top-down sprite** in Blender or a screenshot tool and use Option A.

### If you want full 3D on the map later

Requirements:

- `three` + `@types/three`
- Mapbox custom layer OR `map.addLayer({ type: 'model', ... })` (Mapbox GL v3+)
- Model scaled and oriented so +Y or model forward aligns with route bearing

Ask to implement `ModelTruckLayer` when you have a specific `.glb` file ready.

## Tuning smooth movement

In `.env.local`:

```env
DRIVER_SIMULATE_INTERVAL_MS=3000
NEXT_PUBLIC_DRIVER_ANIMATION_MS=3000
```

Restart `npm run dev` and `npm run simulate:all` after changes.
