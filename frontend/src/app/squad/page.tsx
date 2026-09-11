import { headers } from 'next/headers';
import Image from 'next/image';
import SquadMatrix from './SquadMatrix';

type Player = {
  id: number;
  espnId: string;
  name: string;
  photo: string | null;
  squadRole: string;
  age: number | null;
  metadata: {
    jersey?: string;
    position?: string;
    age?: number;
    [key: string]: any;
  };
  stats?: {
    goals: number;
    assists: number;
    yc: number;
    rc: number;
  };
};

async function getSquad(): Promise<Player[]> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  const res = await fetch(`${protocol}://${host}/api/squad`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch squad data');
  }
  const json = await res.json();
  return json.data;
}

export default async function SquadPage() {
  const players = await getSquad();

  return (
    <div className="min-h-screen bg-transparent text-gray-200 py-10 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Cinematic Hero Header for Players Directory */}
        <header className="relative w-full h-[400px] mb-12 rounded-2xl overflow-hidden border border-[#DA291C]/30 shadow-2xl flex items-end p-8 md:p-12">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero/tunnel.jpg"
              alt="Manchester United Squad"
              fill
              className="object-cover opacity-80"
              priority
            />
          </div>
          
          {/* Dark Gradients for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent z-10"></div>
          
          {/* Text Content */}
          <div className="relative z-20 w-full flex items-end justify-between border-b border-[#DA291C]/50 pb-4">
            <div>
              <span className="bg-[#DA291C] text-white text-xs font-black uppercase px-3 py-1 rounded tracking-widest inline-block mb-3">
                The Legends & The Future
              </span>
              <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-wide text-white drop-shadow-lg" style={{ fontFamily: 'var(--font-bebas)' }}>
                Squad Directory
              </h1>
              <p className="text-[#D4AF37] mt-2 font-medium tracking-widest text-sm md:text-base">
                2026/27 SEASON ROSTER & HISTORICAL ARCHIVE
              </p>
            </div>
          </div>
        </header>

        <SquadMatrix initialPlayers={players} />
      </div>
    </div>
  );
}