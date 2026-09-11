'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Global3DBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate mouse position relative to the center of the screen
      // Values will range from -1 to 1
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Max translation in pixels
  const offset = 20;

  return (
    <div className="fixed inset-0 w-full h-full -z-50 overflow-hidden bg-[#0B0E14] pointer-events-none">
      {/* 
        We make the image slightly larger than the viewport (e.g., scale-105) 
        so that when it translates, we don't see the edges of the image.
      */}
      <div 
        className="absolute inset-0 w-full h-full transition-transform duration-[400ms] ease-out"
        style={{
          transform: `translate(${mousePosition.x * -offset}px, ${mousePosition.y * -offset}px) scale(1.05)`,
        }}
      >
        <Image
          src="/hero/abstract.jpg"
          alt="Abstract Global Background"
          fill
          className="object-cover opacity-40" // Keep it dark and subtle
          priority
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60 mix-blend-multiply"></div>
        {/* Gritty Noise Overlay */}
        <div className="absolute inset-0 bg-noise opacity-[0.3] mix-blend-overlay"></div>
      </div>
    </div>
  );
}
