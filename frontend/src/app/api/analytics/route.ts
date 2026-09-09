import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface TeamStats {
  team: string;
  logo: string;
  played: number;
  actualPoints: number;
  xPts: number;
  goalsFor: number;
  goalsAgainst: number;
  xgFor: number;
  xgAgainst: number;
  wins: number;
  draws: number;
  losses: number;
  xPtsDelta: number;
}

const ESPN_LOGOS: Record<string, string> = {
  'Arsenal': 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
  'Manchester City': 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
  'Manchester United': 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',
  'Liverpool': 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',
  'Chelsea': 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png',
  'Tottenham': 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',
  'Newcastle United': 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png',
  'Aston Villa': 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png',
  'West Ham': 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png',
  'Brighton': 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png',
  'Everton': 'https://a.espncdn.com/i/teamlogos/soccer/500/368.png',
  'Fulham': 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png',
  'Crystal Palace': 'https://a.espncdn.com/i/teamlogos/soccer/500/384.png',
  'Bournemouth': 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png',
  'Nottingham Forest': 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png',
  'Brentford': 'https://a.espncdn.com/i/teamlogos/soccer/500/337.png',
  'Wolverhampton Wanderers': 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png',
  'Southampton': 'https://a.espncdn.com/i/teamlogos/soccer/500/376.png',
  'Leicester': 'https://a.espncdn.com/i/teamlogos/soccer/500/375.png',
  'Ipswich': 'https://a.espncdn.com/i/teamlogos/soccer/500/394.png'
};

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'src', 'data', 'epl_moneyball_table.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const teamsData = JSON.parse(rawData);

    const formattedTable: TeamStats[] = teamsData.map((team: any) => {
      let logo = ESPN_LOGOS[team.team];
      if (!logo) {
        logo = `https://ui-avatars.com/api/?name=${encodeURIComponent(team.team)}&background=0D0E14&color=fff`;
      }
      
      return {
        ...team,
        logo
      };
    });

    let unsungHeroes = [];
    try {
      const heroesPath = path.join(process.cwd(), 'src', 'data', 'unsung_heroes.json');
      const rawHeroes = fs.readFileSync(heroesPath, 'utf-8');
      const parsedHeroes = JSON.parse(rawHeroes);
      
      unsungHeroes = parsedHeroes.map((player: any) => {
        return {
          ...player,
          photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(player.player_name)}&background=0D0E14&color=D4AF37&rounded=true`
        };
      });
    } catch (e) {
      console.warn('Could not load unsung heroes data, defaulting to empty array.');
    }

    let finishingEfficiency = [];
    try {
      const finishingPath = path.join(process.cwd(), 'src', 'data', 'finishing_efficiency.json');
      const rawFinishing = fs.readFileSync(finishingPath, 'utf-8');
      finishingEfficiency = JSON.parse(rawFinishing);
    } catch (e) {
      console.warn('Could not load finishing efficiency data, defaulting to empty array.');
    }

    return NextResponse.json({
      status: 'SUCCESS',
      data: {
        expectedTable: formattedTable,
        unsungHeroes: unsungHeroes,
        finishingEfficiency: finishingEfficiency,
      },
    });
  } catch (error) {
    console.error('Analytics JSON Read Error:', error);
    return NextResponse.json({ status: 'ERROR', message: 'Failed to read moneyball data' }, { status: 500 });
  }
}
