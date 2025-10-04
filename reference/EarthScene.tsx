"use client";

import { useRef, useEffect, Suspense, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EarthMaterial } from "./EarthMaterial";
import * as THREE from "three";

// Define props type
interface EarthSceneProps {
  onGlobeClick: (lat: number, lon: number) => void;
  impactPoint: { lat: number; lon: number } | null;
  asteroidInFlight: boolean;
  asteroidSize: number;
  onImpactComplete: () => void | Promise<void>;
}

const Earth = memo(
  ({ isDragging }: { isDragging: React.MutableRefObject<boolean> }) => {
    const earthGroupRef = useRef<THREE.Group>(null);
    const earthMeshRef = useRef<THREE.Mesh>(null);
    const cloudMeshRef = useRef<THREE.Mesh>(null);

    const { earthMaterial, cloudsMap } = EarthMaterial();

    useFrame((_, delta) => {
      if (!isDragging.current) {
        if (earthMeshRef.current) {
          earthMeshRef.current.rotation.y += delta * 0.1;
        }
        if (cloudMeshRef.current) {
          cloudMeshRef.current.rotation.y += delta * 0.12;
        }
      }
    });

    return (
      <group ref={earthGroupRef}>
        {/* Sunlight that follows Earth when dragging - angled for slanted terminator */}
        <directionalLight
          intensity={2.5}
          position={[10, 3, 0]}
          color="#ffffff"
        />

        {/* Earth */}
        <mesh ref={earthMeshRef}>
          <sphereGeometry args={[2, 64, 64]} />
          {earthMaterial}
        </mesh>

        {/* Clouds */}
        <mesh ref={cloudMeshRef}>
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

export default function EarthScene({
  onGlobeClick,
  impactPoint,
  asteroidInFlight,
  asteroidSize,
  onImpactComplete,
}: EarthSceneProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const isDragging = useRef(false);

  // Handle WebGL context loss
  useEffect(() => {
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn("⚠️ WebGL context lost - Attempting recovery...");
    };
    const handleContextRestored = () => {
      console.log("✅ WebGL context restored successfully");
    };

    const canvas = canvasRef.current?.querySelector("canvas");
    if (canvas) {
      canvas.addEventListener("webglcontextlost", handleContextLost, false);
      canvas.addEventListener(
        "webglcontextrestored",
        handleContextRestored,
        false
      );

      return () => {
        canvas.removeEventListener("webglcontextlost", handleContextLost);
        canvas.removeEventListener(
          "webglcontextrestored",
          handleContextRestored
        );
      };
    }
  }, []);

  // Debug logging (optional)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🌍 Earth Scene mounted - textures will persist during HMR");
    }
  }, []);

  return (
    <div ref={canvasRef} className="w-full h-full">
      <Canvas
        camera={{ position: [5, 0, 5], fov: 45 }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
        }}
        dpr={[1, 2]}
        frameloop="always"
      >
        {/* Fixed sunlight in world space (the "Sun") */}
        <directionalLight
          intensity={2.5}
          position={[10, 0, 0]} // Sunlight from +X
          color="#ffffff"
        />
        <ambientLight intensity={0.15} />

        {/* Earth */}
        <Suspense fallback={null}>
          <Earth isDragging={isDragging} />
        </Suspense>

        {/* Stars */}
        <Stars radius={100} depth={50} count={5000} factor={4} fade />

        {/* Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
          minDistance={3}
          maxDistance={10}
          autoRotate={false}
          onStart={() => {
            isDragging.current = true;
          }}
          onEnd={() => {
            isDragging.current = false;
          }}
        />
      </Canvas>
    </div>
  );
}
