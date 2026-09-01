// FILE: frontend/src/app/players/[id]/page.tsx
// Server Component: High-Density Player Dossier & Match-by-Match Performance Log

import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bebas_Neue } from 'next/font/google';
import prisma from '@/lib/prisma';
import { LegendCard, PlayerData } from '@/components/PlayerCard';

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PlayerPageProps {
  params: {
    id: string;
  };
}

export default async function PlayerDossierPage({ params }: PlayerPageProps) {
  const playerId = parseInt(params.id, 10);

  if (isNaN(playerId)) {
    notFound();
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      matchStats: {
        include: {
          match: true,
        },
        orderBy: {
          match: {
            date: 'desc',
          },
        },
      },
    },
  });

  if (!player) {
    notFound();
  }

  // Calculate Aggregated Metrics from MatchStats with explicit types (zero ESLint warnings)
  const totalApps = player.matchStats.length;
  const totalMinutes = player.matchStats.reduce((sum: number, s) => sum + s.minutes, 0);
  const totalGoals = player.matchStats.reduce((sum: number, s) => sum + s.goals, 0);
  const totalAssists = player.matchStats.reduce((sum: number, s) => sum + s.assists, 0);
  const totalYC = player.matchStats.reduce((sum: number, s) => sum + s.yellowCards, 0);
  const totalRC = player.matchStats.reduce((sum: number, s) => sum + s.redCards, 0);
  const totalXG = player.matchStats.reduce((sum: number, s) => sum + (s.xG || 0), 0);
  const isLegend = !player.photo;

  // Adapt data for LegendCard fallback
  const playerCardData: PlayerData = {
    id: player.id,
    name: player.name,
    position: player.position || 'Player',
    nationality: player.nationality || 'Manchester United',
    headshotUrl: player.photo,
    squadNumber: player.number ?? undefined,
    appearances: totalApps,
    goals: totalGoals,
    isLegend: isLegend,
    era: isLegend ? 'Historical Legend' : '2024/25 Season',
  };

  return (
    <main className="min-h-screen bg-[#0B0E14] text-white p-6 md:p-12 space-y-10">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <Link href="/squad" className="hover:text-[#DA291C] transition-colors">Squad Matrix</Link>
          <span>/</span>
          <span className="text-white font-semibold">{player.name}</span>
        </div>

        {/* Hero Dossier Card */}
        <section className="bg-[#151A22] border border-[#2A313C] rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              isLegend
                ? 'bg-gradient-to-r from-[#D4AF37] via-amber-300 to-[#D4AF37]'
                : 'bg-gradient-to-r from-[#7A0006] via-[#DA291C] to-[#7A0006]'
            }`}
          />

          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
            
            {/* Visual Column: Sharp Headshot or LegendCard */}
            <div className="flex justify-center md:justify-start">
              {isLegend ? (
                <LegendCard player={playerCardData} />
              ) : (
                <div className="w-40 h-40 md:w-48 md:h-48 relative rounded-2xl bg-[#0B0E14] border-2 border-[#7A0006] overflow-hidden flex-shrink-0 shadow-lg flex items-center justify-center">
                  <Image
                    src={player.photo!}
                    alt={player.name}
                    fill
                    sizes="192px"
                    className="object-contain p-2"
                    unoptimized
                    priority
                  />
                </div>
              )}
            </div>

            {/* Profile Overview */}
            <div className="space-y-3 text-center md:text-left flex-1">
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <span className={`${bebas.className} text-3xl text-[#DA291C]`}>
                  #{player.number ?? '-'}
                </span>
                <span className="bg-[#0B0E14] border border-[#2A313C] text-[#D4AF37] text-xs font-bold uppercase px-3 py-0.5 rounded tracking-wider">
                  {player.position}
                </span>
                {player.injured && (
                  <span className="bg-red-950/80 border border-red-700 text-red-400 text-xs font-semibold px-2 py-0.5 rounded">
                    Injured
                  </span>
                )}
              </div>

              <h1 className={`${bebas.className} text-5xl md:text-6xl text-white tracking-wide leading-none`}>
                {player.name}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-gray-400 pt-1">
                <span>Nationality: <strong className="text-gray-200">{player.nationality || 'Manchester United'}</strong></span>
                <span>•</span>
                <span>Age: <strong className="text-gray-200">{player.age ?? 'N/A'}</strong></span>
                {player.height && (
                  <>
                    <span>•</span>
                    <span>Height: <strong className="text-gray-200">{player.height}</strong></span>
                  </>
                )}
                {player.weight && (
                  <>
                    <span>•</span>
                    <span>Weight: <strong className="text-gray-200">{player.weight}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Season Performance Matrix */}
        <section className="space-y-4">
          <div className="flex items-center space-x-3">
            <span className="bg-[#D4AF37] w-2.5 h-6 rounded-sm block"></span>
            <h2 className={`${bebas.className} text-3xl text-white tracking-wide`}>
              2024/25 CAMPAIGN INDEX
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <div className="bg-[#151A22] border border-[#2A313C] p-4 rounded-xl text-center">
              <span className="text-gray-400 text-xs uppercase font-semibold block">Appearances</span>
              <span className={`${bebas.className} text-3xl text-white mt-1 block`}>{totalApps}</span>
            </div>
            <div className="bg-[#151A22] border border-[#2A313C] p-4 rounded-xl text-center">
              <span className="text-gray-400 text-xs uppercase font-semibold block">Minutes</span>
              <span className={`${bebas.className} text-3xl text-gray-300 mt-1 block`}>{totalMinutes}&apos;</span>
            </div>
            <div className="bg-[#151A22] border border-[#2A313C] p-4 rounded-xl text-center">
              <span className="text-gray-400 text-xs uppercase font-semibold block">Goals</span>
              <span className={`${bebas.className} text-3xl text-[#D4AF37] mt-1 block`}>{totalGoals}</span>
            </div>
            <div className="bg-[#151A22] border border-[#2A313C] p-4 rounded-xl text-center">
              <span className="text-gray-400 text-xs uppercase font-semibold block">Assists</span>
              <span className={`${bebas.className} text-3xl text-white mt-1 block`}>{totalAssists}</span>
            </div>
            <div className="bg-[#151A22] border border-[#2A313C] p-4 rounded-xl text-center">
              <span className="text-gray-400 text-xs uppercase font-semibold block">Expected Goals (xG)</span>
              <span className={`${bebas.className} text-3xl text-[#DA291C] mt-1 block`}>{totalXG.toFixed(2)}</span>
            </div>
            <div className="bg-[#151A22] border border-[#2A313C] p-4 rounded-xl text-center">
              <span className="text-gray-400 text-xs uppercase font-semibold block">Cards (Y / R)</span>
              <span className={`${bebas.className} text-3xl text-gray-300 mt-1 block`}>
                <span className="text-yellow-500">{totalYC}</span> / <span className="text-red-500">{totalRC}</span>
              </span>
            </div>
          </div>
        </section>

        {/* Match Logs */}
        <section className="space-y-4">
          <div className="flex items-center space-x-3">
            <span className="bg-[#DA291C] w-2.5 h-6 rounded-sm block"></span>
            <h2 className={`${bebas.className} text-3xl text-white tracking-wide`}>
              MATCH PERFORMANCE LOG
            </h2>
          </div>

          {player.matchStats.length === 0 ? (
            <div className="bg-[#151A22] border border-[#2A313C] rounded-xl p-8 text-center text-gray-400 text-sm">
              No official match appearances logged for this campaign yet.
            </div>
          ) : (
            <div className="bg-[#151A22] border border-[#2A313C] rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0E1218] border-b border-[#2A313C] text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Match</th>
                      <th className="py-3.5 px-3 text-center">Min</th>
                      <th className="py-3.5 px-3 text-center text-[#D4AF37]">G</th>
                      <th className="py-3.5 px-3 text-center text-[#D4AF37]">A</th>
                      <th className="py-3.5 px-3 text-center">Rating</th>
                      <th className="py-3.5 px-3 text-center">xG</th>
                      <th className="py-3.5 px-3 text-center">Cards</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A313C]/50 text-sm">
                    {player.matchStats.map((stat) => (
                      <tr key={stat.id} className="hover:bg-[#1C232E] transition-colors duration-150">
                        <td className="py-3 px-4 text-gray-400 text-xs">
                          {new Date(stat.match.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {stat.match.homeTeamName} vs {stat.match.awayTeamName}
                        </td>
                        <td className="py-3 px-3 text-center text-gray-300 text-xs">
                          {stat.minutes}&apos;
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-[#D4AF37]">
                          {stat.goals}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-white">
                          {stat.assists}
                        </td>
                        <td className="py-3 px-3 text-center text-xs text-gray-300">
                          {stat.rating ? stat.rating.toFixed(1) : '-'}
                        </td>
                        <td className="py-3 px-3 text-center text-xs text-[#DA291C] font-semibold">
                          {stat.xG !== null ? stat.xG.toFixed(2) : '-'}
                        </td>
                        <td className="py-3 px-3 text-center text-xs">
                          {stat.yellowCards > 0 && <span className="text-yellow-500 mr-1">🟨</span>}
                          {stat.redCards > 0 && <span className="text-red-500">🟥</span>}
                          {stat.yellowCards === 0 && stat.redCards === 0 && <span className="text-gray-600">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}