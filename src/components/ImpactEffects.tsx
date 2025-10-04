"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { latLonToVector3 } from "@/lib/physics";

interface ImpactEffectsProps {
  lat: number;
  lon: number;
  radius?: number;
  onComplete?: () => void;
}

export default function ImpactEffects({
  lat,
  lon,
  radius = 2,
  onComplete,
}: ImpactEffectsProps) {
  const fireballRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const [animationTime, setAnimationTime] = useState(0);
  const hasCompleted = useRef(false);

  // Convert lat/lon to 3D position
  const position = latLonToVector3(lat, lon, radius);

  // Create particle system
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Start at impact point
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;

      // Random outward velocities
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5; // Hemisphere
      const speed = 0.5 + Math.random() * 1.5;

      velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i3 + 2] = Math.cos(phi) * speed;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

    return geometry;
  }, []);

  // Animate impact effects
  useFrame((_, delta) => {
    setAnimationTime((t) => t + delta);

    const t = animationTime;

    // Fireball expansion and fade (duration: 2 seconds)
    if (fireballRef.current && t < 2) {
      const scale = 0.1 + t * 0.5; // Expand
      fireballRef.current.scale.set(scale, scale, scale);

      const material = fireballRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 1 - t / 2); // Fade out
    }

    // Particle burst animation
    if (particlesRef.current && t < 3) {
      const positions = particlesRef.current.geometry.attributes.position;
      const velocities = particlesRef.current.geometry.attributes
        .velocity as THREE.BufferAttribute;

      for (let i = 0; i < positions.count; i++) {
        const i3 = i * 3;
        positions.array[i3] += velocities.array[i3] * delta;
        positions.array[i3 + 1] += velocities.array[i3 + 1] * delta;
        positions.array[i3 + 2] += velocities.array[i3 + 2] * delta;
      }

      positions.needsUpdate = true;

      const material = particlesRef.current.material as THREE.PointsMaterial;
      material.opacity = Math.max(0, 1 - t / 3);
    }

    // Call onComplete after animation finishes
    if (t > 3 && !hasCompleted.current) {
      hasCompleted.current = true;
      onComplete?.();
    }
  });

  // Calculate normal direction for orientation
  const normal = new THREE.Vector3(...position).normalize();

  return (
    <group position={position}>
      {/* Fireball sphere */}
      <mesh ref={fireballRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial
          color="#ff4400"
          transparent
          opacity={1}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Particle burst */}
      <points ref={particlesRef} geometry={particleGeometry}>
        <pointsMaterial
          size={0.03}
          color="#ffaa00"
          transparent
          opacity={1}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Crater marker (permanent) */}
      {animationTime > 1 && (
        <mesh position={[normal.x * 0.01, normal.y * 0.01, normal.z * 0.01]}>
          <circleGeometry args={[0.15, 32]} />
          <meshBasicMaterial
            color="#ff0000"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
