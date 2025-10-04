"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { NeoSummary } from "@/types";
import { latLonToVector3 } from "@/lib/physics";

interface AsteroidImpactAnimationProps {
  asteroid: NeoSummary;
  impactPoint: { lat: number; lon: number };
  startPosition: [number, number, number];
  onComplete: () => void;
}

/**
 * Asteroid Impact Animation Component
 * Handles the cinematic flight from start position to Earth surface
 * with trail effect, heat glow, and impact explosion
 */
export default function AsteroidImpactAnimation({
  asteroid,
  impactPoint,
  startPosition,
  onComplete,
}: AsteroidImpactAnimationProps) {
  const { camera } = useThree();
  const asteroidRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Points>(null);
  const fireballRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);

  const [phase, setPhase] = useState<"flight" | "impact" | "complete">(
    "flight"
  );
  const progress = useRef(0);
  const trailPoints = useRef<THREE.Vector3[]>([]);

  // Calculate impact position on Earth surface
  const impactPosition = latLonToVector3(impactPoint.lat, impactPoint.lon, 2);

  // Create Bezier curve for asteroid trajectory
  const trajectory = useRef<THREE.CubicBezierCurve3 | null>(null);

  useEffect(() => {
    // Create beautiful arc trajectory
    const start = new THREE.Vector3(...startPosition);
    const end = new THREE.Vector3(...impactPosition);

    // Control points for dramatic arc
    const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
    const cp1 = start
      .clone()
      .lerp(midPoint, 0.33)
      .add(new THREE.Vector3(0, 3, 0));
    const cp2 = midPoint
      .clone()
      .lerp(end, 0.67)
      .add(new THREE.Vector3(0, 1, 0));

    trajectory.current = new THREE.CubicBezierCurve3(start, cp1, cp2, end);
  }, [startPosition, impactPosition]);

  // Asteroid geometry and material
  const asteroidGeometry = new THREE.IcosahedronGeometry(0.3, 2);
  const asteroidMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.9,
    metalness: 0.2,
    emissive: 0xff4400,
    emissiveIntensity: 0,
  });

  // Trail particle system
  const trailGeometry = new THREE.BufferGeometry();
  const trailMaterial = new THREE.PointsMaterial({
    color: 0xff6600,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
  });

  // Fireball geometry - larger expanding sphere
  const fireballGeometry = new THREE.SphereGeometry(1, 64, 64);
  const fireballMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color1: { value: new THREE.Color(0xff4400) },
      color2: { value: new THREE.Color(0xff8800) },
      color3: { value: new THREE.Color(0x000000) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 color3;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        float dist = length(vPosition);
        float t = smoothstep(0.0, 1.0, time);
        
        // Gradient from center to edge
        vec3 color = mix(color1, color2, dist);
        color = mix(color, color3, t);
        
        float alpha = (1.0 - t) * (1.0 - dist * 0.5);
        
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });

  // Flash overlay
  const flashGeometry = new THREE.SphereGeometry(0.05, 16, 16);
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
  });

  useFrame((_, delta) => {
    if (!trajectory.current) return;
    const curve = trajectory.current;

    if (phase === "flight") {
      // Update flight progress
      progress.current += delta * 0.3; // 3.3 second flight time

      if (progress.current >= 1) {
        setPhase("impact");
        progress.current = 0;
        return;
      }

      // Update asteroid position along curve
      const position = curve.getPoint(progress.current);
      if (asteroidRef.current) {
        asteroidRef.current.position.copy(position);

        // Increase heat glow as it approaches
        const heatIntensity = Math.pow(progress.current, 2) * 2;
        (
          asteroidRef.current.material as THREE.MeshStandardMaterial
        ).emissiveIntensity = heatIntensity;

        // Rotate asteroid
        asteroidRef.current.rotation.x += delta * 2;
        asteroidRef.current.rotation.y += delta * 1.5;

        // Camera follows asteroid with offset
        const cameraOffset = new THREE.Vector3(5, 3, 5);
        const targetCameraPos = position.clone().add(cameraOffset);
        camera.position.lerp(targetCameraPos, 0.05);

        // Look at point between asteroid and Earth
        const lookAtTarget = new THREE.Vector3().lerpVectors(
          position,
          new THREE.Vector3(...impactPosition),
          0.5
        );
        camera.lookAt(lookAtTarget);
      }

      // Add trail point
      trailPoints.current.push(position.clone());
      if (trailPoints.current.length > 50) {
        trailPoints.current.shift(); // Limit trail length
      }

      // Update trail geometry
      if (trailRef.current) {
        trailGeometry.setFromPoints(trailPoints.current);
        trailGeometry.attributes.position.needsUpdate = true;
      }
    } else if (phase === "impact") {
      // Impact explosion animation
      progress.current += delta * 2; // 0.5 second impact

      if (progress.current >= 1) {
        setPhase("complete");
        onComplete();
        return;
      }

      // Hide asteroid
      if (asteroidRef.current) {
        asteroidRef.current.visible = false;
      }

      // White flash
      if (flashRef.current && progress.current < 0.2) {
        flashRef.current.position.set(...impactPosition);
        flashRef.current.scale.setScalar(10 * (1 - progress.current / 0.2));
        (flashRef.current.material as THREE.MeshBasicMaterial).opacity =
          1 - progress.current / 0.2;
      } else if (flashRef.current) {
        flashRef.current.visible = false;
      }

      // Expanding fireball - scale up to 4x Earth radius
      if (fireballRef.current) {
        fireballRef.current.position.set(...impactPosition);
        // Exponential growth for more drama
        const scale = Math.pow(progress.current, 0.7) * 4;
        fireballRef.current.scale.setScalar(scale);

        // Update shader time
        const material = fireballRef.current.material as THREE.ShaderMaterial;
        material.uniforms.time.value = progress.current;
      }

      // Fade out trail
      if (trailRef.current) {
        (trailRef.current.material as THREE.PointsMaterial).opacity = Math.max(
          0,
          0.8 - progress.current
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

      {/* Fireball */}
      <mesh
        ref={fireballRef}
        geometry={fireballGeometry}
        material={fireballMaterial}
      />

      {/* Flash */}
      <mesh ref={flashRef} geometry={flashGeometry} material={flashMaterial} />
    </group>
  );
}
