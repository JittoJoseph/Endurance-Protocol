"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { NeoSummary } from "@/types";

interface Asteroid3DModelProps {
  asteroid: NeoSummary;
  position?: [number, number, number];
  autoRotate?: boolean;
}

/**
 * Size normalization for asteroids
 * Maps any asteroid diameter to a visually reasonable size range
 */
function normalizeAsteroidSize(diameterMeters: number): number {
  // Real asteroid sizes vary wildly (10m to 10km+)
  // Normalize to a visual range: 0.3 to 1.2 units
  const minVisualSize = 0.3;
  const maxVisualSize = 1.2;

  // Use logarithmic scale for better visual variation
  const minDiameter = 10; // 10 meters
  const maxDiameter = 5000; // 5 km (our API filter limit)

  // Clamp input
  const clampedDiameter = Math.max(
    minDiameter,
    Math.min(maxDiameter, diameterMeters)
  );

  // Logarithmic interpolation
  const logMin = Math.log(minDiameter);
  const logMax = Math.log(maxDiameter);
  const logValue = Math.log(clampedDiameter);

  const normalizedValue = (logValue - logMin) / (logMax - logMin);

  // Map to visual size range
  return minVisualSize + normalizedValue * (maxVisualSize - minVisualSize);
}

/**
 * Asteroid 3D Model Component
 * Uses GLB model with size normalization and rotation
 */
export default function Asteroid3DModel({
  asteroid,
  position = [0, 0, 0],
  autoRotate = true,
}: Asteroid3DModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Load the 3D model
  const { scene } = useGLTF("/asteroid_low_poly.glb");

  // Clone the scene to allow multiple instances
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Calculate normalized size
  const normalizedSize = useMemo(() => {
    const avgDiameter = asteroid.estDiameterMeters.avg;
    const size = normalizeAsteroidSize(avgDiameter);

    console.log(
      `Asteroid ${asteroid.name}: ${(avgDiameter / 1000).toFixed(
        2
      )}km → ${size.toFixed(2)} units (normalized)`
    );

    return size;
  }, [asteroid]);

  // Apply dark grey material to all meshes
  useMemo(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0x444444, // Dark grey
          roughness: 0.95,
          metalness: 0.05,
          emissive: 0x000000,
          emissiveIntensity: 0,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  // Random rotation speeds
  const rotationSpeed = useRef({
    x: (Math.random() - 0.5) * 0.02,
    y: (Math.random() - 0.5) * 0.02,
    z: (Math.random() - 0.5) * 0.02,
  });

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.x += rotationSpeed.current.x * delta;
      groupRef.current.rotation.y += rotationSpeed.current.y * delta;
      groupRef.current.rotation.z += rotationSpeed.current.z * delta;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive object={clonedScene} scale={normalizedSize} />
    </group>
  );
}

// Preload the model
useGLTF.preload("/asteroid_low_poly.glb");

/**
 * Export size normalization for use in other components
 */
export { normalizeAsteroidSize };
