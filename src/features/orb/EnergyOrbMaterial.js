import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";

const EnergyOrbMaterial = shaderMaterial(
  {
    uTime: 0,
    uIntensity: 1.3,
  },

  // Vertex
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,

  // Fragment
  `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;

  float ring(vec2 uv, float r, float w) {
    float d = abs(length(uv) - r);
    return smoothstep(w, 0.0, d);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv - 0.5;
    float t = uTime * 0.35;

    float glow = 0.0;

    glow += ring(uv, 0.28 + sin(t) * 0.008, 0.02);

    for (int i = 0; i < 4; i++) {
      float a = t + float(i) * 1.57;
      vec2 offset = vec2(cos(a), sin(a)) * 0.025;
      glow += ring(uv + offset, 0.24, 0.018);
    }

    float noise = hash(uv * 10.0 + t);
    glow += ring(uv, 0.20 + noise * 0.03, 0.03);

    vec3 color = vec3(1.0) * glow * uIntensity;

    gl_FragColor = vec4(color, glow);
  }
  `
);

extend({ EnergyOrbMaterial });

export default EnergyOrbMaterial;
