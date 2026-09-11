'use client';

import React, { useRef, useState, MouseEvent } from 'react';

interface Trophy {
  id: number;
  competitionName: string;
  totalCount: number;
  winningSeasons: string[];
  trophyImage?: string;
}

interface TrophyPedestalProps {
  trophy: Trophy;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function TrophyPedestal({ trophy, isExpanded, onToggle }: TrophyPedestalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate cursor position relative to the card
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation (-10 to 10 degrees based on cursor position)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -12; // tilt up/down
    const rotateY = ((x - centerX) / centerX) * 12; // tilt left/right
    
    setRotate({ x: rotateX, y: rotateY });
    
    // Calculate glare position
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlare({ x: glareX, y: glareY, opacity: 0.15 });
  };

  const handleMouseLeave = () => {
    // Reset to default resting state
    setRotate({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <div className="relative perspective-[1200px] w-full">
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onToggle}
        className="relative overflow-hidden cursor-pointer transition-all duration-300 ease-out h-full"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1, 1, 1)`,
          transformStyle: 'preserve-3d',
          transition: rotate.x === 0 && rotate.y === 0 ? 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
        }}
      >
        {/* Transparent Hitbox instead of a dark card */}
        <div className="absolute inset-0 z-0 group"></div>
        
        {/* The 2.5D Glass Shelf */}
        <div 
          className="absolute bottom-24 left-4 right-4 h-12 bg-[rgba(255,255,255,0.03)] backdrop-blur-md rounded-[100%] border-t border-white/20 border-b border-black/60 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.8),0_8px_10px_-6px_rgba(0,0,0,0.8)] z-10 transition-colors duration-300 group-hover:bg-[rgba(227,176,68,0.05)] group-hover:border-[#E3B044]/30"
          style={{ transform: 'translateZ(10px)' }}
        ></div>

        {/* Dynamic Glare Effect on the Glass */}
        <div 
          className="absolute bottom-24 left-4 right-4 h-12 z-20 pointer-events-none rounded-[100%] transition-opacity duration-300 mix-blend-overlay"
          style={{
            opacity: glare.opacity * 2,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
            transform: 'translateZ(15px)'
          }}
        ></div>

        <div className="relative z-30 p-2 flex flex-col h-full transform-gpu" style={{ transform: 'translateZ(30px)' }}>
          {/* Win Count Badge - Floating Top Right */}
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm border border-[#E3B044]/40 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(227,176,68,0.3)]">
            <span className="text-[#E3B044] font-bold text-sm tracking-wide">{trophy.totalCount}x</span>
          </div>

          {/* The 3D Floating Trophy Asset (Sitting on the shelf) */}
          <div 
            className="h-[140px] w-full flex items-center justify-center mb-8 mt-12 relative"
            style={{ 
              transform: 'translateZ(60px)'
            }}
          >
            {trophy.trophyImage && (
              <img 
                src={trophy.trophyImage} 
                alt={trophy.competitionName} 
                className="h-full object-contain pointer-events-none" 
              />
            )}
            {/* Contact Shadow directly on the shelf */}
            <div className="absolute bottom-[-15px] w-24 h-4 bg-black/60 blur-md rounded-[100%] mx-auto"></div>
          </div>

          {/* Pedestal Info Plate (Engraved Plaque Look) */}
          <div 
            className="mt-auto pt-2 pb-4 px-4 relative bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 text-center mx-2" 
            style={{ transform: 'translateZ(20px)' }}
          >
            <h4 className="text-[#E3B044] font-bold text-lg mb-1 leading-tight drop-shadow-md">{trophy.competitionName}</h4>
            <p className="text-neutral-300 text-sm font-medium mb-3 drop-shadow-sm">
              {trophy.winningSeasons.length > 0 ? trophy.winningSeasons[0] : 'N/A'}
            </p>

            {/* Interactive Seasons Drawer Toggle */}
            <div className="flex items-center justify-center text-xs font-bold tracking-widest text-[#a8896c] group-hover:text-white transition-colors duration-200 uppercase cursor-pointer">
              {isExpanded ? 'Hide Archives' : 'Inspect Archives'}
              <svg 
                className={`ml-1 w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* The Expandable Winning Seasons Drawer (Outside the 3D card context to avoid clipping) */}
      <div 
        className={`w-full overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}
      >
        <div className="bg-[#13151b] border border-white/5 rounded-xl p-4 shadow-inner">
          <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
            {trophy.winningSeasons.map(season => (
              <span 
                key={season} 
                className="px-2.5 py-1 text-xs font-semibold text-neutral-400 bg-white/5 border border-white/5 rounded-md hover:text-[#E3B044] hover:border-[#E3B044]/30 transition-colors cursor-default"
              >
                {season}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
