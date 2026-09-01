// FILE: frontend/src/app/page.tsx
// Server Component: Homepage with Smart Imminent Matchday Hub & Key Player Highlights

import Image from 'next/image';
import Link from 'next/link';
import { Bebas_Neue, Inter } from 'next/font/google';
import prisma from '@/lib/prisma';
import { Match } from '@prisma/client';

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const now = new Date();

  // 1. Check for an active LIVE match first
  let headlineMatch: Match | null = await prisma.match.findFirst({
    where: {
      status: { in: ['1H', 'HT', '2H', 'ET', 'P', 'LIVE'] },
    },
  });

  // 2. If no live game, pick the NEXT imminent upcoming match (earliest future date)
  if (!headlineMatch) {
    headlineMatch = await prisma.match.findFirst({
      where: {
        date: { gte: now },
      },
      orderBy: {
        date: 'asc', // Next closest game first!
      },
    });
  }

  // 3. Fallback to latest past result if no upcoming fixtures
  if (!headlineMatch) {
    headlineMatch = await prisma.match.findFirst({
      where: {
        date: { lt: now },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  const featuredPlayers = await prisma.player.findMany({
    take: 6,
    orderBy: [
      { number: 'asc' },
      { name: 'asc' },
    ],
  });

  const isLive = headlineMatch && ['1H', 'HT', '2H', 'ET', 'P', 'LIVE'].includes(headlineMatch.status);
  const isFinished = headlineMatch && ['FT', 'AET', 'PEN'].includes(headlineMatch.status);

  return (
    <main className="min-h-screen bg-[#0B0E14] text-white p-6 md:p-12 space-y-12">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#151A22] to-[#0B0E14] border border-[#2A313C] rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#DA291C]/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 space-y-4 max-w-2xl">
            <span className="bg-[#DA291C] text-white text-xs font-black uppercase px-3 py-1 rounded tracking-widest inline-block">
              The United Data Hub
            </span>
            <h1 className={`${bebas.className} text-6xl md:text-7xl tracking-wide text-white leading-none`}>
              THE HEARTBEAT OF <span className="text-[#DA291C]">OLD TRAFFORD</span>
            </h1>
            <p className={`${inter.className} text-gray-400 text-sm md:text-base leading-relaxed`}>
              High-density statistical tracking, live match intelligence, and deep performance analytics for Manchester United.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/fixtures"
                className="bg-[#DA291C] hover:bg-[#7A0006] text-white px-6 py-3 rounded font-bold transition-colors text-sm uppercase tracking-wider shadow-lg"
              >
                Match Calendar →
              </Link>
              <Link
                href="/squad"
                className="bg-[#151A22] hover:bg-[#2A313C] border border-[#2A313C] text-gray-300 hover:text-white px-6 py-3 rounded font-bold transition-colors text-sm uppercase tracking-wider"
              >
                Players Directory
              </Link>
            </div>
          </div>
        </section>

        {/* Campaign Headline Match */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="bg-[#D4AF37] w-2.5 h-6 rounded-sm block"></span>
              <h2 className={`${bebas.className} text-3xl text-white tracking-wide`}>
                {isLive ? 'LIVE MATCHDAY' : isFinished ? 'LATEST MATCH RESULT' : 'NEXT UPCOMING FIXTURE'}
              </h2>
            </div>
            <Link href="/fixtures" className="text-xs font-semibold text-[#DA291C] hover:text-[#D4AF37] transition-colors">
              Full Schedule →
            </Link>
          </div>

          {headlineMatch ? (
            <div className="bg-[#151A22] border border-[#2A313C] hover:border-[#7A0006] transition-colors rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl">
              {/* Left: Competition & Date */}
              <div className="text-center md:text-left mb-6 md:mb-0 w-full md:w-1/4">
                <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider block mb-1">
                  {headlineMatch.competition} • {headlineMatch.round || '2026/27 Season'}
                </span>
                <span className={`${inter.className} text-gray-200 text-sm font-semibold block`}>
                  {new Date(headlineMatch.date).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className={`${inter.className} text-gray-400 text-xs block mt-0.5`}>
                  {new Date(headlineMatch.date).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} KO
                </span>
              </div>

              {/* Center: Teams & Match Score/VS Badge */}
              <div className="flex items-center justify-center space-x-6 md:space-x-10 w-full md:w-2/4">
                {/* Home Team */}
                <div className="flex items-center justify-end space-x-3 w-5/12 text-right">
                  <span className="font-bold text-base md:text-lg text-white truncate">
                    {headlineMatch.homeTeamName}
                  </span>
                  <div className="w-12 h-12 relative flex-shrink-0">
                    <Image
                      src={headlineMatch.homeTeamLogo}
                      alt={headlineMatch.homeTeamName}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Score or VS Badge */}
                <div className="flex flex-col items-center justify-center px-2">
                  {isFinished ? (
                    <div className={`${bebas.className} text-3xl md:text-4xl text-white px-5 py-1 bg-[#0B0E14] rounded border border-[#7A0006]`}>
                      {headlineMatch.homeScore ?? 0} - {headlineMatch.awayScore ?? 0}
                    </div>
                  ) : isLive ? (
                    <div className="flex flex-col items-center">
                      <div className={`${bebas.className} text-3xl md:text-4xl text-red-500 px-5 py-1 bg-[#0B0E14] rounded border border-red-700 animate-pulse`}>
                        {headlineMatch.homeScore ?? 0} - {headlineMatch.awayScore ?? 0}
                      </div>
                      <span className="text-[10px] text-red-400 font-bold uppercase mt-1">LIVE</span>
                    </div>
                  ) : (
                    <div className={`${bebas.className} text-2xl text-[#DA291C] px-4 py-1 bg-[#0B0E14] rounded border border-[#2A313C]`}>
                      VS
                    </div>
                  )}
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                    {headlineMatch.status}
                  </span>
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-start space-x-3 w-5/12 text-left">
                  <div className="w-12 h-12 relative flex-shrink-0">
                    <Image
                      src={headlineMatch.awayTeamLogo}
                      alt={headlineMatch.awayTeamName}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="font-bold text-base md:text-lg text-white truncate">
                    {headlineMatch.awayTeamName}
                  </span>
                </div>
              </div>

              {/* Right: Venue */}
              <div className="text-center md:text-right text-xs text-gray-400 mt-6 md:mt-0 w-full md:w-1/4">
                <span className="text-gray-300 font-medium block">{headlineMatch.venue || 'Old Trafford'}</span>
                <span className="text-gray-500 text-[11px] block mt-0.5">Premier League Broadcast</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#151A22] border border-[#2A313C] rounded-xl p-8 text-center text-gray-400 text-sm">
              No active fixtures scheduled.
            </div>
          )}
        </section>

        {/* Featured Squad Leaders */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#2A313C] pb-3">
            <div className="flex items-center space-x-3">
              <span className="bg-[#DA291C] w-2.5 h-6 rounded-sm block"></span>
              <h2 className={`${bebas.className} text-3xl text-white tracking-wide`}>
                FEATURED SQUAD LEADERS
              </h2>
            </div>
            <Link href="/squad" className="text-xs font-semibold text-[#DA291C] hover:text-[#D4AF37] transition-colors">
              Full Players Directory ({featuredPlayers.length}+ Players) →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredPlayers.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="bg-[#151A22] border border-[#2A313C] hover:border-[#DA291C] rounded-lg p-4 flex flex-col items-center text-center transition-all duration-200 group shadow-md"
              >
                <div className="w-20 h-20 relative mb-3 bg-[#0B0E14] rounded-full overflow-hidden border border-[#2A313C] group-hover:border-[#7A0006]">
                  {player.photo ? (
                    <Image
                      src={player.photo}
                      alt={player.name}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-bold">
                      #{player.number}
                    </div>
                  )}
                </div>
                <span className={`${bebas.className} text-sm text-[#DA291C]`}>#{player.number ?? '-'}</span>
                <span className="font-bold text-xs text-white group-hover:text-[#D4AF37] truncate w-full">
                  {player.name}
                </span>
                <span className="text-[10px] text-gray-500 uppercase mt-0.5">{player.position}</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}