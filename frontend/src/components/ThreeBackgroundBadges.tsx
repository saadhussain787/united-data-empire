"use client";

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, Float } from "@react-three/drei";
import { Mesh } from "three";

function BadgeMesh({ position, textureUrl, rotationY, scale = 1, opacity = 0.05, tint = "#ffffff" }: any) {
  const meshRef = useRef<Mesh>(null!);
  const texture = useTexture(textureUrl);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle parallax based on mouse
      const targetX = (state.pointer.x * Math.PI) / 8;
      const targetY = (state.pointer.y * Math.PI) / 8;
      
      // Interpolate towards the target rotation for smooth movement
      meshRef.current.rotation.x += (targetY - meshRef.current.rotation.x) * 0.02;
      meshRef.current.rotation.y += (rotationY + targetX - meshRef.current.rotation.y) * 0.02;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={1}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial 
          map={texture} 
          transparent={true} 
          opacity={opacity}
          color={tint}
          depthWrite={false}
        />
      </mesh>
    </Float>
  );
}

export default function ThreeBackgroundBadges() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <Suspense fallback={null}>
          {/* Left Flank Badge */}
          <BadgeMesh 
            position={[-5, 2, -5]} 
            textureUrl="https://a.espncdn.com/i/teamlogos/soccer/500/360.png" 
            rotationY={0.1}
            scale={0.7}
            opacity={0.06}
            tint="#ff6b6b" // Brighter red tint
          />
          {/* Right Flank Badge */}
          <BadgeMesh 
            position={[5, -2, -5]} 
            textureUrl="https://a.espncdn.com/i/teamlogos/soccer/500/360.png" 
            rotationY={-0.1}
            scale={0.7}
            opacity={0.06}
            tint="#D4AF37" // Gold tint
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
