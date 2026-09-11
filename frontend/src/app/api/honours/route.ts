import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Custom Premium SVGs for perfect contrast on dark mode
const createTrophySVG = (primary: string, secondary: string) => {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <!-- Base/Pedestal removed so it sits on the HTML glass shelf -->
      <!-- Bowl -->
      <path d="M25 25 q 25 70 50 0" fill="url(#grad)" filter="url(#glow)"/>
      <!-- Handles -->
      <path d="M25 35 c -15 0 -15 25 2 10" fill="none" stroke="url(#grad)" stroke-width="4" />
      <path d="M75 35 c 15 0 15 25 -2 10" fill="none" stroke="url(#grad)" stroke-width="4" />
      <!-- Top Rim -->
      <ellipse cx="50" cy="25" rx="25" ry="5" fill="${secondary}" />
    </svg>
  `)}`;
};

const GOLD_TROPHY = createTrophySVG('#FDE047', '#B45309');
const CYAN_TROPHY = createTrophySVG('#67E8F9', '#0E7490');
const SILVER_TROPHY = createTrophySVG('#E5E7EB', '#4B5563');

// Trophy Image Mapping
const TROPHY_IMAGES: Record<string, string> = {
  "English Champion": GOLD_TROPHY,
  "European Champion Clubs' Cup winner": CYAN_TROPHY,
  "Champions League Winner": CYAN_TROPHY,
  "FA Cup Winner": GOLD_TROPHY,
  "English League Cup winner": GOLD_TROPHY,
  "Europa League Winner": CYAN_TROPHY,
  "FIFA Club World Cup winner": GOLD_TROPHY,
  "English Supercup Winner": SILVER_TROPHY,
  "Intercontinental Cup Winner": SILVER_TROPHY,
  "Cup Winners Cup Winner": SILVER_TROPHY,
  "UEFA Supercup Winner": SILVER_TROPHY,
};

// Generic fallback icon
const GENERIC_TROPHY = SILVER_TROPHY;

// Prestige ordering for sorting the final array
const PRESTIGE_ORDER: Record<string, number> = {
  "European Champion Clubs' Cup winner": 1,
  "Champions League Winner": 1,
  "English Champion": 2,
  "FA Cup Winner": 3,
  "Europa League Winner": 4,
  "English League Cup winner": 5,
  "FIFA Club World Cup winner": 6,
  "Intercontinental Cup Winner": 7,
  "UEFA Supercup Winner": 8,
  "Cup Winners Cup Winner": 9,
  "English Supercup Winner": 10,
};

export async function GET() {
  try {
    const rawTrophies = await prisma.trophy.findMany({
      orderBy: { totalCount: 'desc' },
    });

    // 1. Filter out noise (Participant, Runner up, etc.)
    const filteredTrophies = rawTrophies.filter((trophy) => {
      const name = trophy.competitionName.toLowerCase();
      if (
        name.includes('participant') ||
        name.includes('runner up') ||
        name.includes('runner-up') ||
        name.includes('second') ||
        name.includes('relegated') ||
        name.includes('promoted') ||
        name.includes('2nd tier')
      ) {
        return false;
      }
      return true;
    });

    // 1.5 Merge Champions League Records
    const uclLegacy = filteredTrophies.find(t => t.competitionName === "European Champion Clubs' Cup winner");
    const uclModern = filteredTrophies.find(t => t.competitionName === "UEFA Champions League winner" || t.competitionName === "Champions League Winner");
    
    let mergedTrophies = [...filteredTrophies];
    
    if (uclLegacy && uclModern) {
      // Remove both from array
      mergedTrophies = mergedTrophies.filter(t => 
        t.competitionName !== "European Champion Clubs' Cup winner" && 
        t.competitionName !== "UEFA Champions League winner" &&
        t.competitionName !== "Champions League Winner"
      );
      
      // Combine seasons (modern first, then legacy)
      const combinedSeasons = [...uclModern.winningSeasons, ...uclLegacy.winningSeasons];
      
      mergedTrophies.push({
        ...uclModern,
        competitionName: "Champions League Winner",
        totalCount: uclLegacy.totalCount + uclModern.totalCount,
        winningSeasons: combinedSeasons
      });
    } else if (uclLegacy) {
      const idx = mergedTrophies.findIndex(t => t.competitionName === "European Champion Clubs' Cup winner");
      if (idx !== -1) mergedTrophies[idx].competitionName = "Champions League Winner";
    } else if (uclModern) {
      const idx = mergedTrophies.findIndex(t => t.competitionName === "UEFA Champions League winner");
      if (idx !== -1) mergedTrophies[idx].competitionName = "Champions League Winner";
    }

    // Load asset_map.json for real physical trophies
    let assetMap: Record<string, string> = {};
    try {
      const assetMapPath = path.join(process.cwd(), 'public', 'trophies', 'asset_map.json');
      const assetMapContent = fs.readFileSync(assetMapPath, 'utf-8');
      assetMap = JSON.parse(assetMapContent);
    } catch (e) {
      console.warn("Could not load asset_map.json. Falling back to SVGs.");
    }

    // 2. Map 3D Trophy Images
    const mappedTrophies = mergedTrophies.map((trophy) => {
      // Use scraped physical PNG if available, fallback to generated SVG
      const image = assetMap[trophy.competitionName] || TROPHY_IMAGES[trophy.competitionName] || GENERIC_TROPHY;
      
      return {
        ...trophy,
        trophyImage: image,
      };
    });

    // 3. Sort by prestige (Major honors at the top, followed by total count for any ties/unlisted)
    mappedTrophies.sort((a, b) => {
      const orderA = PRESTIGE_ORDER[a.competitionName] || 999;
      const orderB = PRESTIGE_ORDER[b.competitionName] || 999;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Fallback to highest count if prestige is equal or unlisted
      return b.totalCount - a.totalCount;
    });

    // Return clean JSON payload
    return NextResponse.json({
      status: "SUCCESS",
      data: {
        trophies: mappedTrophies,
      },
    });

  } catch (error) {
    console.error("Failed to fetch trophies:", error);
    return NextResponse.json(
      {
        status: "ERROR",
        message: "Failed to retrieve the trophy cabinet.",
      },
      { status: 500 }
    );
  }
}
