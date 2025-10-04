"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface EarthProps {
  onGlobeClick: (lat: number, lon: number) => void;
}

export default function Earth({ onGlobeClick }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const { raycaster, camera, gl } = useThree();

  // Load all textures with useMemo to prevent hot reload issues
  const textures = useMemo(() => {
    const textureLoader = new THREE.TextureLoader();

    // Earth Day Map
    const dayMap = textureLoader.load("/texture/2k_earth_daymap.jpg");
    dayMap.colorSpace = THREE.SRGBColorSpace;
    dayMap.anisotropy = 16;

    // Earth Night Map
    const nightMap = textureLoader.load("/texture/2k_earth_nightmap.jpg");
    nightMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.anisotropy = 16;

    // Earth Specular Map (for ocean reflections)
    const specularMap = textureLoader.load("/texture/02_earthspec1k.jpg");
    specularMap.anisotropy = 16;

    // Cloud Map
    const cloudsMap = textureLoader.load("/texture/2k_earth_clouds.jpg");
    cloudsMap.colorSpace = THREE.SRGBColorSpace;
    cloudsMap.anisotropy = 16;

    return { dayMap, nightMap, specularMap, cloudsMap };
  }, []); // Empty dependency array - textures load once and never reload

  // Create materials with useMemo
  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: textures.dayMap },
        nightTexture: { value: textures.nightMap },
        specularMap: { value: textures.specularMap },
        sunDirection: { value: new THREE.Vector3(5, 3, 5).normalize() },
        atmosphereColor: { value: new THREE.Color(0.3, 0.6, 1.0) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform sampler2D specularMap;
        uniform vec3 sunDirection;
        uniform vec3 atmosphereColor;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          // Sample textures
          vec3 dayColor = texture2D(dayTexture, vUv).rgb;
          vec3 nightColor = texture2D(nightTexture, vUv).rgb;
          float specular = texture2D(specularMap, vUv).r;
          
          // Calculate lighting
          vec3 normal = normalize(vNormal);
          float sunDot = dot(normal, sunDirection);
          
          // Day/night transition (smooth)
          float dayNightMix = smoothstep(-0.1, 0.1, sunDot);
          vec3 baseColor = mix(nightColor * 1.5, dayColor, dayNightMix);
          
          // Specular highlights on water (oceans)
          vec3 viewDir = normalize(-vPosition);
          vec3 reflectDir = reflect(-sunDirection, normal);
          float specAmount = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
          float oceanSpecular = specular * specAmount * dayNightMix;
          
          // Add specular to oceans
          baseColor += vec3(oceanSpecular * 0.8);
          
          // Atmospheric scattering (rim lighting)
          float rimPower = 1.0 - max(0.0, dot(viewDir, normal));
          vec3 rim = atmosphereColor * pow(rimPower, 3.0) * 0.5;
          
          // Final color
          gl_FragColor = vec4(baseColor + rim, 1.0);
        }
      `,
    });
  }, [textures]);

  const cloudsMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      map: textures.cloudsMap,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [textures]);

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        atmosphereColor: { value: new THREE.Color(0.3, 0.6, 1.0) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 atmosphereColor;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float intensity = pow(1.0 - dot(viewDir, vNormal), 4.0);
          gl_FragColor = vec4(atmosphereColor, 1.0) * intensity;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
  }, []);

  // Rotate Earth and clouds slowly
  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05; // Slow rotation
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.06; // Clouds rotate slightly faster
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

      // Convert 3D point to lat/lon
      const radius = 2;
      const lat = Math.asin(point.y / radius) * (180 / Math.PI);
      const lon = Math.atan2(point.x, point.z) * (180 / Math.PI);

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
      </mesh>

      {/* Cloud Layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.01, 64, 64]} />
        <primitive object={cloudsMaterial} attach="material" />
      </mesh>

      {/* Atmosphere Glow */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[2.15, 64, 64]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>
    </group>
  );
}
