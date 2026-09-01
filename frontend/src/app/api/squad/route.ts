// FILE: frontend/src/app/api/squad/route.ts
// Custom REST API Endpoint: GET /api/squad
// Returns the complete Manchester United active roster and aggregated season statistics.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const revalidate = 3600; // Cache API responses for 1 hour

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      include: {
        matchStats: true,
      },
      orderBy: [
        { number: 'asc' },
        { name: 'asc' },
      ],
    });

    // Transform database models into a clean, public-facing JSON API contract
    const apiPayload = players.map((player) => {
      const totalApps = player.matchStats.length;
      const totalGoals = player.matchStats.reduce((sum, s) => sum + s.goals, 0);
      const totalAssists = player.matchStats.reduce((sum, s) => sum + s.assists, 0);
      const totalMinutes = player.matchStats.reduce((sum, s) => sum + s.minutes, 0);
      const totalYC = player.matchStats.reduce((sum, s) => sum + s.yellowCards, 0);
      const totalRC = player.matchStats.reduce((sum, s) => sum + s.redCards, 0);

      return {
        id: player.id,
        apiReferenceId: player.apiId,
        name: player.name,
        shirtNumber: player.number,
        position: player.position,
        age: player.age,
        status: player.injured ? 'Injured' : 'Active',
        headshotUrl: player.photo,
        seasonStatistics: {
          appearances: totalApps,
          minutesPlayed: totalMinutes,
          goals: totalGoals,
          assists: totalAssists,
          yellowCards: totalYC,
          redCards: totalRC,
        }
      };
    });

    return NextResponse.json(
      {
        status: 'success',
        metadata: {
          team: 'Manchester United',
          totalPlayers: apiPayload.length,
          lastUpdated: new Date().toISOString(),
        },
        data: apiPayload,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*', // Allow cross-origin requests
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('API Error /api/squad:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}