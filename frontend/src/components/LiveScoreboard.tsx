// FILE: frontend/src/components/LiveScoreboard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Bebas_Neue } from 'next/font/google';
import { createClient } from '@supabase/supabase-js';

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'] });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

interface LiveMatchData {
  id: number;
  homeTeamName: string;
  homeTeamLogo: string;
  awayTeamName: string;
  awayTeamLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  elapsed: number | null;
  competition: string;
}

interface LiveMatchProps {
  initialMatch?: LiveMatchData | null;
}

export default function LiveScoreboard({ initialMatch }: LiveMatchProps) {
  const [match, setMatch] = useState<LiveMatchData | null>(initialMatch ?? null);

  useEffect(() => {
    if (!supabase || !match?.id) return;

    const channel = supabase
      .channel(`match-${match.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Match',
          filter: `id=eq.${match.id}`,
        },
        (payload) => {
          setMatch((prev) => (prev ? { ...prev, ...(payload.new as LiveMatchData) } : null));
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [match?.id]);

  if (!match) {
    return (
      <div className="bg-[#151A22] border border-[#2A313C] rounded-xl p-6 text-center text-gray-400 text-sm">
        No active live fixture in progress.
      </div>
    );
  }

  const isLive = ['1H', 'HT', '2H', 'ET', 'P', 'LIVE'].includes(match.status);

  return (
    <div className="bg-[#151A22] border border-[#2A313C] rounded-xl p-6 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-[#2A313C] pb-3">
        <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
          {match.competition}
        </span>
        {isLive ? (
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
            <span className="text-red-500 text-xs font-black uppercase tracking-widest">
              LIVE {match.elapsed ? `${match.elapsed}'` : ''}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
            {match.status}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="flex items-center space-x-3 w-5/12 justify-start">
          <div className="w-10 h-10 relative flex-shrink-0">
            {match.homeTeamLogo && (
              <Image
                src={match.homeTeamLogo}
                alt={match.homeTeamName}
                fill
                className="object-contain"
                unoptimized
              />
            )}
          </div>
          <span className="font-bold text-sm md:text-base text-white truncate">
            {match.homeTeamName}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center px-4">
          <div className={`${bebas.className} text-3xl md:text-4xl text-white bg-[#0B0E14] px-4 py-1 rounded border border-[#7A0006]`}>
            {match.homeScore ?? 0} - {match.awayScore ?? 0}
          </div>
        </div>

        <div className="flex items-center space-x-3 w-5/12 justify-end text-right">
          <span className="font-bold text-sm md:text-base text-white truncate">
            {match.awayTeamName}
          </span>
          <div className="w-10 h-10 relative flex-shrink-0">
            {match.awayTeamLogo && (
              <Image
                src={match.awayTeamLogo}
                alt={match.awayTeamName}
                fill
                className="object-contain"
                unoptimized
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}