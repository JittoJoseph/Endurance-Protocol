"use client";

import { useRef, useEffect, Suspense, memo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import { EarthMaterial } from "./EarthMaterial";
import ImpactMarker from "./ImpactMarker";
import * as THREE from "three";

interface EarthSceneProps {
  impactLocation: { lat: number; lon: number } | null;
  onGlobeClick: (lat: number, lon: number) => void;
}

/**
 * Earth Component - Simplified for PIVOT approach
 * Just renders beautiful Earth with day/night textures and cloud layer
 */
const Earth = memo(
  ({
    earthRef,
    cloudRef,
    impactLocation,
  }: {
    earthRef: React.MutableRefObject<THREE.Mesh | null>;
    cloudRef: React.MutableRefObject<THREE.Mesh | null>;
    impactLocation: { lat: number; lon: number } | null;
  }) => {
    const { earthMaterial, cloudsMap } = EarthMaterial();

    // Simple continuous rotation for visual appeal
    useFrame((_, delta) => {
      if (!earthRef.current || !cloudRef.current) return;

      earthRef.current.rotation.y += delta * 0.05; // Slow Earth rotation
      cloudRef.current.rotation.y += delta * 0.06; // Clouds slightly faster
    });

    return (
      <group position={[0, 0, 0]}>
        {/* Earth mesh */}
        <mesh ref={earthRef}>
          <sphereGeometry args={[2, 64, 64]} />
          {earthMaterial}

          {/* Impact marker as child */}
          {impactLocation && (
            <ImpactMarker
              lat={impactLocation.lat}
              lon={impactLocation.lon}
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
 * Click Handler - Simplified raycasting for Earth click detection
 */
function ClickHandler({
  earthRef,
  onGlobeClick,
}: {
  earthRef: React.MutableRefObject<THREE.Mesh | null>;
  onGlobeClick: (lat: number, lon: number) => void;
}) {
  const { camera, raycaster, gl } = useThree();

  // Click to select impact point with lat/lon calculation
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!earthRef.current) return;

      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObject(earthRef.current, false);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const earthRotation = earthRef.current!.rotation.y;

        // Calculate latitude from Y position
        const normalizedY = point.y / 2; // Earth radius is 2
        const lat =
          Math.asin(Math.max(-1, Math.min(1, normalizedY))) * (180 / Math.PI);

        // Calculate longitude from X and Z, accounting for Earth rotation and texture offset
        let lon = Math.atan2(point.x, point.z) * (180 / Math.PI);
        // Adjust for Earth's rotation and texture offset (270° total)
        lon = lon - THREE.MathUtils.radToDeg(earthRotation) + 270;

        // Normalize to -180 to 180
        while (lon > 180) lon -= 360;
        while (lon < -180) lon += 360;

        console.log(
          `🌍 Earth clicked at: Lat ${lat.toFixed(2)}°, Lon ${lon.toFixed(2)}°`
        );
        onGlobeClick(lat, lon);
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener("click", handleClick);

    return () => {
      canvas.removeEventListener("click", handleClick);
    };
  }, [camera, raycaster, gl, onGlobeClick, earthRef]);

  return null;
}

/**
 * Main Earth Scene Component - PIVOT simplified version
 * Beautiful 3D Earth with manual OrbitControls rotation
 * Click-to-select impact location with lat/lon calculation
 */
export default function EarthScene({
  impactLocation,
  onGlobeClick,
}: EarthSceneProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          position: [0, 0, 8],
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          {/* Beautiful 3D Earth */}
          <Earth
            earthRef={earthRef}
            cloudRef={cloudRef}
            impactLocation={impactLocation}
          />

          {/* Click handler for impact location selection */}
          <ClickHandler earthRef={earthRef} onGlobeClick={onGlobeClick} />

          {/* Lighting for realistic Earth rendering */}
          <directionalLight
            intensity={2.5}
            position={[5, 3, 5]}
            color="#ffffff"
          />
          <ambientLight intensity={0.3} />
          <hemisphereLight
            intensity={0.5}
            color="#ffffff"
            groundColor="#444488"
          />

          {/* Starfield background */}
          <Stars radius={100} depth={50} count={5000} factor={4} fade />

          {/* Manual camera controls - user can rotate/zoom Earth */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            autoRotate
            autoRotateSpeed={0.5}
            minDistance={4}
            maxDistance={15}
            enablePan={false}
            rotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
