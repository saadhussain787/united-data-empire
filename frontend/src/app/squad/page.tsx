// FILE: frontend/src/app/squad/page.tsx
// Server Component: Tiered Players Directory (First Team & Carrington Academy)

import Image from 'next/image';
import Link from 'next/link';
import { Bebas_Neue } from 'next/font/google';
import prisma from '@/lib/prisma';
import { Player, MatchStat } from '@prisma/client';

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PlayerWithStats = Player & {
  matchStats: MatchStat[];
};

export default async function PlayersPage() {
  const allPlayers: PlayerWithStats[] = await prisma.player.findMany({
    include: {
      matchStats: true,
    },
    orderBy: [
      { number: 'asc' },
      { name: 'asc' },
    ],
  });

  // Partition into Senior First Team vs Carrington Academy & Reserves
  const firstTeam = allPlayers.filter(
    (p) => (p.number !== null && p.number <= 40) || (p.age !== null && p.age >= 23)
  );

  const academyReserves = allPlayers.filter(
    (p) => !((p.number !== null && p.number <= 40) || (p.age !== null && p.age >= 23))
  );

  const positionKeys = [
    { title: 'Goalkeepers', key: 'Goalkeeper' },
    { title: 'Defenders', key: 'Defender' },
    { title: 'Midfielders', key: 'Midfielder' },
    { title: 'Attackers', key: 'Attacker' },
  ];

  const renderTierTables = (squadList: PlayerWithStats[]) => {
    return positionKeys.map(({ title, key }) => {
      const group = squadList.filter(
        (p) =>
          p.position?.toLowerCase() === key.toLowerCase() ||
          (key === 'Attacker' && p.position?.toLowerCase() === 'forward')
      );

      if (group.length === 0) return null;

      return (
        <div key={key} className="space-y-3">
          <div className="flex items-center space-x-2.5">
            <span className="bg-[#DA291C] w-2 h-5 rounded-sm block"></span>
            <h3 className={`${bebas.className} text-2xl text-white tracking-wide uppercase`}>
              {title} <span className="text-[#D4AF37] text-base font-normal">({group.length})</span>
            </h3>
          </div>

          <div className="bg-[#151A22] border border-[#2A313C] rounded-lg overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0E1218] border-b border-[#2A313C] text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4 min-w-[220px]">Player</th>
                    <th className="py-3 px-3 text-center">Age</th>
                    <th className="py-3 px-3 text-center">Pos</th>
                    <th className="py-3 px-3 text-center">Apps</th>
                    <th className="py-3 px-3 text-center">Min</th>
                    <th className="py-3 px-3 text-center text-[#D4AF37]">Goals</th>
                    <th className="py-3 px-3 text-center text-[#D4AF37]">Ast</th>
                    <th className="py-3 px-3 text-center">YC</th>
                    <th className="py-3 px-3 text-center">RC</th>
                    <th className="py-3 px-4 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A313C]/50 text-sm">
                  {group.map((player) => {
                    const totalApps = player.matchStats.length;
                    const totalGoals = player.matchStats.reduce((sum: number, s) => sum + s.goals, 0);
                    const totalAssists = player.matchStats.reduce((sum: number, s) => sum + s.assists, 0);
                    const totalMinutes = player.matchStats.reduce((sum: number, s) => sum + s.minutes, 0);
                    const totalYC = player.matchStats.reduce((sum: number, s) => sum + s.yellowCards, 0);
                    const totalRC = player.matchStats.reduce((sum: number, s) => sum + s.redCards, 0);

                    return (
                      <tr
                        key={player.id}
                        className="hover:bg-[#1C232E] transition-colors duration-150 group"
                      >
                        {/* Number */}
                        <td className="py-2.5 px-4 text-center">
                          <span className={`${bebas.className} text-lg text-[#DA291C] font-semibold block`}>
                            {player.number ?? '-'}
                          </span>
                        </td>

                        {/* Info & Headshot */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center space-x-3.5">
                            <div className="w-10 h-10 relative rounded-full bg-[#0B0E14] border border-[#2A313C] overflow-hidden flex-shrink-0 group-hover:border-[#DA291C] transition-colors">
                              {player.photo ? (
                                <Image
                                  src={player.photo}
                                  alt={player.name}
                                  fill
                                  sizes="40px"
                                  className="object-contain p-1"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-bold">
                                  MU
                                </div>
                              )}
                            </div>

                            <div className="truncate">
                              <Link
                                href={`/players/${player.id}`}
                                className="font-bold text-white group-hover:text-[#D4AF37] transition-colors truncate block"
                              >
                                {player.name}
                              </Link>
                              <span className="text-[11px] text-gray-400 block truncate">
                                {player.nationality || 'Manchester United'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Age */}
                        <td className="py-2.5 px-3 text-center text-gray-300 text-xs">
                          {player.age ?? '-'}
                        </td>

                        {/* Position */}
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[10px] font-semibold text-gray-400 bg-[#0B0E14] px-2 py-0.5 rounded border border-[#2A313C]">
                            {player.position}
                          </span>
                        </td>

                        {/* Apps */}
                        <td className="py-2.5 px-3 text-center text-gray-200 font-medium">
                          {totalApps}
                        </td>

                        {/* Min */}
                        <td className="py-2.5 px-3 text-center text-gray-400 text-xs">
                          {totalMinutes}&apos;
                        </td>

                        {/* Goals */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-bold ${totalGoals > 0 ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                            {totalGoals}
                          </span>
                        </td>

                        {/* Ast */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-bold ${totalAssists > 0 ? 'text-white' : 'text-gray-400'}`}>
                            {totalAssists}
                          </span>
                        </td>

                        {/* YC */}
                        <td className="py-2.5 px-3 text-center text-xs text-yellow-500">
                          {totalYC > 0 ? totalYC : '-'}
                        </td>

                        {/* RC */}
                        <td className="py-2.5 px-3 text-center text-xs text-red-500 font-bold">
                          {totalRC > 0 ? totalRC : '-'}
                        </td>

                        {/* Link */}
                        <td className="py-2.5 px-4 text-right">
                          <Link
                            href={`/players/${player.id}`}
                            className="inline-flex items-center text-xs font-semibold text-[#DA291C] hover:text-[#D4AF37] transition-colors"
                          >
                            View <span className="ml-1">→</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <main className="min-h-screen bg-[#0B0E14] text-white p-4 md:p-10">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Main Header */}
        <header className="border-b border-[#7A0006] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="bg-[#DA291C] text-white text-xs font-black uppercase px-2.5 py-0.5 rounded tracking-widest">
                Official Roster
              </span>
              <span className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider">
                Season 2024/25
              </span>
            </div>
            <h1 className={`${bebas.className} text-5xl md:text-6xl tracking-wide text-white`}>
              PLAYERS & <span className="text-[#DA291C]">SQUAD DIRECTORY</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Complete Manchester United registry across Senior First Team and Carrington Academy.
            </p>
          </div>

          {/* Quick Roster Metrics */}
          <div className="flex items-center space-x-6 bg-[#151A22] border border-[#2A313C] px-5 py-3 rounded-lg">
            <div className="text-center">
              <span className="text-gray-400 text-xs uppercase block">First Team</span>
              <span className={`${bebas.className} text-2xl text-[#D4AF37]`}>{firstTeam.length}</span>
            </div>
            <div className="w-px h-8 bg-[#2A313C]"></div>
            <div className="text-center">
              <span className="text-gray-400 text-xs uppercase block">Academy / U21</span>
              <span className={`${bebas.className} text-2xl text-white`}>{academyReserves.length}</span>
            </div>
            <div className="w-px h-8 bg-[#2A313C]"></div>
            <div className="text-center">
              <span className="text-gray-400 text-xs uppercase block">Total Players</span>
              <span className={`${bebas.className} text-2xl text-[#DA291C]`}>{allPlayers.length}</span>
            </div>
          </div>
        </header>

        {/* SECTION 1: FIRST TEAM SQUAD */}
        <section className="space-y-6">
          <div className="border-b border-[#2A313C] pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="bg-[#D4AF37] w-3 h-8 rounded-sm block"></span>
              <h2 className={`${bebas.className} text-3xl md:text-4xl text-white tracking-wide`}>
                FIRST TEAM SQUAD
              </h2>
            </div>
            <span className="text-xs uppercase font-bold text-[#D4AF37] tracking-wider bg-[#151A22] border border-[#2A313C] px-3 py-1 rounded">
              Senior Registry ({firstTeam.length})
            </span>
          </div>

          <div className="space-y-8">
            {renderTierTables(firstTeam)}
          </div>
        </section>

        {/* SECTION 2: CARRINGTON ACADEMY & RESERVES */}
        {academyReserves.length > 0 && (
          <section className="space-y-6 pt-6">
            <div className="border-b border-[#2A313C] pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="bg-gray-500 w-3 h-8 rounded-sm block"></span>
                <h2 className={`${bebas.className} text-3xl md:text-4xl text-gray-300 tracking-wide`}>
                  CARRINGTON ACADEMY & RESERVES (U21 / U18)
                </h2>
              </div>
              <span className="text-xs uppercase font-bold text-gray-400 tracking-wider bg-[#151A22] border border-[#2A313C] px-3 py-1 rounded">
                Developmental ({academyReserves.length})
              </span>
            </div>

            <div className="space-y-8">
              {renderTierTables(academyReserves)}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}