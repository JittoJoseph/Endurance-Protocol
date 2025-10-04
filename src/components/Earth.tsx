"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import ImpactMarker from "./ImpactMarker";

interface EarthProps {
  onGlobeClick: (lat: number, lon: number) => void;
  impactLocation: { lat: number; lon: number } | null;
}

export default function Earth({ onGlobeClick, impactLocation }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const { raycaster, camera, gl } = useThree();

  // Load all textures with useMemo to prevent hot reload issues
  const textures = useMemo(() => {
    const textureLoader = new THREE.TextureLoader();

    // Earth Day Map
    const dayMap = textureLoader.load("/texture/2k_earth_daymap.jpg");
    dayMap.colorSpace = THREE.SRGBColorSpace;
    dayMap.anisotropy = 16;
    dayMap.wrapS = THREE.RepeatWrapping;
    dayMap.wrapT = THREE.RepeatWrapping;

    // Earth Night Map
    const nightMap = textureLoader.load("/texture/2k_earth_nightmap.jpg");
    nightMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.anisotropy = 16;
    nightMap.wrapS = THREE.RepeatWrapping;
    nightMap.wrapT = THREE.RepeatWrapping;

    // Earth Specular Map (for ocean reflections)
    const specularMap = textureLoader.load("/texture/02_earthspec1k.jpg");
    specularMap.anisotropy = 16;
    specularMap.wrapS = THREE.RepeatWrapping;
    specularMap.wrapT = THREE.RepeatWrapping;

    // Cloud Map
    const cloudsMap = textureLoader.load("/texture/2k_earth_clouds.jpg");
    cloudsMap.colorSpace = THREE.SRGBColorSpace;
    cloudsMap.anisotropy = 16;
    cloudsMap.wrapS = THREE.RepeatWrapping;
    cloudsMap.wrapT = THREE.RepeatWrapping;

    return { dayMap, nightMap, specularMap, cloudsMap };
  }, []); // Empty dependency array - textures load once and never reload

  // Create materials with useMemo
  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: textures.dayMap },
        nightTexture: { value: textures.nightMap },
        specularMap: { value: textures.specularMap },
        sunDirection: { value: new THREE.Vector3(25, 3, 8).normalize() }, // Moved sun for more night side
        fresnelColor: { value: new THREE.Color(0.15, 0.35, 0.7) }, // Subtle blue fresnel
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform sampler2D specularMap;
        uniform vec3 sunDirection;
        uniform vec3 fresnelColor;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;

        void main() {
          // Sample textures with proper UV mapping
          vec3 dayColor = texture2D(dayTexture, vUv).rgb;
          vec3 nightColor = texture2D(nightTexture, vUv).rgb;
          float specular = texture2D(specularMap, vUv).r;

          // Calculate lighting
          vec3 normal = normalize(vNormal);
          float sunDot = dot(normal, sunDirection);

          // Day/night transition (smooth) - adjusted for more night side
          float dayNightMix = smoothstep(-0.2, 0.1, sunDot);
          vec3 baseColor = mix(nightColor * 2.0, dayColor, dayNightMix);

          // Specular highlights on water (oceans)
          vec3 viewDir = normalize(-vPosition);
          vec3 reflectDir = reflect(-sunDirection, normal);
          float specAmount = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
          float oceanSpecular = specular * specAmount * dayNightMix;

          // Add specular to oceans
          baseColor += vec3(oceanSpecular * 0.6);

          // Advanced Fresnel effect (both inside and outside)
          float fresnel = 1.0 - abs(dot(viewDir, normal));
          float fresnelInner = pow(fresnel, 1.2) * 0.25; // Inner glow
          float fresnelOuter = pow(fresnel, 2.5) * 0.35; // Outer rim

          // Combine fresnel effects
          vec3 fresnelGlow = fresnelColor * (fresnelInner + fresnelOuter);

          // Apply fresnel to both day and night sides
          baseColor += fresnelGlow;

          // Final color
          gl_FragColor = vec4(baseColor, 1.0);
        }
      `,
    });
  }, [textures]);

  const cloudsMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      map: textures.cloudsMap,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [textures]);

  // Rotate Earth and clouds slowly
  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05; // Slow rotation
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.09; // Clouds moderately faster
    }
  });

  // Handle click on globe
  const handleClick = (event: any) => {
    event.stopPropagation();

    if (!earthRef.current) return;

    const mouse = new THREE.Vector2(
      (event.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(event.clientY / gl.domElement.clientHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(earthRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const earthRotation = earthRef.current.rotation.y;

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

  return (
    <group>
      {/* Main Earth Sphere */}
      <mesh
        ref={earthRef}
        onClick={handleClick}
        onPointerOver={() => (gl.domElement.style.cursor = "pointer")}
        onPointerOut={() => (gl.domElement.style.cursor = "default")}
      >
        <sphereGeometry args={[2, 128, 128]} />
        <primitive object={earthMaterial} attach="material" />

        {/* Impact Marker - attached to Earth so it rotates with it */}
        {impactLocation && (
          <ImpactMarker
            lat={impactLocation.lat}
            lon={impactLocation.lon}
            radius={2}
            visible={true}
          />
        )}
      </mesh>

      {/* Cloud Layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.01, 64, 64]} />
        <primitive object={cloudsMaterial} attach="material" />
      </mesh>
    </group>
  );
}
