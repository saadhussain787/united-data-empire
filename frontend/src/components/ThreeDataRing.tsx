lets "use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Mesh } from "three";
import { Float } from "@react-three/drei";

function DataRing() {
  const meshRef = useRef<Mesh>(null!);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef}>
        <torusGeometry args={[3, 0.05, 16, 100]} />
        <meshStandardMaterial
          color="#D4AF37"
          emissive="#D4AF37"
          emissiveIntensity={0.5}
          wireframe={true}
          transparent={true}
          opacity={0.3}
        />
      </mesh>
    </Float>
  );
}

export default function ThreeDataRing() {
  return (
    <div className="absolute top-0 right-0 w-full h-[600px] z-0 pointer-events-none opacity-[0.15] overflow-hidden mix-blend-screen">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <DataRing />
      </Canvas>
    </div>
  );
}
