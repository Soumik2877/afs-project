"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl";
import type { Camera, Scene, WebGLRenderer } from "three";
import type { Map as MapboxMap, CustomLayerInterface } from "mapbox-gl";
import mapboxgl from "mapbox-gl";

const DEFAULT_MODEL = "/magirus_d_serie_dump_truck.glb";
const LAYER_ID = "truck-glb-3d-layer";

interface TruckGlbLayerProps {
  latitude: number | null;
  longitude: number | null;
  bearing: number;
  modelUrl?: string;
  scale?: number;
}

type LayerState = {
  latitude: number;
  longitude: number;
  bearing: number;
  scale: number;
  modelReady: boolean;
};

export function TruckGlbLayer({
  latitude,
  longitude,
  bearing,
  modelUrl = process.env.NEXT_PUBLIC_TRUCK_GLB_URL ?? DEFAULT_MODEL,
  scale = Number(process.env.NEXT_PUBLIC_TRUCK_MODEL_SCALE ?? 2.2),
}: TruckGlbLayerProps) {
  const { current: mapRef } = useMap();
  const map = mapRef?.getMap() as MapboxMap | undefined;
  const stateRef = useRef<LayerState>({
    latitude: 0,
    longitude: 0,
    bearing: 0,
    scale,
    modelReady: false,
  });
  const addedRef = useRef(false);

  useEffect(() => {
    if (!map || latitude == null || longitude == null) return;

    stateRef.current.latitude = latitude;
    stateRef.current.longitude = longitude;
    stateRef.current.bearing = bearing;
    stateRef.current.scale = scale;

    let rafId = requestAnimationFrame(function tick() {
      map.triggerRepaint();
      rafId = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(rafId);
  }, [map, latitude, longitude, bearing, scale]);

  useEffect(() => {
    const mapInstance = map;
    if (!mapInstance) return;

    let cancelled = false;

    async function attachLayer() {
      if (!mapInstance || cancelled || addedRef.current || mapInstance.getLayer(LAYER_ID)) {
        return;
      }

      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");

      if (cancelled) return;

      let renderer: WebGLRenderer;
      let scene: Scene;
      let camera: Camera;

      const customLayer: CustomLayerInterface = {
        id: LAYER_ID,
        type: "custom",
        renderingMode: "3d",
        onAdd(mapArg, gl) {
          camera = new THREE.Camera();
          scene = new THREE.Scene();

          scene.add(new THREE.AmbientLight(0xffffff, 0.85));
          const sun = new THREE.DirectionalLight(0xffffff, 1.1);
          sun.position.set(50, 80, 120);
          scene.add(sun);

          renderer = new THREE.WebGLRenderer({
            canvas: mapArg.getCanvas(),
            context: gl,
            antialias: true,
          });
          renderer.autoClear = false;

          const loader = new GLTFLoader();
          loader.load(
            modelUrl,
            (gltf) => {
              if (cancelled) return;

              const model = gltf.scene;
              const box = new THREE.Box3().setFromObject(model);
              const center = box.getCenter(new THREE.Vector3());
              model.position.sub(center);

              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z) || 1;
              const fitScale = (stateRef.current.scale * 3.5) / maxDim;
              model.scale.set(fitScale, fitScale, fitScale);

              scene.add(model);
              stateRef.current.modelReady = true;
              mapArg.triggerRepaint();
            },
            undefined,
            (err) => console.error("Truck GLB load failed:", err),
          );
        },
        render(_gl, matrix) {
          if (!stateRef.current.modelReady) return;

          const state = stateRef.current;
          const mercator = mapboxgl.MercatorCoordinate.fromLngLat(
            [state.longitude, state.latitude],
            0,
          );

          const meterScale = mercator.meterInMercatorCoordinateUnits() * state.scale;
          const bearingRad = (state.bearing * Math.PI) / 180;

          const rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0),
            Math.PI / 2,
          );
          const rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1),
            -bearingRad,
          );

          const projection = new THREE.Matrix4().fromArray(matrix);
          const local = new THREE.Matrix4()
            .makeTranslation(mercator.x, mercator.y, mercator.z)
            .scale(new THREE.Vector3(meterScale, -meterScale, meterScale))
            .multiply(rotationX)
            .multiply(rotationZ);

          camera.projectionMatrix = projection.multiply(local);
          renderer.resetState();
          renderer.render(scene, camera);
        },
      };

      mapInstance.addLayer(customLayer);
      addedRef.current = true;
    }

    void attachLayer();

    return () => {
      cancelled = true;
      stateRef.current.modelReady = false;
      if (mapInstance.getLayer(LAYER_ID)) {
        mapInstance.removeLayer(LAYER_ID);
      }
      addedRef.current = false;
    };
  }, [map, modelUrl]);

  return null;
}
