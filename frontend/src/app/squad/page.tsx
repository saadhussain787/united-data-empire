import { headers } from 'next/headers';
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
    <div className="min-h-screen bg-[#0B0E14] text-gray-200 py-10 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 border-b border-[#DA291C]/30 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-wider text-white">First Team Squad</h1>
            <p className="text-[#D4AF37] mt-2 font-medium tracking-widest text-sm">2026/27 SEASON ROSTER</p>
          </div>
        </header>

        <SquadMatrix initialPlayers={players} />
      </div>
    </div>
  );
}