import * as THREE from "three";
import { useLoader } from "@react-three/fiber";

export const EarthMaterial = () => {
  // Load all textures in one call to prevent memory issues
  const [dayMap, nightMap, , cloudsMap] = useLoader(THREE.TextureLoader, [
    "/texture/2k_earth_daymap.jpg",
    "/texture/2k_earth_nightmap.jpg",
    // "/texture/02_earthspec1k.jpg",
    "/texture/2k_earth_clouds.jpg",
  ]);

  // Angled light direction for slanted day/night terminator
  const lightDirection = new THREE.Vector3(10, 3, 0).normalize();

  return {
    earthMaterial: (
      <shaderMaterial
        uniforms={{
          dayTexture: { value: dayMap },
          nightTexture: { value: nightMap },
          lightDirection: { value: lightDirection },
        }}
        vertexShader={`
          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vViewPosition;
          
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform sampler2D dayTexture;
          uniform sampler2D nightTexture;
          uniform vec3 lightDirection;
          
          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vViewPosition;

          void main() {
            // Calculate light intensity based on normal and light direction
            float intensity = dot(normalize(vNormal), normalize(lightDirection));
            intensity = clamp(intensity, 0.0, 1.0);

            vec4 dayColor = texture2D(dayTexture, vUv);
            vec4 nightColor = texture2D(nightTexture, vUv);

            // Smooth transition between day and night with twilight zone
            float mixFactor = smoothstep(-0.1, 0.2, intensity);
            vec4 earthColor = mix(nightColor, dayColor, mixFactor);

            // Fresnel effect for atmospheric glow on edges
            vec3 viewDirection = normalize(vViewPosition);
            float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
            fresnel = pow(fresnel, 2.5);
            
            // Add subtle blue atmospheric glow on limb
            vec3 atmosphereColor = vec3(0.3, 0.6, 1.0); // Light blue
            vec3 finalColor = earthColor.rgb + (atmosphereColor * fresnel * 0.15);
            
            gl_FragColor = vec4(finalColor, 1.0);
          }
        `}
      />
    ),
    cloudsMap,
  };
};
