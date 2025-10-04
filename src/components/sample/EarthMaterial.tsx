import * as THREE from "three";
import { useLoader } from "@react-three/fiber";

export const EarthMaterial = () => {
  // Load all textures in one call to prevent memory issues
  const [dayMap, nightMap, specMap, cloudsMap] = useLoader(
    THREE.TextureLoader,
    [
      "/texture/2k_earth_daymap.jpg",
      "/texture/2k_earth_nightmap.jpg",
      "/texture/02_earthspec1k.jpg",
      "/texture/2k_earth_clouds.jpg",
    ]
  );

  // Fixed light direction from the sun (positive X direction)
  const lightDirection = new THREE.Vector3(1, 0, 0);

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
          
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform sampler2D dayTexture;
          uniform sampler2D nightTexture;
          uniform vec3 lightDirection;
          
          varying vec3 vNormal;
          varying vec2 vUv;

          void main() {
            // Calculate light intensity based on normal and light direction
            float intensity = dot(normalize(vNormal), normalize(lightDirection));
            intensity = clamp(intensity, 0.0, 1.0);

            vec4 dayColor = texture2D(dayTexture, vUv);
            vec4 nightColor = texture2D(nightTexture, vUv);

            // Smooth transition between day and night with twilight zone
            float mixFactor = smoothstep(-0.1, 0.2, intensity);
            gl_FragColor = mix(nightColor, dayColor, mixFactor);
          }
        `}
      />
    ),
    cloudsMap,
  };
};
