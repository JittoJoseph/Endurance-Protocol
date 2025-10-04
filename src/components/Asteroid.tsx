"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createNoise3D } from "simplex-noise";

interface AsteroidProps {
  position: [number, number, number];
  size: number; // diameter in meters
  rotation?: [number, number, number];
  visible?: boolean;
}

export default function Asteroid({
  position,
  size,
  rotation = [0, 0, 0],
  visible = true,
}: AsteroidProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Convert real diameter (meters) to scene scale
  // Earth radius is 2 units = 6371 km = 6,371,000 meters
  // So 1 unit = 3,185,500 meters
  const EARTH_RADIUS_UNITS = 2;
  const EARTH_RADIUS_METERS = 6371000;
  const sceneRadius = (size / 2 / EARTH_RADIUS_METERS) * EARTH_RADIUS_UNITS;

  // Generate procedural asteroid geometry with displacement
  const geometry = useMemo(() => {
    const noise3D = createNoise3D();
    const baseGeometry = new THREE.IcosahedronGeometry(sceneRadius, 3);
    const positions = baseGeometry.attributes.position;

    // Apply noise-based displacement to vertices
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      // Get vertex normal direction
      const vertex = new THREE.Vector3(x, y, z);
      const normal = vertex.clone().normalize();

      // Multi-octave noise for rough, rocky surface
      const noiseScale = 8;
      const displacement =
        noise3D(x * noiseScale, y * noiseScale, z * noiseScale) * 0.3 +
        noise3D(x * noiseScale * 2, y * noiseScale * 2, z * noiseScale * 2) *
          0.15 +
        noise3D(x * noiseScale * 4, y * noiseScale * 4, z * noiseScale * 4) *
          0.08;

      // Apply displacement along normal
      vertex.add(normal.multiplyScalar(displacement * sceneRadius));

      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    positions.needsUpdate = true;
    baseGeometry.computeVertexNormals();

    return baseGeometry;
  }, [sceneRadius]);

  // Slow rotation for visual interest
  useFrame((_, delta) => {
    if (meshRef.current && visible) {
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      geometry={geometry}
      visible={visible}
    >
      <meshStandardMaterial
        color="#6b6b6b"
        roughness={0.9}
        metalness={0.1}
        flatShading
      />
    </mesh>
  );
}
