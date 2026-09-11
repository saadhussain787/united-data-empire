'use client';

import React, { useEffect, useState } from 'react';
import TrophyPedestal from '@/components/TrophyPedestal';

// Define the Trophy TypeScript interface matching the API route response
interface Trophy {
  id: number;
  competitionName: string;
  totalCount: number;
  winningSeasons: string[];
  trophyImage?: string;
}

export default function HistoryPage() {
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTrophyId, setExpandedTrophyId] = useState<number | null>(null);

  // Fetch data from the honours API route
  useEffect(() => {
    async function fetchTrophies() {
      try {
        const res = await fetch('/api/honours');
        const json = await res.json();
        
        if (json.status === "SUCCESS") {
          setTrophies(json.data.trophies);
        }
      } catch (error) {
        console.error("Failed to fetch trophies:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrophies();
  }, []);

  // Dynamically sum totalCount across all trophies
  const totalSilverware = trophies.reduce((sum, trophy) => sum + trophy.totalCount, 0);

  return (
    <div className="min-h-screen bg-transparent text-white pt-24 px-6 md:px-12 max-w-7xl mx-auto relative z-0">
      
      {/* Executive Boardroom Header */}
      <div className="mb-12">
        <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-widest text-[#E3B044] border border-[#E3B044]/30 rounded-full bg-[#E3B044]/10">
          PILLAR 6 &bull; THE SANCTUARY
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
          THE TROPHY CABINET &amp; LEGENDS
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 font-light">
          148 Years of Domestic and European Glory &bull; The Undisputed Kings of English Football
        </p>
      </div>

      {/* The Silverware Macro Showcase Banner (Top KPI Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        
        {/* Card 1: TOTAL SILVERWARE */}
        <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-neutral-400 text-sm font-semibold tracking-wider mb-2 uppercase">Total Silverware</h3>
            <div className="text-5xl font-bold text-white mb-2">
              {loading ? "-" : totalSilverware}
            </div>
          </div>
          <div className="mt-4">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest text-neutral-300 border border-neutral-700 rounded-full bg-neutral-800/50">
              ALL OFFICIAL COMPETITIONS
            </span>
          </div>
        </div>

        {/* Card 2: RECORD LEAGUE TITLES */}
        <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-neutral-400 text-sm font-semibold tracking-wider mb-2 uppercase">Record League Titles</h3>
            <div className="text-5xl font-bold text-[#E3B044] mb-2 drop-shadow-[0_0_15px_rgba(227,176,68,0.4)]">
              20
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-neutral-400">
              English Record &bull; 1908 to 2013
            </p>
          </div>
        </div>

        {/* Card 3: EUROPEAN CUPS */}
        <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-neutral-400 text-sm font-semibold tracking-wider mb-2 uppercase">European Cups</h3>
            <div className="text-5xl font-bold text-cyan-400 mb-2 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              3
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-neutral-400">
              1968, 1999, and 2008
            </p>
          </div>
        </div>

      </div>

      {/* THE OFFICIAL SILVERWARE CABINET (The Carrington Wall) */}
      <div 
        className="mt-20 w-full pb-72 pt-16 px-10 relative overflow-hidden rounded-[40px] border border-[#5c3a21]/30 shadow-2xl"
        style={{
          background: '#2d1a11',
          backgroundImage: `
            radial-gradient(circle at 50% -20%, rgba(227, 176, 68, 0.15) 0%, transparent 70%),
            linear-gradient(90deg, #1a0f0a 0%, #3a2218 50%, #1a0f0a 100%)
          `,
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9), 0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Sweeping Spotlight Animation Background */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'conic-gradient(from 180deg at 50% -20%, transparent 0deg, rgba(255,255,255,0.1) 45deg, transparent 90deg)',
            animation: 'spotlight-sweep 15s infinite alternate ease-in-out',
            transformOrigin: 'top center'
          }}
        />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spotlight-sweep {
            0% { transform: rotate(-15deg) scale(2); }
            100% { transform: rotate(15deg) scale(2); }
          }
        `}} />

        <div className="relative z-10 text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#E3B044] mb-2 tracking-widest uppercase drop-shadow-md">
            The Carrington Case
          </h2>
          <p className="text-[#a8896c] font-light text-lg">
            Physical embodiment of Manchester United's supremacy. Select a pedestal to inspect the archives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-24 relative z-10 px-4">
          {trophies.map((trophy, index) => {
            // Create a staggered staircase effect based on the column index (0 to 3)
            const columnIndex = index % 4;
            // E.g., column 0 has 120px margin, column 1 has 80px, etc. (Ascending left to right)
            const staircaseMargin = (3 - columnIndex) * 40; 
            
            return (
              <div 
                key={trophy.id} 
                style={{ 
                  marginTop: `${staircaseMargin}px`,
                  transition: 'margin-top 0.3s ease'
                }}
              >
                <TrophyPedestal
                  trophy={trophy}
                  isExpanded={expandedTrophyId === trophy.id}
                  onToggle={() => setExpandedTrophyId(expandedTrophyId === trophy.id ? null : trophy.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
