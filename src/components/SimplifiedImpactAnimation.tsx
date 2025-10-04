"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NeoSummary } from "@/types";
import { latLonToVector3 } from "@/lib/physics";

interface SimplifiedImpactAnimationProps {
  asteroid: NeoSummary;
  impactPoint: { lat: number; lon: number };
  startPosition: [number, number, number];
  onComplete: () => void;
}

/**
 * Simplified Impact Animation
 * - Asteroid flies straight to Earth with meteor trail
 * - Camera stays stationary
 * - Expanding fire circle on impact
 * - Clean and production-ready
 */
export default function SimplifiedImpactAnimation({
  asteroid,
  impactPoint,
  startPosition,
  onComplete,
}: SimplifiedImpactAnimationProps) {
  const asteroidRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Points>(null);
  const fireCircleRef = useRef<THREE.Mesh>(null);
  const ashCloudRef = useRef<THREE.Mesh>(null);

  const [phase, setPhase] = useState<"flight" | "impact" | "complete">(
    "flight"
  );
  const progress = useRef(0);
  const trailPoints = useRef<THREE.Vector3[]>([]);

  // Impact position on Earth surface
  const impactPosition = latLonToVector3(impactPoint.lat, impactPoint.lon, 2);
  const impactVec = new THREE.Vector3(...impactPosition);

  // Simple linear path
  const startVec = new THREE.Vector3(...startPosition);

  // Use normalized size for impact animation
  const normalizedSize = useMemo(() => {
    const avgDiameter = asteroid.estDiameterMeters.avg;
    // Same normalization as Asteroid3DModel
    const minVisualSize = 0.3;
    const maxVisualSize = 1.2;
    const minDiameter = 10;
    const maxDiameter = 5000;
    const clampedDiameter = Math.max(
      minDiameter,
      Math.min(maxDiameter, avgDiameter)
    );
    const logMin = Math.log(minDiameter);
    const logMax = Math.log(maxDiameter);
    const logValue = Math.log(clampedDiameter);
    const normalizedValue = (logValue - logMin) / (logMax - logMin);
    return minVisualSize + normalizedValue * (maxVisualSize - minVisualSize);
  }, [asteroid]);

  // Asteroid geometry - simple sphere with normalized size
  const asteroidGeometry = new THREE.IcosahedronGeometry(
    normalizedSize * 0.5,
    3
  );
  const asteroidMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.95,
    metalness: 0.05,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });

  // Trail particles - only show when heating up
  const trailGeometry = new THREE.BufferGeometry();
  const trailMaterial = new THREE.PointsMaterial({
    color: 0xff6600,
    size: 0.12,
    transparent: true,
    opacity: 0, // Start invisible
    blending: THREE.AdditiveBlending,
  });

  // Fire circle (expanding on surface)
  const fireGeometry = new THREE.RingGeometry(0.01, 0.1, 32);
  const fireMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4400,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  // Ash cloud
  const ashGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const ashMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333,
    transparent: true,
    opacity: 0,
    blending: THREE.NormalBlending,
  });

  useFrame((_, delta) => {
    if (phase === "flight") {
      // Update progress - slower, more artistic (4 seconds)
      progress.current += delta * 0.25;

      if (progress.current >= 1) {
        setPhase("impact");
        progress.current = 0;
        return;
      }

      // Linear interpolation from start to impact
      const currentPos = new THREE.Vector3().lerpVectors(
        startVec,
        impactVec,
        progress.current
      );

      if (asteroidRef.current) {
        asteroidRef.current.position.copy(currentPos);

        // Start glowing and showing trail only after halfway
        if (progress.current > 0.5) {
          const heatProgress = (progress.current - 0.5) * 2; // 0 to 1

          // Change to orange and start emissive glow
          const mat = asteroidRef.current
            .material as THREE.MeshStandardMaterial;
          mat.emissive.setHex(0xff4400);
          mat.emissiveIntensity = Math.pow(heatProgress, 1.5) * 2.5;

          // Lerp color from grey to orange-grey
          const grey = new THREE.Color(0x555555);
          const orangeGrey = new THREE.Color(0x886644);
          mat.color.lerpColors(grey, orangeGrey, heatProgress);
        }

        // Subtle rotation
        asteroidRef.current.rotation.x += delta * 0.5;
        asteroidRef.current.rotation.y += delta * 0.3;
        asteroidRef.current.rotation.z += delta * 0.2;
      }

      // Trail only after halfway
      if (progress.current > 0.5) {
        trailPoints.current.push(currentPos.clone());
        if (trailPoints.current.length > 50) {
          trailPoints.current.shift();
        }

        if (trailRef.current) {
          if (trailPoints.current.length > 1) {
            trailGeometry.setFromPoints(trailPoints.current);
            trailGeometry.attributes.position.needsUpdate = true;
          }

          // Fade in trail
          const heatProgress = (progress.current - 0.5) * 2;
          (trailRef.current.material as THREE.PointsMaterial).opacity =
            Math.min(0.9, heatProgress * 1.5);
        }
      }
    } else if (phase === "impact") {
      // Impact expansion
      progress.current += delta * 0.8; // 1.25 second impact

      if (progress.current >= 1) {
        setPhase("complete");
        onComplete();
        return;
      }

      // Hide asteroid
      if (asteroidRef.current) {
        asteroidRef.current.visible = false;
      }

      // Expand fire circle
      if (fireCircleRef.current) {
        fireCircleRef.current.position.copy(impactVec);

        // Orient to surface normal
        const normal = impactVec.clone().normalize();
        fireCircleRef.current.lookAt(normal.multiplyScalar(10));

        // Expand
        const scale = Math.pow(progress.current, 0.6) * 2;
        fireCircleRef.current.scale.set(scale, scale, 1);

        // Fade
        (fireCircleRef.current.material as THREE.MeshBasicMaterial).opacity =
          Math.max(0, 0.8 - progress.current);
      }

      // Ash cloud
      if (ashCloudRef.current) {
        ashCloudRef.current.position.copy(impactVec);
        const ashScale = progress.current * 1.5;
        ashCloudRef.current.scale.setScalar(ashScale);

        (ashCloudRef.current.material as THREE.MeshBasicMaterial).opacity =
          Math.min(0.6, progress.current) * (1 - progress.current * 0.5);
      }

      // Fade trail
      if (trailRef.current) {
        (trailRef.current.material as THREE.PointsMaterial).opacity = Math.max(
          0,
          0.9 - progress.current * 2
        );
      }
    }
  });

  if (phase === "complete") return null;

  return (
    <group>
      {/* Asteroid */}
      <mesh
        ref={asteroidRef}
        geometry={asteroidGeometry}
        material={asteroidMaterial}
      />

      {/* Trail */}
      <points
        ref={trailRef}
        geometry={trailGeometry}
        material={trailMaterial}
      />

      {/* Fire circle */}
      <mesh
        ref={fireCircleRef}
        geometry={fireGeometry}
        material={fireMaterial}
      />

      {/* Ash cloud */}
      <mesh ref={ashCloudRef} geometry={ashGeometry} material={ashMaterial} />
    </group>
  );
}
