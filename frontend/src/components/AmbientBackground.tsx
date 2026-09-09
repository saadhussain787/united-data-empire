"use client";

import { motion } from "framer-motion";

export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 bg-[#050508] overflow-hidden pointer-events-none">
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

      {/* Left Flank Crest (Red Aura Pillar) */}
      <motion.div
        className="absolute top-[22%] -left-12 lg:left-2 w-[42vw] h-[42vw] max-w-[520px] pointer-events-none select-none opacity-[0.03]"
        style={{ filter: "grayscale(100%) brightness(140%)" }}
        animate={{ y: [0, 14, 0], scale: [1, 1.015, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      >
        <img 
          src="https://a.espncdn.com/i/teamlogos/soccer/500/360.png" 
          alt="Left Crest Watermark" 
          className="w-full h-full object-contain"
        />
      </motion.div>

      {/* Right Flank Crest (Gold Aura Pillar) */}
      <motion.div
        className="absolute bottom-[18%] -right-12 lg:right-2 w-[42vw] h-[42vw] max-w-[520px] pointer-events-none select-none opacity-[0.035]"
        style={{ filter: "grayscale(100%) brightness(160%)" }}
        animate={{ y: [0, -14, 0], scale: [1, 1.015, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <img 
          src="https://a.espncdn.com/i/teamlogos/soccer/500/360.png" 
          alt="Right Crest Watermark" 
          className="w-full h-full object-contain"
        />
      </motion.div>

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
