import React from 'react';
import { motion } from 'framer-motion';

interface AttackingZonesProps {
  teamName: string;
  color: string; // Hex color for the team, e.g., "#DA291C"
  zones: {
    left: number;
    center: number;
    right: number;
  };
}

export default function AttackingZones({ teamName, color, zones }: AttackingZonesProps) {
  // We calculate opacity based on the zone value. 
  // Assuming values are percentages (0-100), max opacity could be ~0.8.
  const getOpacity = (val: number) => {
    return Math.min(Math.max((val / 100) * 0.9, 0.1), 0.9);
  };

  return (
    <div className="flex flex-col items-center">
      <h5 className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-3">
        {teamName} Attack
      </h5>
      <div className="relative w-full max-w-[200px] aspect-[2/3] bg-[#151A22] border-2 border-white/20 rounded-md overflow-hidden shadow-lg">
        {/* Pitch Markings (CSS Drawn) */}
        
        {/* Center Line */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/20 -translate-y-1/2"></div>
        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 w-16 h-16 border-2 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Penalty Areas */}
        <div className="absolute top-0 left-1/2 w-24 h-12 border-2 border-t-0 border-white/20 -translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-24 h-12 border-2 border-b-0 border-white/20 -translate-x-1/2"></div>
        
        {/* 6-Yard Boxes */}
        <div className="absolute top-0 left-1/2 w-10 h-4 border-2 border-t-0 border-white/20 -translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-10 h-4 border-2 border-b-0 border-white/20 -translate-x-1/2"></div>
        
        {/* Zone Overlays (Vertical layout because pitch is vertical) */}
        {/* We assume attacking upwards to the top goal */}
        <div className="absolute inset-0 flex flex-row">
          {/* Left Wing */}
          <div className="flex-1 flex flex-col justify-end relative h-full">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: getOpacity(zones.left) }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
              style={{ background: `linear-gradient(to top, transparent, ${color})` }}
            />
            <div className="absolute top-1/4 w-full text-center text-white font-bold text-xs drop-shadow-md z-10">
              {zones.left}%
            </div>
          </div>
          
          {/* Center */}
          <div className="flex-1 flex flex-col justify-end border-l border-r border-white/10 relative h-full">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: getOpacity(zones.center) }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
              style={{ background: `linear-gradient(to top, transparent, ${color})` }}
            />
            <div className="absolute top-1/4 w-full text-center text-white font-bold text-xs drop-shadow-md z-10">
              {zones.center}%
            </div>
          </div>
          
          {/* Right Wing */}
          <div className="flex-1 flex flex-col justify-end relative h-full">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: getOpacity(zones.right) }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
              style={{ background: `linear-gradient(to top, transparent, ${color})` }}
            />
            <div className="absolute top-1/4 w-full text-center text-white font-bold text-xs drop-shadow-md z-10">
              {zones.right}%
            </div>
          </div>
        </div>
        
        {/* Attacking Direction Arrow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 opacity-30 text-white flex flex-col items-center pointer-events-none">
          <span className="text-xl">↑</span>
          <span className="text-[8px] uppercase tracking-widest mt-1">Attack</span>
        </div>
      </div>
    </div>
  );
}
