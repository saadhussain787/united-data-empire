'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Bebas_Neue } from 'next/font/google';

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export default function FeaturedPlayerCard({ player }: { player: any }) {
  const metadata = (player.metadata as any) || {};
  const jersey = metadata.jersey || '-';
  const positionName = metadata.position || player.position || 'Player';
  
  // Get up to 2 initials safely
  const initials = player.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Link
        href={`/players/${player.espnId || player.id}`}
        className="block aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-[#2A313C] hover:border-[#D4AF37] transition-colors group"
      >
        {/* Top Half: Deep Carbon to Action Red Gradient */}
        <div className="h-3/5 bg-gradient-to-b from-[#0B0E14] to-[#DA291C] flex items-center justify-center relative overflow-hidden">
           {/* Subtle glow / overlay */}
           <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
           <span className={`${bebas.className} text-7xl md:text-8xl text-[#D4AF37] drop-shadow-lg z-10 tracking-widest`}>
             {initials}
           </span>
        </div>
        
        {/* Bottom Half: Solid Deep Carbon */}
        <div className="h-2/5 bg-[#151A22] p-4 flex flex-col justify-center items-center text-center relative border-t border-[#DA291C]/30">
          
          {/* Centered Floating Jersey Number */}
          <div className={`${bebas.className} absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0B0E14] text-[#D4AF37] px-3 py-0.5 rounded border border-[#2A313C] text-xl shadow-lg`}>
            #{jersey}
          </div>
          
          <div className="mt-4 w-full">
            <h3 className="font-bold text-sm md:text-base text-white group-hover:text-[#D4AF37] transition-colors truncate w-full">
              {player.name}
            </h3>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest mt-1 font-bold truncate w-full">
              {positionName}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
