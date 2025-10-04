"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NeoSummary } from "@/types";

/**
 * Scale Configuration
 * Real Earth radius: ~6,371 km
 * Our Earth radius: 2 units
 * Scale factor: 2 / 6371 = 0.000314 units per km
 * Or: 1 unit = 3185.5 km
 */
const SCALE_FACTOR = 2 / 6371; // units per kilometer
const EARTH_RADIUS_UNITS = 2; // Our Earth is 2 units radius

interface ProceduralAsteroidProps {
  asteroid: NeoSummary;
  position?: [number, number, number];
  autoRotate?: boolean;
}

/**
 * Procedural Asteroid Generator
 * Creates realistic grey asteroids with vertex displacement
 */
export default function ProceduralAsteroid({
  asteroid,
  position = [0, 0, 0],
  autoRotate = true,
}: ProceduralAsteroidProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate asteroid geometry with noise displacement
  const geometry = useMemo(() => {
    // Convert diameter from meters to kilometers
    const diameterKm = asteroid.estDiameterMeters.avg / 1000;

    // Apply same scale factor as Earth
    const radiusUnits = (diameterKm / 2) * SCALE_FACTOR;

    console.log(
      `Asteroid ${asteroid.name}: ${diameterKm.toFixed(
        2
      )}km → ${radiusUnits.toFixed(4)} units`
    );

    // Create base icosahedron (makes it more asteroid-like than sphere)
    const baseGeometry = new THREE.IcosahedronGeometry(radiusUnits, 3);

    // Apply multi-octave noise displacement for realistic surface
    const positions = baseGeometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);

      // Multi-octave noise (simplified - using sin waves)
      const noise1 = Math.sin(vertex.x * 5 + vertex.y * 3) * 0.15;
      const noise2 = Math.sin(vertex.x * 10 + vertex.z * 7) * 0.08;
      const noise3 = Math.sin(vertex.y * 15 + vertex.z * 11) * 0.04;

      const displacement = (noise1 + noise2 + noise3) * radiusUnits;

      vertex.normalize().multiplyScalar(radiusUnits + displacement);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    baseGeometry.computeVertexNormals();
    return baseGeometry;
  }, [asteroid]);

  // Realistic asteroid material (grey, rocky, dark like in space)
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x444444), // Darker grey
      roughness: 0.95, // Very rough (rocky surface)
      metalness: 0.05, // Barely metallic
      emissive: new THREE.Color(0x000000), // No glow
      emissiveIntensity: 0,
      flatShading: false, // Smooth shading with vertex normals
    });
  }, []);

  // Very subtle random rotation
  const rotationSpeed = useRef({
    x: (Math.random() - 0.5) * 0.02, // Much slower
    y: (Math.random() - 0.5) * 0.02,
    z: (Math.random() - 0.5) * 0.02,
  });

  useFrame((_, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.x += rotationSpeed.current.x * delta;
      meshRef.current.rotation.y += rotationSpeed.current.y * delta;
      meshRef.current.rotation.z += rotationSpeed.current.z * delta;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      castShadow
      receiveShadow
    />
  );
}

/**
 * Helper: Calculate scale info for display
 */
export function getAsteroidScaleInfo(diameterMeters: number) {
  const diameterKm = diameterMeters / 1000;
  const radiusKm = diameterKm / 2;
  const radiusUnits = radiusKm * SCALE_FACTOR;

  // Compare to Earth
  const earthRadiusKm = 6371;
  const comparisonToEarth = (diameterKm / (earthRadiusKm * 2)) * 100;

  return {
    diameterKm,
    radiusKm,
    radiusUnits,
    comparisonToEarth: comparisonToEarth.toFixed(3) + "%",
    scaleFactor: SCALE_FACTOR,
  };
}
