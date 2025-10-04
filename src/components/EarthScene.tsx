"use client";

import { useRef, useEffect, Suspense, memo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EarthMaterial } from "./EarthMaterial";
import ImpactMarker from "./ImpactMarker";
import Asteroid3DModel from "./Asteroid3DModel";
import SimplifiedImpactAnimation from "./SimplifiedImpactAnimation";
import * as THREE from "three";
import { SceneCameraController, CameraScene } from "@/lib/sceneCamera";
import { NeoSummary } from "@/types";

interface EarthSceneProps {
  selectedNeo: NeoSummary | null;
  impactPoint: { lat: number; lon: number } | null;
  onGlobeClick: (lat: number, lon: number) => void;
  cameraScene: CameraScene;
  isImpacting: boolean;
  onImpactComplete: () => void;
}

/**
 * Earth Component - STATIC position at (0,0,0)
 * Rotates to face impact point when selected
 */
const Earth = memo(
  ({
    earthRef,
    cloudRef,
    rotationPaused,
    impactPoint,
    asteroidSelected,
    targetRotation,
  }: {
    earthRef: React.MutableRefObject<THREE.Mesh | null>;
    cloudRef: React.MutableRefObject<THREE.Mesh | null>;
    rotationPaused: boolean;
    impactPoint: { lat: number; lon: number } | null;
    asteroidSelected: boolean;
    targetRotation: number | null;
  }) => {
    const { earthMaterial, cloudsMap } = EarthMaterial();
    const [isRotatingToTarget, setIsRotatingToTarget] = useState(false);

    useFrame((_, delta) => {
      if (!earthRef.current || !cloudRef.current) return;

      // Rotate Earth to face impact point
      if (targetRotation !== null && isRotatingToTarget) {
        const currentRotation = earthRef.current.rotation.y;
        const diff = targetRotation - currentRotation;

        // Normalize diff to [-PI, PI]
        let normalizedDiff = diff;
        while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
        while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;

        // Smooth rotation
        if (Math.abs(normalizedDiff) > 0.01) {
          const rotationSpeed = normalizedDiff * 2 * delta; // Smooth interpolation
          earthRef.current.rotation.y += rotationSpeed;
          cloudRef.current.rotation.y += rotationSpeed * 1.2; // Clouds move slightly faster
        } else {
          // Reached target
          earthRef.current.rotation.y = targetRotation;
          cloudRef.current.rotation.y = targetRotation;
          setIsRotatingToTarget(false);
        }
      }
      // Normal day/night rotation
      else if (!rotationPaused && !asteroidSelected && !isRotatingToTarget) {
        earthRef.current.rotation.y += delta * 0.1;
        cloudRef.current.rotation.y += delta * 0.12;
      }
    });

    // Trigger rotation when impact point changes
    useEffect(() => {
      if (impactPoint && targetRotation !== null) {
        setIsRotatingToTarget(true);
      }
    }, [impactPoint, targetRotation]);

    return (
      <group position={[0, 0, 0]}>
        {" "}
        {/* ALWAYS at origin */}
        {/* Earth mesh */}
        <mesh ref={earthRef}>
          <sphereGeometry args={[2, 64, 64]} />
          {earthMaterial}

          {/* Impact marker as child */}
          {impactPoint && (
            <ImpactMarker
              lat={impactPoint.lat}
              lon={impactPoint.lon}
              radius={2}
              visible={true}
            />
          )}
        </mesh>
        {/* Cloud layer */}
        <mesh ref={cloudRef}>
          <sphereGeometry args={[2.01, 64, 64]} />
          <meshBasicMaterial
            map={cloudsMap}
            transparent
            opacity={0.2}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    );
  }
);

Earth.displayName = "Earth";

/**
 * Scene Controller - Handles camera, interactions, lighting
 */
function SceneController({
  earthRef,
  onGlobeClick,
  cameraScene,
  setRotationPaused,
}: {
  earthRef: React.MutableRefObject<THREE.Mesh | null>;
  onGlobeClick: (lat: number, lon: number) => void;
  cameraScene: CameraScene;
  setRotationPaused: (paused: boolean) => void;
}) {
  const { camera, raycaster, gl } = useThree();
  const cameraControllerRef = useRef<SceneCameraController | null>(null);

  // Initialize camera controller
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      cameraControllerRef.current = new SceneCameraController(camera);
    }
  }, [camera]);

  // Handle scene transitions with callback support
  useEffect(() => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.transitionToScene(cameraScene, () => {
        console.log(`✅ Camera transition to ${cameraScene} complete`);
      });
    }
  }, [cameraScene]);

  // Update camera every frame
  useFrame((_, delta) => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.update(delta);
      setRotationPaused(cameraControllerRef.current.shouldPauseEarthRotation());
    }
  });

  // Mouse drag handling
  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      if (cameraControllerRef.current) {
        cameraControllerRef.current.startDrag(e.clientX);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (cameraControllerRef.current) {
        cameraControllerRef.current.updateDrag(e.clientX);
      }
    };

    const handleMouseUp = () => {
      if (cameraControllerRef.current) {
        cameraControllerRef.current.endDrag();
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [gl]);

  // Click to select impact point
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!earthRef.current || cameraControllerRef.current?.dragging) return;

      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObject(earthRef.current, false);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const earthRotation = earthRef.current.rotation.y;

        // Calculate latitude from Y position
        const normalizedY = point.y / 2;
        const lat =
          Math.asin(Math.max(-1, Math.min(1, normalizedY))) * (180 / Math.PI);

        // Calculate longitude from X and Z, accounting for Earth rotation and texture offset
        let lon = Math.atan2(point.x, point.z) * (180 / Math.PI);
        // Adjust for Earth's rotation and texture offset (270° total)
        lon = lon - THREE.MathUtils.radToDeg(earthRotation) + 270;

        // Normalize to -180 to 180
        while (lon > 180) lon -= 360;
        while (lon < -180) lon += 360;

        onGlobeClick(lat, lon);
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [camera, raycaster, gl, onGlobeClick, earthRef]);

  return (
    <>
      {/* Sun light for Earth day/night */}
      <directionalLight intensity={2.5} position={[10, 3, 0]} color="#ffffff" />

      {/* Strong ambient light so asteroid is always visible (not dark side) */}
      <ambientLight intensity={0.8} />

      {/* Hemisphere light for natural looking space lighting */}
      <hemisphereLight intensity={1.0} color="#ffffff" groundColor="#444488" />
    </>
  );
}

/**
 * Main Earth Scene Component
 */
export default function EarthScene({
  selectedNeo,
  impactPoint,
  onGlobeClick,
  cameraScene,
  isImpacting,
  onImpactComplete,
}: EarthSceneProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const [rotationPaused, setRotationPaused] = useState(false);

  // Calculate target rotation to face impact point toward camera
  const targetRotation = impactPoint
    ? Math.atan2(impactPoint.lon, 90) * (Math.PI / 180) + Math.PI / 2
    : null;

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          position: [8, 2, 8],
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
        }}
        dpr={[1, 2]}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <Earth
            earthRef={earthRef}
            cloudRef={cloudRef}
            rotationPaused={rotationPaused}
            impactPoint={impactPoint}
            asteroidSelected={!!selectedNeo}
            targetRotation={targetRotation}
          />

          {/* Show asteroid ALWAYS when selected (before camera moves) */}
          {selectedNeo && !isImpacting && (
            <Asteroid3DModel
              asteroid={selectedNeo}
              position={[-3, 0, -5]} // Foreground, left side - closer to camera
              autoRotate={true}
            />
          )}

          {/* Impact animation */}
          {isImpacting && selectedNeo && impactPoint && (
            <SimplifiedImpactAnimation
              asteroid={selectedNeo}
              impactPoint={impactPoint}
              startPosition={[-15, 0, 0]} // Closer start for visible full trajectory
              onComplete={onImpactComplete}
            />
          )}
        </Suspense>

        <SceneController
          earthRef={earthRef}
          onGlobeClick={onGlobeClick}
          cameraScene={cameraScene}
          setRotationPaused={setRotationPaused}
        />

        {/* Starfield background */}
        <Stars radius={100} depth={50} count={5000} factor={4} fade />
      </Canvas>
    </div>
  );
}
