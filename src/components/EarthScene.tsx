"use client";

import { useRef, useEffect, Suspense, memo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EarthMaterial } from "./EarthMaterial";
import ImpactMarker from "./ImpactMarker";
import ProceduralAsteroid from "./ProceduralAsteroid";
import AsteroidImpactAnimation from "./AsteroidImpactAnimation";
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
 * Only rotates on Y-axis for day/night cycle
 */
const Earth = memo(
  ({
    earthRef,
    cloudRef,
    rotationPaused,
    impactPoint,
    asteroidSelected,
  }: {
    earthRef: React.MutableRefObject<THREE.Mesh | null>;
    cloudRef: React.MutableRefObject<THREE.Mesh | null>;
    rotationPaused: boolean;
    impactPoint: { lat: number; lon: number } | null;
    asteroidSelected: boolean;
  }) => {
    const { earthMaterial, cloudsMap } = EarthMaterial();

    useFrame((_, delta) => {
      // Pause Earth rotation when dragging OR when asteroid is selected
      if (
        !rotationPaused &&
        !asteroidSelected &&
        earthRef.current &&
        cloudRef.current
      ) {
        // Day/night cycle rotation - only when not paused and no asteroid selected
        earthRef.current.rotation.y += delta * 0.1;
        cloudRef.current.rotation.y += delta * 0.12;
      }
    });

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

  // Handle scene transitions
  useEffect(() => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.transitionToScene(cameraScene);
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

        const normalizedY = point.y / 2;
        const lat =
          Math.asin(Math.max(-1, Math.min(1, normalizedY))) * (180 / Math.PI);

        let lon = Math.atan2(point.x, point.z) * (180 / Math.PI);
        lon = lon - THREE.MathUtils.radToDeg(earthRotation) + 90;

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
      {/* STATIC sun light - angled for slanted terminator */}
      <directionalLight
        intensity={2.5}
        position={[10, 3, 0]} // STATIC position with Y offset
        color="#ffffff"
      />
      <ambientLight intensity={0.15} />

      {/* Enhanced lighting for asteroid visibility */}
      <pointLight
        position={[-10, 3, 2]}
        intensity={3.0}
        distance={20}
        color="#ffffff"
      />
      {/* Fill light from opposite angle */}
      <pointLight
        position={[-10, -1, -2]}
        intensity={1.5}
        distance={15}
        color="#ffffff"
      />
      {/* Additional front light for better definition */}
      <pointLight
        position={[-8, 2, 5]}
        intensity={1.0}
        distance={15}
        color="#8899ff"
      />
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
          />

          {/* Show asteroid in detail view - positioned on left side */}
          {selectedNeo &&
            cameraScene === CameraScene.ASTEROID_DETAIL &&
            !isImpacting && (
              <ProceduralAsteroid
                asteroid={selectedNeo}
                position={[-10, 2, 0]} // Left side, more visible position
                autoRotate={true}
              />
            )}

          {/* Impact animation */}
          {isImpacting && selectedNeo && impactPoint && (
            <AsteroidImpactAnimation
              asteroid={selectedNeo}
              impactPoint={impactPoint}
              startPosition={[-10, 2, 0]}
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
