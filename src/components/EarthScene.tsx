"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import Earth from "./Earth";
import ImpactMarker from "./ImpactMarker";

interface EarthSceneProps {
  impactLocation: { lat: number; lon: number } | null;
  onGlobeClick: (lat: number, lon: number) => void;
}

export default function EarthScene({
  impactLocation,
  onGlobeClick,
}: EarthSceneProps) {
  return (
    <Canvas
      camera={{
        position: [0, 0, 8],
        fov: 45,
        near: 0.1,
        far: 1000,
      }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      dpr={[1, 2]}
    >
      {/* Enhanced Lighting Setup */}
      <ambientLight intensity={0.25} color="#404040" />{" "}
      {/* Increased ambient for better dark side visibility */}
      {/* Main Sun Light - positioned to show more night side */}
      <directionalLight
        position={[25, 3, 8]}
        intensity={2.8}
        color="#ffffff"
        castShadow={false}
      />
      {/* Fill Light (opposite side for subtle illumination) */}
      <directionalLight
        position={[-8, -3, -8]}
        intensity={0.4}
        color="#87CEEB"
        castShadow={false}
      />
      {/* Hemisphere Light for natural sky illumination */}
      <hemisphereLight
        args={["#87CEEB", "#1a1a2e", 0.5]}
        position={[0, 50, 0]}
      />
      {/* Stars Background */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />
      {/* Earth with Materials */}
      <Suspense fallback={null}>
        <Earth onGlobeClick={onGlobeClick} />
      </Suspense>
      {/* Impact Marker */}
      {impactLocation && (
        <ImpactMarker
          lat={impactLocation.lat}
          lon={impactLocation.lon}
          radius={2}
          visible={true}
        />
      )}
      {/* Camera Controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minDistance={3}
        maxDistance={15}
        autoRotate={true}
        autoRotateSpeed={0.5}
        zoomSpeed={0.8}
      />
    </Canvas>
  );
}
