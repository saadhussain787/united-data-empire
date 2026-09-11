"use client";

import { motion } from "framer-motion";
import ThreeBackgroundBadges from "./ThreeBackgroundBadges";

const PARTICLES = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  left: `${5 + (i * 13) % 90}%`, // Pseudo-random horizontal spread
  duration: 15 + (i % 10) * 3,    // 15s to 45s
  delay: (i % 7) * 2,             // 0 to 14s delay
  size: 1 + (i % 3),              // 1px to 3px
}));

export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Orb 1: Manchester United Red Glow */}
      <motion.div
        className="absolute -top-32 -left-32 w-[55vw] h-[55vw] rounded-full blur-[90px]"
        style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.25) 0%, rgba(185,28,28,0.1) 60%, transparent 80%)' }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb 2: Legend Gold Glow */}
      <motion.div
        className="absolute -bottom-32 -right-32 w-[60vw] h-[60vw] rounded-full blur-[90px]"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.25) 0%, rgba(184,134,11,0.1) 60%, transparent 80%)' }}
        animate={{ x: [0, -50, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Interactive 3D WebGL Crests */}
      <ThreeBackgroundBadges />

      {/* Floating Embers / Particles */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute bottom-[-10px] rounded-full bg-[#D4AF37]"
            style={{ 
              left: p.left, 
              width: p.size, 
              height: p.size,
              boxShadow: `0 0 ${p.size * 3}px rgba(212,175,55,0.6)`
            }}
            animate={{
              y: ["0vh", "-110vh"],
              opacity: [0, 0.4, 0.8, 0.4, 0],
              x: ["0px", `${(p.id % 2 === 0 ? 1 : -1) * 30}px`, "0px"] // Gentle sway
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Data Matrix Dot-Grid */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />

      {/* Cinematic Grain Texture Overlay */}
      <div 
        className="absolute inset-0 z-10 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      />

      {/* Subtle Vignette */}
      <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_100px_rgba(5,5,8,0.8)]" />
    </div>
  );
}
