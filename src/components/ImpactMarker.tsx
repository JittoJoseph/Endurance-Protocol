"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { latLonToVector3 } from "@/lib/physics";

interface ImpactMarkerProps {
  lat: number;
  lon: number;
  radius?: number;
  visible?: boolean;
}

export default function ImpactMarker({
  lat,
  lon,
  radius = 2,
  visible = true,
}: ImpactMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Convert lat/lon to 3D position (slightly above surface)
  const position = latLonToVector3(lat, lon, radius + 0.01);

  // Calculate normal direction for orientation (point outward from sphere)
  const normal = new THREE.Vector3(...position).normalize();
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

  // Animate pulsing
  useFrame(({ clock }) => {
    if (ringRef.current && visible) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.15;
      ringRef.current.scale.set(scale, scale, 1);
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={position} quaternion={quaternion}>
      {/* Outer pulsing ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.08, 0.1, 32]} />
        <meshBasicMaterial
          color="#ff0000"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner dot */}
      <mesh position={[0, 0, 0.001]}>
        <circleGeometry args={[0.05, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Crosshair lines */}
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[0.3, 0.01]} />
        <meshBasicMaterial
          color="#ff0000"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, 0.002]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[0.3, 0.01]} />
        <meshBasicMaterial
          color="#ff0000"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
