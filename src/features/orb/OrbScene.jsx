import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import EnergyOrb from "./EnergyOrb";

export default function OrbScene() {
  return (
    <div
      style={{
        width: "100%",
        height: "190px",
        margin: "20px 0",
        pointerEvents: "none",
      }}
    >
      <Canvas camera={{ position: [0, 0, 4], fov: 36 }}>
        <ambientLight intensity={0.25} />
        <directionalLight position={[4, 6, 6]} intensity={1.0} />

        <EnergyOrb />

        <Environment preset="studio" />
      </Canvas>
    </div>
  );
}
