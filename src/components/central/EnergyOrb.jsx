import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { useRef, useMemo } from "react";

export default function EnergyOrb() {
  const shell = useRef();

  /* ===============================
     INNER ENERGY — REFRACTED FLOW
  =============================== */
  const coreMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec3 vPos;
          varying vec3 vNormal;

          void main() {
            vPos = position;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec3 vPos;
          varying vec3 vNormal;

          float band(float x, float c, float w) {
            return smoothstep(c - w, c, x) * (1.0 - smoothstep(c, c + w, x));
          }

          void main() {
            float r = length(vPos);

            /* --- INTERNAL REFRACTION LENSING --- */
            float lens = smoothstep(0.55, 0.95, r);
            vec3 refractNormal = normalize(vNormal + vPos * 0.35 * lens);

            float a1 = atan(refractNormal.y, refractNormal.x);
            float a2 = atan(refractNormal.z, refractNormal.x);

            float t = uTime * 0.22;

            float flow =
              band(sin(a1 + t), 0.0, 0.38) +
              band(cos(a2 - t * 0.75), 0.0, 0.38);

            float depthFade = smoothstep(0.25, 0.9, r);
            float lensFade = smoothstep(0.4, 0.8, r);

            float alpha = flow * depthFade * lensFade * 0.26;

            gl_FragColor = vec4(vec3(1.0), alpha);
          }
        `,
      }),
    []
  );

  /* ===============================
     CAUSTIC ARC HIGHLIGHTS
  =============================== */
  const arcMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vView;

          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vView = normalize(-mvPos.xyz);
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec3 vNormal;
          varying vec3 vView;

          float arc(float x, float c, float w) {
            return smoothstep(c - w, c, x) * (1.0 - smoothstep(c, c + w, x));
          }

          void main() {
            float a = atan(vNormal.y, vNormal.x);
            float t = uTime * 0.12;

            float arcs =
              arc(a + sin(t) * 0.35, 1.25, 0.32) +
              arc(a - cos(t * 0.8) * 0.25, -1.1, 0.28);

            float fresnel = 1.0 - dot(vNormal, vView);
            fresnel = clamp(fresnel, 0.0, 1.0);

            float bloomCore = pow(fresnel, 3.2);
            float bloomHalo = pow(fresnel, 6.8);

            float alpha = arcs * (bloomCore * 0.55 + bloomHalo * 0.9);

            gl_FragColor = vec4(vec3(1.0), alpha);
          }
        `,
      }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    coreMaterial.uniforms.uTime.value = t;
    arcMaterial.uniforms.uTime.value = t;

    shell.current.rotation.y += 0.00018;
  });

  return (
    <group scale={0.72}>
      {/* Inner refracted energy */}
      <mesh>
        <sphereGeometry args={[0.82, 96, 96]} />
        <primitive object={coreMaterial} attach="material" />
      </mesh>

      {/* Arc caustics */}
      <mesh>
        <sphereGeometry args={[0.97, 128, 128]} />
        <primitive object={arcMaterial} attach="material" />
      </mesh>

      {/* Glass shell */}
      <mesh ref={shell}>
        <sphereGeometry args={[1, 128, 128]} />
        <MeshTransmissionMaterial
          transmission={1}
          thickness={0.78}
          roughness={0.02}
          ior={1.48}
          chromaticAberration={0.0}
          anisotropicBlur={0.0}
          distortion={0}
          backside
        />
      </mesh>
    </group>
  );
}
