'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// Define the Trophy TypeScript interface matching the API route response
interface Trophy {
  id: number;
  competitionName: string;
  totalCount: number;
  winningSeasons: string[];
}

type CompetitionCategory = 'domestic' | 'european' | 'world';

interface CompetitionMeta {
  category: CompetitionCategory;
  tierTag: string;
  badgeColor: string;
  displayName: string;
  heritageAlias?: string;
}

function getCompetitionMeta(name: string): CompetitionMeta {
  const lower = name.toLowerCase();

  // World / Global Apex: Club World Cup
  if (lower.includes('club world cup')) {
    return {
      category: 'world',
      tierTag: 'GLOBAL APEX',
      badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
      displayName: 'FIFA CLUB WORLD CUP',
      heritageAlias: '2008 Yokohama Triumph',
    };
  }

  // World / Global Apex: Intercontinental Cup
  if (lower.includes('intercontinental')) {
    return {
      category: 'world',
      tierTag: 'GLOBAL APEX',
      badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
      displayName: 'INTERCONTINENTAL CUP',
      heritageAlias: '1999 Tokyo World Title',
    };
  }

  // Domestic Super Cup (FA Community Shield / Charity Shield)
  if (
    lower.includes('english supercup') ||
    lower.includes('community shield') ||
    lower.includes('charity shield')
  ) {
    return {
      category: 'domestic',
      tierTag: 'DOMESTIC SUPER CUP',
      badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
      displayName: 'FA COMMUNITY SHIELD',
      heritageAlias: 'Formerly Charity Shield',
    };
  }

  // UEFA Champions League / European Cup
  if (lower.includes('champions league') || lower.includes('european champion')) {
    return {
      category: 'european',
      tierTag: 'TIER 1 • CONTINENTAL',
      badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
      displayName: 'UEFA CHAMPIONS LEAGUE',
      heritageAlias: 'European Cup',
    };
  }

  // UEFA Cup Winners' Cup
  if (lower.includes('cup winners')) {
    return {
      category: 'european',
      tierTag: 'EUROPEAN HONOUR',
      badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
      displayName: "UEFA CUP WINNERS' CUP",
      heritageAlias: '1991 Rotterdam Conquest',
    };
  }

  // UEFA Europa League
  if (lower.includes('europa')) {
    return {
      category: 'european',
      tierTag: 'EUROPEAN HONOUR',
      badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
      displayName: 'UEFA EUROPA LEAGUE',
      heritageAlias: '2017 Stockholm Triumph',
    };
  }

  // UEFA Super Cup
  if (lower.includes('uefa supercup') || (lower.includes('supercup') && !lower.includes('english'))) {
    return {
      category: 'european',
      tierTag: 'EUROPEAN HONOUR',
      badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
      displayName: 'UEFA SUPER CUP',
      heritageAlias: '1991 European Super Cup',
    };
  }

  // Domestic Apex / League Title
  if (lower.includes('english champion') || lower.includes('premier league')) {
    return {
      category: 'domestic',
      tierTag: 'DOMESTIC APEX',
      badgeColor: 'border-[#D4AF37]/50 text-[#FCEEAC] bg-[#D4AF37]/15 shadow-[0_0_10px_rgba(212,175,55,0.25)]',
      displayName: 'PREMIER LEAGUE',
      heritageAlias: 'First Division Heritage',
    };
  }

  // FA Cup
  if (lower.includes('fa cup')) {
    return {
      category: 'domestic',
      tierTag: 'HERITAGE KNOCKOUT',
      badgeColor: 'border-red-500/40 text-red-400 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
      displayName: 'FA CUP',
      heritageAlias: "World's Oldest Cup",
    };
  }

  // League Cup / Carabao Cup
  if (lower.includes('league cup') || lower.includes('carabao') || lower.includes('efl')) {
    return {
      category: 'domestic',
      tierTag: 'DOMESTIC CUP',
      badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
      displayName: 'CARABAO CUP / EFL CUP',
      heritageAlias: 'League Cup',
    };
  }

  return {
    category: 'domestic',
    tierTag: 'DOMESTIC HONOUR',
    badgeColor: 'border-white/20 text-neutral-300 bg-white/5',
    displayName: name.toUpperCase(),
  };
}

function getPrestigeRank(competitionName: string): number {
  const lower = competitionName.toLowerCase();

  // 1. Premier League / English Champion (Apex Domestic League)
  if (lower.includes('english champion') || lower.includes('premier league')) return 1;
  // 2. UEFA Champions League / European Cup (Apex Continental Title)
  if (lower.includes('champions league') || lower.includes('european champion')) return 2;
  // 3. FA Cup (World's Oldest Domestic Cup)
  if (lower.includes('fa cup')) return 3;
  // 4. FIFA Club World Cup (Global FIFA Crown)
  if (lower.includes('club world cup')) return 4;
  // 5. Intercontinental Cup (World Club Heritage Crown)
  if (lower.includes('intercontinental')) return 5;
  // 6. UEFA Europa League (Continental Trophy)
  if (lower.includes('europa')) return 6;
  // 7. UEFA Cup Winners' Cup (Historic European Knockout)
  if (lower.includes('cup winners')) return 7;
  // 8. Carabao Cup / EFL Cup (Domestic League Cup)
  if (lower.includes('league cup') || lower.includes('carabao') || lower.includes('efl')) return 8;
  // 9. UEFA Super Cup (Continental Super Cup - check domestic first to avoid supercup clash)
  if (
    lower.includes('english supercup') ||
    lower.includes('community shield') ||
    lower.includes('charity shield')
  ) {
    return 10;
  }
  if (lower.includes('supercup') || lower.includes('super cup')) return 9;

  return 99;
}

interface ConquestDossier {
  seasonYear: string;
  opponent: string;
  score: string;
  scorers: string;
  venue: string;
  manager: string;
  keyNote: string;
}

const CONQUEST_DOSSIERS: Record<string, ConquestDossier> = {
  cup_winners: {
    seasonYear: '1990/91',
    opponent: 'FC Barcelona',
    score: '2 — 1',
    scorers: "Mark Hughes 67', 74'",
    venue: 'De Kuip, Rotterdam',
    manager: 'Sir Alex Ferguson',
    keyNote: "Historic triumph over Johan Cruyff's Barcelona, restoring English clubs to European prestige.",
  },
  europa_league: {
    seasonYear: '2016/17',
    opponent: 'AFC Ajax',
    score: '2 — 0',
    scorers: "Pogba 18', Mkhitaryan 48'",
    venue: 'Friends Arena, Stockholm',
    manager: 'José Mourinho',
    keyNote: 'Completed the full set of all European silverware in Manchester United history.',
  },
  club_world_cup: {
    seasonYear: '2008',
    opponent: 'LDU Quito',
    score: '1 — 0',
    scorers: "Wayne Rooney 73'",
    venue: 'Yokohama Stadium, Japan',
    manager: 'Sir Alex Ferguson',
    keyNote: '⚡ Crowned Champions of the World in Yokohama to complete the immortal 2008 World Treble alongside the Premier League and European Cup.',
  },
  intercontinental: {
    seasonYear: '1999',
    opponent: 'Palmeiras',
    score: '1 — 0',
    scorers: "Roy Keane 35'",
    venue: 'National Stadium, Tokyo',
    manager: 'Sir Alex Ferguson',
    keyNote: 'Crowned World Champions in Tokyo to complete the immortal 1999 Treble campaign.',
  },
  uefa_supercup: {
    seasonYear: '1991',
    opponent: 'Red Star Belgrade',
    score: '1 — 0',
    scorers: "Brian McClair 67'",
    venue: 'Old Trafford, Manchester',
    manager: 'Sir Alex Ferguson',
    keyNote: 'Conquered reigning European champions Red Star under the floodlights at Old Trafford.',
  },
};

function getConquestDossier(competitionName: string): ConquestDossier | null {
  const lower = competitionName.toLowerCase();
  if (lower.includes('cup winners')) return CONQUEST_DOSSIERS.cup_winners;
  if (lower.includes('europa')) return CONQUEST_DOSSIERS.europa_league;
  if (lower.includes('club world cup')) return CONQUEST_DOSSIERS.club_world_cup;
  if (lower.includes('intercontinental')) return CONQUEST_DOSSIERS.intercontinental;
  if (
    !lower.includes('english') &&
    (lower.includes('uefa supercup') || lower.includes('supercup') || lower.includes('super cup'))
  ) {
    return CONQUEST_DOSSIERS.uefa_supercup;
  }
  return null;
}

interface CampaignTelemetry {
  manager: string;
  keyStat: string;
  highlight: string;
}

function getCampaignTelemetry(competitionName: string, season: string): CampaignTelemetry {
  const lowerComp = competitionName.toLowerCase();
  const sYear = parseSeasonYear(season);

  // 1. Champions League
  if (lowerComp.includes('champions league') || lowerComp.includes('european champion')) {
    if (sYear === 1968) {
      return {
        manager: 'Sir Matt Busby',
        keyStat: 'Final: 4 — 1 vs Benfica',
        highlight: 'First English club to lift the European Cup; 10 years after Munich.',
      };
    }
    if (sYear === 1999) {
      return {
        manager: 'Sir Alex Ferguson',
        keyStat: 'Final: 2 — 1 vs Bayern Munich',
        highlight: '⭐ Sheringham & Solskjær injury-time goals seal the historic Treble.',
      };
    }
    if (sYear === 2008) {
      return {
        manager: 'Sir Alex Ferguson',
        keyStat: 'Final: 1 — 1 (6-5 pens) vs Chelsea',
        highlight: '⚡ European leg of 2008 World Treble: Ronaldo header & Van der Sar penalty save in Moscow rain.',
      };
    }
  }

  // 2. Premier League / English Champion
  if (lowerComp.includes('english champion') || lowerComp.includes('premier league')) {
    const plData: Record<number, { stat: string; note: string }> = {
      1908: { stat: '52 Pts • Turnbull (25)', note: 'First league title in Manchester United history.' },
      1911: { stat: '52 Pts • Halse (19)', note: 'Second league crown at the brand-new Old Trafford.' },
      1952: { stat: '57 Pts • Rowley (30)', note: "Sir Matt Busby's maiden championship triumph." },
      1956: { stat: '60 Pts • Taylor (25)', note: 'The legendary Busby Babes conquer English football.' },
      1957: { stat: '64 Pts • Taylor (22)', note: 'Busby Babes retain the league title with iconic swagger.' },
      1965: { stat: '62 Pts • Law (28)', note: 'Post-Munich rebirth led by the immortal Holy Trinity.' },
      1967: { stat: '60 Pts • Law (23)', note: 'Law, Charlton & Best power United to their 7th crown.' },
      1993: { stat: '84 Pts • Hughes (15)', note: 'Inaugural Premier League title; ended 26-year wait.' },
      1994: { stat: '92 Pts • Cantona (18)', note: 'First Premier League & FA Cup Double in club history.' },
      1996: { stat: '82 Pts • Cantona (14)', note: '"You can\'t win anything with kids" Double triumph.' },
      1997: { stat: '75 Pts • Solskjær (18)', note: 'Fourth Premier League title in five seasons.' },
      1999: { stat: '79 Pts • Yorke (18)', note: '⭐ League leg of the historic 1999 Treble campaign.' },
      2000: { stat: '91 Pts • Yorke (20)', note: 'Dominant title defense won by a record 18 points.' },
      2001: { stat: '80 Pts • Sheringham (15)', note: 'Historic three-peat of consecutive Premier League titles.' },
      2003: { stat: '83 Pts • Van Nistelrooy (25)', note: 'Overhauled an 8-point Arsenal lead in iconic spring run.' },
      2007: { stat: '89 Pts • Ronaldo (17)', note: 'Rooney & Ronaldo reignite the modern dynasty.' },
      2008: { stat: '87 Pts • Ronaldo (31)', note: '⚡ Domestic leg of 2008 World Treble (PL, UCL & Club World Cup).' },
      2009: { stat: '90 Pts • Ronaldo (18)', note: 'Second three-peat of consecutive Premier League titles.' },
      2011: { stat: '80 Pts • Berbatov (20)', note: 'Record 19th title to knock Liverpool off their perch.' },
      2013: { stat: '89 Pts • Van Persie (26)', note: "Sir Alex Ferguson's 20th league title & farewell masterclass." },
    };
    if (plData[sYear]) {
      const manager = sYear >= 1986 && sYear <= 2013 ? 'Sir Alex Ferguson' : sYear >= 1945 && sYear <= 1969 ? 'Sir Matt Busby' : 'Ernest Mangnall';
      return { manager, keyStat: plData[sYear].stat, highlight: plData[sYear].note };
    }
  }

  // 3. FA Cup
  if (lowerComp.includes('fa cup')) {
    const faData: Record<number, { mgr: string; stat: string; note: string }> = {
      1909: { mgr: 'Ernest Mangnall', stat: 'Final: 1 — 0 vs Bristol City', note: "Sandy Turnbull goal secures United's first FA Cup." },
      1948: { mgr: 'Sir Matt Busby', stat: 'Final: 4 — 2 vs Blackpool', note: "Busby's first major piece of silverware." },
      1963: { mgr: 'Sir Matt Busby', stat: 'Final: 3 — 1 vs Leicester City', note: 'Emotional first Wembley triumph after Munich.' },
      1977: { mgr: 'Tommy Docherty', stat: 'Final: 2 — 1 vs Liverpool', note: 'Denied Liverpool a treble at a rocking Wembley.' },
      1983: { mgr: 'Ron Atkinson', stat: 'Final: 4 — 0 vs Brighton', note: 'Bryan Robson masterclass in Wembley replay.' },
      1985: { mgr: 'Ron Atkinson', stat: 'Final: 1 — 0 vs Everton', note: "Norman Whiteside 110' curling stunner with 10 men." },
      1990: { mgr: 'Sir Alex Ferguson', stat: 'Final: 1 — 0 vs Palace (replay)', note: 'Lee Martin strike launched the Ferguson Dynasty.' },
      1994: { mgr: 'Sir Alex Ferguson', stat: 'Final: 4 — 0 vs Chelsea', note: 'Cantona penalty double seals historic Double.' },
      1996: { mgr: 'Sir Alex Ferguson', stat: 'Final: 1 — 0 vs Liverpool', note: "Cantona 85' volley seals the Double Double." },
      1999: { mgr: 'Sir Alex Ferguson', stat: 'Final: 2 — 0 vs Newcastle', note: '⭐ Sheringham & Scholes seal FA Cup leg of Treble.' },
      2004: { mgr: 'Sir Alex Ferguson', stat: 'Final: 3 — 0 vs Millwall', note: "Cristiano Ronaldo's first trophy in English football." },
      2016: { mgr: 'Louis van Gaal', stat: 'Final: 2 — 1 vs Palace (AET)', note: "Jesse Lingard 110' volley with 10 men." },
      2024: { mgr: 'Erik ten Hag', stat: 'Final: 2 — 1 vs Man City', note: 'Garnacho & Mainoo masterclass to stun rivals.' },
    };
    if (faData[sYear]) {
      return { manager: faData[sYear].mgr, keyStat: faData[sYear].stat, highlight: faData[sYear].note };
    }
  }

  // 4. League Cup / Carabao Cup
  if (lowerComp.includes('league cup') || lowerComp.includes('carabao') || lowerComp.includes('efl')) {
    const lcData: Record<number, { mgr: string; stat: string; note: string }> = {
      1992: { mgr: 'Sir Alex Ferguson', stat: 'Final: 1 — 0 vs Nottm Forest', note: "Brian McClair winner for United's first League Cup." },
      2006: { mgr: 'Sir Alex Ferguson', stat: 'Final: 4 — 0 vs Wigan', note: 'Rooney & Ronaldo rampage; catalyst for European era.' },
      2009: { mgr: 'Sir Alex Ferguson', stat: 'Final: 0 — 0 (4-1 pens) vs Spurs', note: 'Ben Foster heroics in penalty shootout.' },
      2010: { mgr: 'Sir Alex Ferguson', stat: 'Final: 2 — 1 vs Aston Villa', note: 'Wayne Rooney header retains League Cup.' },
      2017: { mgr: 'José Mourinho', stat: 'Final: 3 — 2 vs Southampton', note: "Zlatan Ibrahimović 87' header in Wembley thriller." },
      2023: { mgr: 'Erik ten Hag', stat: 'Final: 2 — 0 vs Newcastle', note: 'Casemiro & Rashford end 6-year trophy wait.' },
    };
    if (lcData[sYear]) {
      return { manager: lcData[sYear].mgr, keyStat: lcData[sYear].stat, highlight: lcData[sYear].note };
    }
  }

  // 5. Intelligent Fallback for Community Shield & any other campaign
  let manager = 'Sir Alex Ferguson';
  if (sYear >= 2022) manager = 'Erik ten Hag';
  else if (sYear >= 2016) manager = 'José Mourinho';
  else if (sYear >= 2014) manager = 'Louis van Gaal';
  else if (sYear >= 1986 && sYear <= 2013) manager = 'Sir Alex Ferguson';
  else if (sYear >= 1981 && sYear <= 1986) manager = 'Ron Atkinson';
  else if (sYear >= 1972 && sYear <= 1977) manager = 'Tommy Docherty';
  else if (sYear >= 1945 && sYear <= 1969) manager = 'Sir Matt Busby';
  else if (sYear <= 1912) manager = 'Ernest Mangnall';

  return {
    manager,
    keyStat: `Campaign Season: ${season}`,
    highlight: "Official silverware triumph added to United's golden cabinet.",
  };
}

function parseSeasonYear(season: string): number {
  const clean = season.trim();
  if (/^\d{4}$/.test(clean)) {
    return parseInt(clean, 10);
  }
  if (/^\d{4}\/\d{2}$/.test(clean)) {
    const startYear = parseInt(clean.substring(0, 4), 10);
    return startYear + 1;
  }
  if (/^\d{2}\/\d{2}$/.test(clean)) {
    const endPart = parseInt(clean.substring(3, 5), 10);
    return endPart <= 35 ? 2000 + endPart : 1900 + endPart;
  }
  const match4 = clean.match(/\b(19\d{2}|20\d{2})\b/);
  if (match4) return parseInt(match4[0], 10);
  return 2000;
}

function matchesSeasonHighlight(season: string, highlight: string | null): boolean {
  if (!highlight) return false;
  const sYear = parseSeasonYear(season);
  if (highlight === 'saf') return sYear >= 1987 && sYear <= 2013;
  if (highlight === 'busby') return sYear >= 1946 && sYear <= 1969;
  if (highlight === '1999') return season.includes('1998/99') || season.includes('1999') || sYear === 1999;
  if (highlight === '2008') return season.includes('2007/08') || season.includes('2008') || sYear === 2008;
  return season.includes(highlight) || (highlight.length === 4 && season.startsWith(highlight));
}

interface DynastyBreakdown {
  safCount: number; // Sir Alex Ferguson (1986 - 2013)
  busbyCount: number; // Sir Matt Busby (1945 - 1969)
  postSafCount: number; // 2014 - Present
  heritageCount: number; // Pre-1945 & 1970-1985
  earliestYear: number;
  latestYear: number;
  spanYears: number;
}

function getDynastyBreakdown(winningSeasons: string[]): DynastyBreakdown {
  let safCount = 0;
  let busbyCount = 0;
  let postSafCount = 0;
  let heritageCount = 0;
  let earliestYear = 9999;
  let latestYear = 0;

  winningSeasons.forEach((season) => {
    const year = parseSeasonYear(season);
    if (year < earliestYear) earliestYear = year;
    if (year > latestYear) latestYear = year;

    if (year >= 1987 && year <= 2013) {
      safCount++;
    } else if (year >= 1946 && year <= 1969) {
      busbyCount++;
    } else if (year >= 2014) {
      postSafCount++;
    } else {
      heritageCount++;
    }
  });

  if (earliestYear === 9999) earliestYear = 2000;
  if (latestYear === 0) latestYear = 2000;

  const spanYears = latestYear >= earliestYear ? latestYear - earliestYear + 1 : 1;

  return {
    safCount,
    busbyCount,
    postSafCount,
    heritageCount,
    earliestYear,
    latestYear,
    spanYears,
  };
}

interface DecadeBucket {
  label: string;
  fullDecade: string;
  startYear: number;
  endYear: number;
  count: number;
  seasons: string[];
}

const DECADE_INTERVALS = [
  { label: '00s', fullDecade: '1900s', startYear: 1900, endYear: 1909 },
  { label: '10s', fullDecade: '1910s', startYear: 1910, endYear: 1919 },
  { label: '40s', fullDecade: '1940s', startYear: 1940, endYear: 1949 },
  { label: '50s', fullDecade: '1950s', startYear: 1950, endYear: 1959 },
  { label: '60s', fullDecade: '1960s', startYear: 1960, endYear: 1969 },
  { label: '70s', fullDecade: '1970s', startYear: 1970, endYear: 1979 },
  { label: '80s', fullDecade: '1980s', startYear: 1980, endYear: 1989 },
  { label: '90s', fullDecade: '1990s', startYear: 1990, endYear: 1999 },
  { label: '00s', fullDecade: '2000s', startYear: 2000, endYear: 2009 },
  { label: '10s', fullDecade: '2010s', startYear: 2010, endYear: 2019 },
  { label: '20s', fullDecade: '2020s', startYear: 2020, endYear: 2029 },
];

function getDecadeDistribution(winningSeasons: string[]): DecadeBucket[] {
  return DECADE_INTERVALS.map((dec) => {
    const matchingSeasons = winningSeasons.filter((s) => {
      const yr = parseSeasonYear(s);
      return yr >= dec.startYear && yr <= dec.endYear;
    });

    return {
      ...dec,
      count: matchingSeasons.length,
      seasons: matchingSeasons,
    };
  });
}

type SortOption = 'prestige' | 'dominance' | 'recent' | 'heritage';

export default function HistoryPage() {
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | CompetitionCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('prestige');
  const [highlightSeason, setHighlightSeason] = useState<string | null>(null);

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

  // Category counts
  const categoryCounts = useMemo(() => {
    let domestic = 0;
    let european = 0;
    let world = 0;
    trophies.forEach((t) => {
      const cat = getCompetitionMeta(t.competitionName).category;
      if (cat === 'domestic') domestic += t.totalCount;
      else if (cat === 'european') european += t.totalCount;
      else if (cat === 'world') world += t.totalCount;
    });
    return {
      all: trophies.reduce((acc, t) => acc + t.totalCount, 0),
      domestic,
      european,
      world,
    };
  }, [trophies]);

  // Filtered and Sorted Trophies
  const filteredTrophies = useMemo(() => {
    let result = [...trophies];

    // 1. Filter by category
    if (activeCategory !== 'all') {
      result = result.filter(
        (t) => getCompetitionMeta(t.competitionName).category === activeCategory
      );
    }

    // 2. Sort
    result.sort((a, b) => {
      if (sortBy === 'prestige') {
        const rankA = getPrestigeRank(a.competitionName);
        const rankB = getPrestigeRank(b.competitionName);
        if (rankA !== rankB) return rankA - rankB;
        return b.totalCount - a.totalCount;
      }
      if (sortBy === 'dominance') {
        return b.totalCount - a.totalCount;
      }
      if (sortBy === 'recent') {
        const aDynasty = getDynastyBreakdown(a.winningSeasons);
        const bDynasty = getDynastyBreakdown(b.winningSeasons);
        if (bDynasty.latestYear !== aDynasty.latestYear) {
          return bDynasty.latestYear - aDynasty.latestYear;
        }
        return b.totalCount - a.totalCount;
      }
      if (sortBy === 'heritage') {
        const aDynasty = getDynastyBreakdown(a.winningSeasons);
        const bDynasty = getDynastyBreakdown(b.winningSeasons);
        if (aDynasty.earliestYear !== bDynasty.earliestYear) {
          return aDynasty.earliestYear - bDynasty.earliestYear;
        }
        return b.totalCount - a.totalCount;
      }
      return 0;
    });

    return result;
  }, [trophies, activeCategory, sortBy]);

  return (
    <div className="min-h-screen bg-transparent text-white pt-32 px-6 md:px-12 max-w-7xl mx-auto relative z-0">
      
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

      {/* THE OFFICIAL SILVERWARE CABINET (Obsidian Titanium Vault) */}
      <div id="trophy-vault" className="mt-24 w-full pb-24 pt-20 md:pt-24 px-6 md:px-10 relative overflow-hidden rounded-[32px] scroll-mt-28 bg-[#0B0E14]/90 backdrop-blur-2xl border border-[#D4AF37]/20 shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.08)]">
        {/* Subtle Cyber Grid & Ambient Radial Lighting */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% -10%, rgba(212, 175, 55, 0.25) 0%, transparent 60%),
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 32px 32px, 32px 32px'
          }}
        />

        <div className="relative z-10 text-center mb-12">
          <div className="inline-block px-3 py-1 mb-3 text-[11px] font-mono font-semibold tracking-widest text-[#E3B044] border border-[#E3B044]/30 rounded-full bg-[#E3B044]/10 shadow-[0_0_15px_rgba(227,176,68,0.2)]">
            DIGITAL SANCTUARY &bull; ARCHIVAL DOMINANCE VAULT
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight uppercase drop-shadow-md">
            THE TROPHY MONOLITHS
          </h2>
          <p className="text-neutral-400 font-light text-base md:text-lg max-w-2xl mx-auto">
            Decade-by-Decade Telemetry of Manchester United&apos;s {totalSilverware} Major Silverware Conquests
          </p>
        </div>

        {/* Interactive Telemetry Control Bar (Filter & Sort Strip) */}
        <div className="relative z-20 mb-10 flex flex-col md:flex-row items-center justify-between gap-4 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/5 shadow-inner">
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'ALL SILVERS', count: categoryCounts.all },
              { id: 'domestic', label: 'DOMESTIC', count: categoryCounts.domestic },
              { id: 'european', label: 'EUROPEAN', count: categoryCounts.european },
              { id: 'world', label: 'WORLD', count: categoryCounts.world },
            ].map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id as 'all' | CompetitionCategory)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#D4AF37]/20 border border-[#D4AF37] text-[#FCEEAC] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                      : 'bg-black/30 border border-white/10 text-neutral-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      isActive ? 'bg-[#D4AF37]/30 text-[#FCEEAC]' : 'bg-white/10 text-neutral-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort Selector Controller */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-4">
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase hidden sm:inline">
              SORT:
            </span>
            {[
              { id: 'prestige', label: 'PRESTIGE' },
              { id: 'dominance', label: 'DOMINANCE' },
              { id: 'recent', label: 'RECENT' },
              { id: 'heritage', label: 'HERITAGE' },
            ].map((sortOption) => {
              const isSelected = sortBy === sortOption.id;
              return (
                <button
                  key={sortOption.id}
                  onClick={() => setSortBy(sortOption.id as SortOption)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-white/15 border border-white/30 text-white shadow-sm'
                      : 'bg-transparent border border-white/5 text-neutral-500 hover:text-neutral-300 hover:border-white/10'
                  }`}
                >
                  {sortOption.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Era & Dynasty Highlights Strip */}
        <div className="relative z-20 mb-8 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[10px] font-mono tracking-widest text-[#D4AF37]/80 uppercase mr-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
            DYNASTY PRESETS:
          </span>
          {[
            { id: '1999', label: '⭐ 1999 TREBLE', tooltip: 'PL + FA Cup + Champions League' },
            { id: '2008', label: '⚡ 2008 WORLD TREBLE', tooltip: 'PL + Champions League + FIFA Club World Cup' },
            { id: 'saf', label: '🏆 SAF ERA (38)', tooltip: 'Sir Alex Ferguson 1986-2013' },
            { id: 'busby', label: '👑 BUSBY ERA (13)', tooltip: 'Sir Matt Busby 1945-1969' },
          ].map((preset) => {
            const isSelected = highlightSeason === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setHighlightSeason(isSelected ? null : preset.id)}
                title={preset.tooltip}
                className={`px-3 py-1 rounded-full text-[11px] font-mono font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#D4AF37] text-neutral-950 font-bold shadow-[0_0_15px_rgba(212,175,55,0.6)] scale-105'
                    : 'bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:border-[#D4AF37]/40 hover:bg-white/10'
                }`}
              >
                <span>{preset.label}</span>
                {isSelected && (
                  <span className="text-[10px] bg-black/30 rounded-full px-1">
                    &times;
                  </span>
                )}
              </button>
            );
          })}
          {highlightSeason && (
            <button
              onClick={() => setHighlightSeason(null)}
              className="text-[10px] font-mono text-neutral-400 hover:text-white underline ml-2 cursor-pointer"
            >
              Clear Preset
            </button>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-6 relative z-10 px-4">
          {filteredTrophies.map((trophy) => {
            const meta = getCompetitionMeta(trophy.competitionName);
            const dynasty = getDynastyBreakdown(trophy.winningSeasons);
            const decadeBuckets = getDecadeDistribution(trophy.winningSeasons);
            const maxDecadeCount = Math.max(...decadeBuckets.map((b) => b.count), 1);
            const activeDecadesCount = decadeBuckets.filter((b) => b.count > 0).length;
            const isHighDensity = activeDecadesCount > 6;
            const hasFilter = Boolean(highlightSeason);
            const isCardHighlighted = hasFilter
              ? trophy.winningSeasons.some((s) => matchesSeasonHighlight(s, highlightSeason))
              : false;
            const dossier = getConquestDossier(trophy.competitionName);

            return (
              <motion.div
                key={trophy.id}
                whileHover={{ y: -8, scale: isCardHighlighted ? 1.03 : 1.015 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] shrink-0 flex flex-col justify-between min-h-[480px] p-6 rounded-2xl relative overflow-visible backdrop-blur-xl transition-all duration-300 ${
                  isCardHighlighted
                    ? 'bg-gradient-to-b from-[#D4AF37]/15 via-neutral-950/85 to-neutral-950/95 border-[#D4AF37] ring-1 ring-[#D4AF37]/70 shadow-[0_0_40px_rgba(212,175,55,0.35),inset_0_1px_2px_rgba(255,255,255,0.3)] scale-[1.02] z-20'
                    : hasFilter
                    ? 'bg-neutral-950/50 border-white/5 opacity-40 grayscale-[40%] scale-[0.98]'
                    : 'bg-neutral-950/70 border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),_0_12px_32px_rgba(0,0,0,0.85)] hover:shadow-[0_0_35px_rgba(212,175,55,0.25),inset_0_1px_2px_rgba(255,255,255,0.2)] hover:border-[#D4AF37]/50'
                }`}
              >
                {/* Tactical Tier Chip & Match Indicator */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-bold tracking-widest uppercase rounded-md border ${meta.badgeColor}`}
                  >
                    {meta.tierTag}
                  </span>

                  {isCardHighlighted && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest uppercase rounded bg-[#D4AF37]/20 border border-[#D4AF37]/60 text-[#FCEEAC] shadow-[0_0_10px_rgba(212,175,55,0.4)] animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_4px_#D4AF37]" />
                      ERA BLOOM
                    </span>
                  )}
                </div>
                {/* Typography Hero: Total Win Count */}
                <div className="text-6xl sm:text-7xl font-black font-display tracking-tight leading-none select-none bg-gradient-to-b from-[#FCEEAC] via-[#D4AF37] to-[#78350F] bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(212,175,55,0.3)]">
                  {trophy.totalCount}X
                </div>

                {/* Competition Name & Span of Dominance Telemetry */}
                <div className="mt-3 mb-5">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white leading-snug">
                      {meta.displayName}
                    </h3>
                    {meta.heritageAlias && (
                      <span className="text-[9px] font-mono tracking-wider text-neutral-400 px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 select-none">
                        {meta.heritageAlias}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-neutral-400 mt-2 select-none">
                    {trophy.totalCount > 1 ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-neutral-300">
                        <span className="text-neutral-500 text-[9px] font-bold">SPAN</span>
                        <span className="text-white font-semibold">{dynasty.earliestYear}</span>
                        <span className="text-[#D4AF37]">&rarr;</span>
                        <span className="text-white font-semibold">{dynasty.latestYear}</span>
                        <span className="text-[#D4AF37]/90 font-bold ml-0.5">({dynasty.spanYears} YRS)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-neutral-300">
                        <span className="text-neutral-500 text-[9px] font-bold">SOLO TRIUMPH</span>
                        <span className="text-white font-semibold">{dynasty.earliestYear}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Constellation & Telemetry Matrix Container */}
                <div className="bg-black/25 backdrop-blur-sm rounded-xl p-4 border border-white/5 flex-1 flex flex-col justify-between">
                  {dossier ? (
                    /* 1-Win Archival Conquest Spotlight Dossier */
                    <div className="flex flex-col justify-between h-full">
                      <div className="space-y-2.5">
                        {/* Dossier Header with Interactive Year Chip */}
                        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-[#D4AF37]/80 uppercase select-none">
                          <span className="flex items-center gap-1.5 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                            CONQUEST DOSSIER
                          </span>
                          {trophy.winningSeasons.map((season) => {
                            const sYear = parseSeasonYear(season);
                            const shortYear = String(sYear % 100).padStart(2, '0');
                            const isTrebleYear = sYear === 1999;
                            const isDoubleYear = sYear === 2008;
                            const isNodeHighlighted = matchesSeasonHighlight(season, highlightSeason);
                            const eraBadge = sYear >= 1987 && sYear <= 2013
                              ? { color: 'text-[#FCEEAC]', chipStyle: 'bg-[#D4AF37]/20 text-[#FCEEAC] border-[#D4AF37]/50 hover:bg-[#D4AF37]/35' }
                              : sYear >= 1946 && sYear <= 1969
                              ? { color: 'text-cyan-300', chipStyle: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 hover:bg-cyan-500/35' }
                              : sYear >= 2014
                              ? { color: 'text-red-300', chipStyle: 'bg-red-500/20 text-red-200 border-red-500/50 hover:bg-red-500/35' }
                              : { color: 'text-neutral-300', chipStyle: 'bg-slate-700/25 text-slate-300 border-slate-600/50 hover:bg-slate-700/40' };

                            return (
                              <button
                                key={season}
                                type="button"
                                onClick={() => setHighlightSeason(highlightSeason === season ? null : season)}
                                title={`Click to filter season ${season} across all trophies`}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[10px] font-mono font-bold tracking-tight transition-all duration-200 cursor-pointer select-none border ${
                                  isNodeHighlighted
                                    ? 'bg-[#FCEEAC] text-neutral-950 border-white scale-105 shadow-[0_0_12px_rgba(255,255,255,0.9)] ring-2 ring-[#D4AF37]'
                                    : hasFilter
                                    ? 'bg-neutral-900/60 border-white/5 text-neutral-600 opacity-30'
                                    : eraBadge.chipStyle
                                }`}
                              >
                                {isTrebleYear && <span className="text-[9px]">⭐</span>}
                                {isDoubleYear && <span className="text-[9px]">⚡</span>}
                                <span>&apos;{shortYear}</span>
                                <span className="text-[9px] opacity-75 font-normal">({season})</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Final Showdown Plaque */}
                        <div className="p-3 rounded-lg bg-black/45 border border-white/10 shadow-inner">
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                            <span className="text-neutral-400 font-bold uppercase tracking-wider">
                              FINAL SHOWDOWN
                            </span>
                            <div className="flex items-center gap-1.5">
                              {dossier.seasonYear === '2008' && (
                                <span className="text-[#E3B044] font-bold px-1.5 py-0.2 rounded bg-[#E3B044]/15 border border-[#E3B044]/30 text-[9px] shadow-[0_0_8px_rgba(227,176,68,0.3)]">
                                  ⚡ WORLD TREBLE
                                </span>
                              )}
                              {dossier.seasonYear === '1999' && (
                                <span className="text-[#E3B044] font-bold px-1.5 py-0.2 rounded bg-[#E3B044]/15 border border-[#E3B044]/30 text-[9px] shadow-[0_0_8px_rgba(227,176,68,0.3)]">
                                  ⭐ TREBLE CROWN
                                </span>
                              )}
                              <span className="text-emerald-400 font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 text-[9px]">
                                VICTORY
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white truncate" title={dossier.opponent}>
                              vs {dossier.opponent}
                            </span>
                            <span className="font-mono font-black text-xs sm:text-sm text-[#FCEEAC] bg-[#D4AF37]/20 px-2 py-0.5 rounded border border-[#D4AF37]/40 shadow-[0_0_8px_rgba(212,175,55,0.25)] shrink-0">
                              {dossier.score}
                            </span>
                          </div>

                          <div className="text-[10px] font-mono text-neutral-300 mt-2 flex items-start gap-1 leading-tight">
                            <span className="text-[#D4AF37] font-bold">&bull;</span>
                            <span>
                              <span className="text-neutral-400">Goals: </span>
                              <span className="text-white font-medium">{dossier.scorers}</span>
                            </span>
                          </div>

                          <div className="text-[9px] font-mono text-neutral-400 mt-2 flex items-center justify-between border-t border-white/5 pt-1.5">
                            <span className="truncate max-w-[130px]">📍 {dossier.venue}</span>
                            <span className="text-neutral-300 font-medium">👔 {dossier.manager}</span>
                          </div>
                        </div>

                        {/* Historical Significance Micro-Note */}
                        <p className="text-[10px] font-mono text-neutral-400 leading-snug italic px-0.5">
                          &ldquo;{dossier.keyNote}&rdquo;
                        </p>
                      </div>

                      {/* Chrono Barcode for visual symmetry */}
                      <div className="mt-auto pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between text-[9px] font-mono tracking-widest text-neutral-400 uppercase mb-2 select-none">
                          <span>CHRONO BARCODE</span>
                          <span className="text-[#D4AF37]/80">SOLO CONQUEST</span>
                        </div>
                        <div className="grid grid-cols-11 gap-1 items-end h-13 sm:h-14 px-1.5 pt-1.5 pb-1.5 rounded-lg bg-black/50 border border-white/10 shadow-inner">
                          {decadeBuckets.map((bucket, bIdx) => {
                            const hasWins = bucket.count > 0;
                            const hasHighlightedSeasonInBucket = hasFilter
                              ? bucket.seasons.some((s) => matchesSeasonHighlight(s, highlightSeason))
                              : false;
                            const heightPercent = hasWins ? 100 : 15;
                            const tooltipAlignClass = bIdx === 0
                              ? 'left-0'
                              : bIdx === decadeBuckets.length - 1
                              ? 'right-0'
                              : 'left-1/2 -translate-x-1/2';

                            return (
                              <div
                                key={bucket.label}
                                className="group/decade relative flex flex-col items-center justify-end h-full cursor-pointer"
                              >
                                <div
                                  className={`w-full rounded-t-sm transition-all duration-300 ${
                                    hasHighlightedSeasonInBucket
                                      ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,1),0_0_8px_rgba(212,175,55,1)] ring-1 ring-[#D4AF37]'
                                      : hasWins
                                      ? hasFilter
                                        ? 'bg-[#D4AF37]/40 opacity-40'
                                        : 'bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.7)]'
                                      : 'bg-white/10 group-hover/decade:bg-white/20'
                                  }`}
                                  style={{ height: `${heightPercent}%` }}
                                />
                                {/* Decade Label or Laser Tick */}
                                {hasWins ? (
                                  <span className="text-[9px] font-mono font-bold text-[#FCEEAC] mt-1 select-none transition-transform group-hover/decade:scale-110 drop-shadow-[0_0_6px_rgba(212,175,55,0.5)] leading-tight tracking-tight whitespace-nowrap">
                                    &apos;{String(bucket.startYear % 100).padStart(2, '0')}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-white/20 mt-1 select-none transition-colors group-hover/decade:text-neutral-300 leading-tight">
                                    &bull;
                                  </span>
                                )}

                                {/* Laser Hover Tooltip */}
                                <div className={`pointer-events-none absolute -top-9 opacity-0 group-hover/decade:opacity-100 group-hover/decade:-translate-y-1 transition-all duration-150 px-2.5 py-1 text-[10px] font-mono font-bold text-[#FCEEAC] bg-neutral-950/98 border border-[#D4AF37]/60 rounded-md shadow-2xl whitespace-nowrap z-50 ${tooltipAlignClass}`}>
                                  <span className="text-white">{bucket.fullDecade}:</span>{' '}
                                  {hasWins ? (
                                    <>
                                      {bucket.count} {bucket.count === 1 ? 'title' : 'titles'}
                                      {bucket.count <= 3 ? ` (${bucket.seasons.join(', ')})` : ` (${bucket.seasons[0]} → ${bucket.seasons[bucket.seasons.length - 1]})`}
                                    </>
                                  ) : (
                                    <span className="text-neutral-400 font-normal">0 titles</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Multi-Win Seasons Matrix */
                    <div className="flex flex-col justify-between h-full">
                      <div>
                        <div className="text-[10px] font-mono tracking-widest text-[#D4AF37]/70 uppercase mb-3 select-none flex items-center justify-between">
                        <span>SEASONS MATRIX</span>
                        <span className="text-white/40">{trophy.winningSeasons.length} TITLES</span>
                      </div>

                      {/* Constellation Cluster of Readable Year Chips */}
                      <div className="flex flex-wrap gap-1.5 items-center py-1">
                        {trophy.winningSeasons.map((season, sIdx) => {
                          const sYear = parseSeasonYear(season);
                          const shortYear = String(sYear % 100).padStart(2, '0');
                          const isTrebleYear = sYear === 1999;
                          const isDoubleYear = sYear === 2008;
                          const isLatest = sIdx === trophy.winningSeasons.length - 1;
                          const isNodeHighlighted = matchesSeasonHighlight(season, highlightSeason);

                          const eraBadge = sYear >= 1987 && sYear <= 2013
                            ? { 
                                label: 'SAF ERA', 
                                color: 'text-[#FCEEAC]',
                                chipStyle: 'bg-[#D4AF37]/15 text-[#FCEEAC] border-[#D4AF37]/40 hover:bg-[#D4AF37]/30 hover:border-[#D4AF37] hover:shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                              }
                            : sYear >= 1946 && sYear <= 1969
                            ? { 
                                label: 'BUSBY ERA', 
                                color: 'text-cyan-300',
                                chipStyle: 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40 hover:bg-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                              }
                            : sYear >= 2014
                            ? { 
                                label: 'POST-SAF', 
                                color: 'text-red-300',
                                chipStyle: 'bg-red-500/15 text-red-200 border-red-500/40 hover:bg-red-500/30 hover:border-red-400 hover:shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                              }
                            : { 
                                label: 'HERITAGE', 
                                color: 'text-neutral-300',
                                chipStyle: 'bg-slate-700/20 text-slate-300 border-slate-600/40 hover:bg-slate-700/35 hover:border-slate-400 hover:shadow-[0_0_10px_rgba(148,163,184,0.3)]'
                              };

                          const telemetry = getCampaignTelemetry(trophy.competitionName, season);
                          const col = sIdx % 5;
                          const isLeftAlign = col <= 1;
                          const isRightAlign = col >= 3;
                          const popoverAlignClass = isLeftAlign
                            ? 'left-0'
                            : isRightAlign
                            ? 'right-0'
                            : 'left-1/2 -translate-x-1/2';
                          const caretAlignClass = isLeftAlign
                            ? 'left-3.5'
                            : isRightAlign
                            ? 'right-3.5'
                            : 'left-1/2 -translate-x-1/2';

                          return (
                            <div
                              key={`${trophy.id}-${season}-${sIdx}`}
                              className="relative group/node flex items-center justify-center hover:z-50"
                            >
                              {/* Radar Pulse Beacon on Latest Win */}
                              {isLatest && !hasFilter && (
                                <span className="absolute -inset-0.5 rounded-[6px] bg-[#D4AF37]/30 animate-pulse pointer-events-none" />
                              )}

                              {/* Interactive Year Chip */}
                              <button
                                type="button"
                                onClick={() => setHighlightSeason(highlightSeason === season ? null : season)}
                                title={`Click to filter season ${season} across all trophies`}
                                className={`inline-flex items-center justify-center px-1.5 py-0.5 min-w-[30px] h-5 rounded-[5px] text-[10px] font-mono font-bold tracking-tight transition-all duration-200 cursor-pointer select-none border relative z-10 ${
                                  isNodeHighlighted
                                    ? 'bg-[#FCEEAC] text-neutral-950 border-white scale-110 shadow-[0_0_16px_rgba(255,255,255,0.9),0_0_8px_rgba(212,175,55,1)] ring-2 ring-[#D4AF37]'
                                    : hasFilter
                                    ? 'bg-neutral-900/60 border-white/5 text-neutral-600 opacity-25 scale-95'
                                    : eraBadge.chipStyle
                                }`}
                              >
                                {isTrebleYear && <span className="mr-0.5 text-[9px] drop-shadow-sm">⭐</span>}
                                {isDoubleYear && <span className="mr-0.5 text-[9px] drop-shadow-sm">⚡</span>}
                                <span>&apos;{shortYear}</span>
                              </button>

                              {/* Interactive Campaign Telemetry Micro-Popover */}
                              <div
                                className={`pointer-events-none absolute bottom-full mb-2.5 opacity-0 group-hover/node:opacity-100 group-hover/node:-translate-y-1 transition-all duration-200 w-52 sm:w-56 max-w-[240px] p-3 text-[10px] font-mono bg-[#0A0D14] border border-[#D4AF37]/80 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,1)] z-50 flex flex-col gap-1.5 ${popoverAlignClass}`}
                              >
                                {/* Popover Header: Season + Era + Icons */}
                                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-white font-bold text-xs">{season}</span>
                                    {isTrebleYear && (
                                      <span className="text-[9px] font-bold text-[#E3B044] bg-[#E3B044]/15 px-1 rounded border border-[#E3B044]/30">
                                        ⭐ TREBLE
                                      </span>
                                    )}
                                    {isDoubleYear && (
                                      <span className="text-[9px] font-bold text-[#E3B044] bg-[#E3B044]/15 px-1 rounded border border-[#E3B044]/30">
                                        ⚡ WORLD TREBLE
                                      </span>
                                    )}
                                  </div>
                                  <span className={`text-[9px] font-bold ${eraBadge.color}`}>{eraBadge.label}</span>
                                </div>

                                {/* Manager & Key Match / Points Stat */}
                                <div className="space-y-1.5 py-1">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-neutral-400 font-semibold">Manager:</span>
                                    <span className="font-bold text-white">👔 {telemetry.manager}</span>
                                  </div>
                                  <div className="flex items-start justify-between gap-1 text-[10px]">
                                    <span className="text-neutral-400 font-semibold shrink-0">Details:</span>
                                    <span className="text-[#FCEEAC] font-semibold text-right leading-tight">{telemetry.keyStat}</span>
                                  </div>
                                </div>

                                {/* Archival Milestone Note */}
                                <p className="text-[9.5px] text-neutral-200 font-medium leading-relaxed border-t border-white/10 pt-1.5 break-words">
                                  <span className="text-[#D4AF37] font-bold mr-0.5">&ldquo;</span>
                                  {telemetry.highlight}
                                  <span className="text-[#D4AF37] font-bold ml-0.5">&rdquo;</span>
                                </p>

                                {/* Action Prompt Callout */}
                                <div className="text-[9px] text-[#FCEEAC] font-bold uppercase tracking-wider text-center pt-1 border-t border-white/5 flex items-center justify-center gap-1">
                                  <span className="text-[#D4AF37]">✦</span>
                                  <span>CLICK TO CROSS-FILTER VAULT</span>
                                </div>

                                {/* Downward Arrow Caret */}
                                <div className={`absolute top-full border-4 border-transparent border-t-[#D4AF37]/80 ${caretAlignClass}`} />
                                <div className={`absolute top-full -mt-[1px] border-4 border-transparent border-t-[#0A0D14] ${caretAlignClass}`} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Decade Timeline Barcode Matrix */}
                    <div className="mt-auto pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between text-[9px] font-mono tracking-widest text-neutral-400 uppercase mb-2 select-none">
                          <span>CHRONO BARCODE</span>
                          <span className="text-[#D4AF37]/80">1900 &mdash; 2020s</span>
                        </div>

                        <div className="grid grid-cols-11 gap-1 items-end h-13 sm:h-14 px-1.5 pt-1.5 pb-1.5 rounded-lg bg-black/50 border border-white/10 shadow-inner">
                          {decadeBuckets.map((bucket, bIdx) => {
                            const hasWins = bucket.count > 0;
                            const isMilestone = bIdx === 0 || bIdx === 3 || bIdx === 7 || bIdx === 10;
                            const hasHighlightedSeasonInBucket = hasFilter
                              ? bucket.seasons.some((s) => matchesSeasonHighlight(s, highlightSeason))
                              : false;
                            const heightPercent = hasWins
                              ? Math.max(35, Math.round((bucket.count / maxDecadeCount) * 100))
                              : 15;
                            const tooltipAlignClass = bIdx === 0
                              ? 'left-0'
                              : bIdx === decadeBuckets.length - 1
                              ? 'right-0'
                              : 'left-1/2 -translate-x-1/2';
                            const showDecadeLabel = !isHighDensity
                              ? hasWins
                              : (isMilestone || hasHighlightedSeasonInBucket);

                            return (
                              <div
                                key={bucket.label}
                                className="group/decade relative flex flex-col items-center justify-end h-full cursor-pointer"
                              >
                                {/* Vertical Laser Tick Bar */}
                                <div
                                  className={`w-full rounded-t-sm transition-all duration-300 ${
                                    hasHighlightedSeasonInBucket
                                      ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,1),0_0_8px_rgba(212,175,55,1)] ring-1 ring-[#D4AF37]'
                                      : hasWins
                                      ? hasFilter
                                        ? 'bg-[#D4AF37]/40 opacity-40'
                                        : 'bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.7)] group-hover/decade:bg-[#FCEEAC] group-hover/decade:shadow-[0_0_14px_rgba(252,238,172,0.95)]'
                                      : 'bg-white/10 group-hover/decade:bg-white/20'
                                  }`}
                                  style={{ height: `${heightPercent}%` }}
                                />

                                {/* Decade Label or Laser Tick */}
                                {showDecadeLabel ? (
                                  <span
                                    className={`text-[9px] font-mono font-bold mt-1 select-none transition-transform group-hover/decade:scale-110 leading-tight tracking-tight whitespace-nowrap ${
                                      hasHighlightedSeasonInBucket
                                        ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]'
                                        : hasWins
                                        ? 'text-[#FCEEAC] drop-shadow-[0_0_6px_rgba(212,175,55,0.5)]'
                                        : 'text-neutral-500 font-semibold'
                                    }`}
                                  >
                                    &apos;{String(bucket.startYear % 100).padStart(2, '0')}
                                  </span>
                                ) : hasWins ? (
                                  <span className="text-[10px] font-mono font-black text-[#D4AF37] mt-1 select-none transition-transform group-hover/decade:scale-125 drop-shadow-[0_0_6px_rgba(212,175,55,0.8)] leading-tight">
                                    &bull;
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-white/20 mt-1 select-none transition-colors group-hover/decade:text-neutral-300 leading-tight">
                                    &bull;
                                  </span>
                                )}

                                {/* Laser Hover Tooltip */}
                                <div className={`pointer-events-none absolute -top-9 opacity-0 group-hover/decade:opacity-100 group-hover/decade:-translate-y-1 transition-all duration-150 px-2.5 py-1 text-[10px] font-mono font-bold text-[#FCEEAC] bg-neutral-950/98 border border-[#D4AF37]/60 rounded-md shadow-2xl whitespace-nowrap z-50 ${tooltipAlignClass}`}>
                                  <span className="text-white">{bucket.fullDecade}:</span>{' '}
                                  {hasWins ? (
                                    <>
                                      {bucket.count} {bucket.count === 1 ? 'title' : 'titles'}
                                      {bucket.count <= 3 ? ` (${bucket.seasons.join(', ')})` : ` (${bucket.seasons[0]} → ${bucket.seasons[bucket.seasons.length - 1]})`}
                                    </>
                                  ) : (
                                    <span className="text-neutral-400 font-normal">0 titles</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dynasty Telemetry Footer */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-[9px] font-mono tracking-widest text-neutral-400 uppercase mb-1.5 select-none">
                    <span>DYNASTY TELEMETRY</span>
                    <span className="text-[#D4AF37]/80">
                      {trophy.totalCount} {trophy.totalCount === 1 ? 'WIN' : 'WINS'}
                    </span>
                  </div>

                  {/* Segmented Dynasty Proportion Bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden flex gap-0.5 mb-2">
                    {dynasty.safCount > 0 && (
                      <div
                        className="h-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.7)]"
                        style={{ width: `${(dynasty.safCount / trophy.totalCount) * 100}%` }}
                        title={`SAF: ${dynasty.safCount}`}
                      />
                    )}
                    {dynasty.busbyCount > 0 && (
                      <div
                        className="h-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)]"
                        style={{ width: `${(dynasty.busbyCount / trophy.totalCount) * 100}%` }}
                        title={`Busby: ${dynasty.busbyCount}`}
                      />
                    )}
                    {dynasty.postSafCount > 0 && (
                      <div
                        className="h-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]"
                        style={{ width: `${(dynasty.postSafCount / trophy.totalCount) * 100}%` }}
                        title={`Post-SAF: ${dynasty.postSafCount}`}
                      />
                    )}
                    {dynasty.heritageCount > 0 && (
                      <div
                        className="h-full bg-neutral-500"
                        style={{ width: `${(dynasty.heritageCount / trophy.totalCount) * 100}%` }}
                        title={`Heritage: ${dynasty.heritageCount}`}
                      />
                    )}
                  </div>

                  {/* Dynasty Badges Strip */}
                  {trophy.totalCount === 1 ? (
                    <div className="flex items-center justify-between text-[9px] font-mono select-none px-2 py-1 rounded bg-white/[0.03] border border-white/5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            dynasty.safCount === 1
                              ? 'bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.8)]'
                              : dynasty.busbyCount === 1
                              ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]'
                              : dynasty.postSafCount === 1
                              ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                              : 'bg-neutral-500'
                          }`}
                        />
                        <span className="text-neutral-400 shrink-0">SOLO ERA:</span>
                        <span
                          className={`font-bold uppercase truncate ${
                            dynasty.safCount === 1
                              ? 'text-[#FCEEAC]'
                              : dynasty.busbyCount === 1
                              ? 'text-cyan-300'
                              : dynasty.postSafCount === 1
                              ? 'text-red-300'
                              : 'text-neutral-300'
                          }`}
                        >
                          {dynasty.safCount === 1
                            ? 'Sir Alex Ferguson'
                            : dynasty.busbyCount === 1
                            ? 'Sir Matt Busby'
                            : dynasty.postSafCount === 1
                            ? 'Post-SAF'
                            : 'Heritage'}
                        </span>
                      </div>
                      <span className="text-[#D4AF37]/90 font-semibold shrink-0 ml-1">100% SHARE</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[9px] font-mono select-none">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                        <span className="text-neutral-400">SAF:</span>
                        <span className="text-[#FCEEAC] font-bold">{dynasty.safCount}</span>
                      </div>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        <span className="text-neutral-400">BUSBY:</span>
                        <span className="text-cyan-300 font-bold">{dynasty.busbyCount}</span>
                      </div>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="text-neutral-400">POST:</span>
                        <span className="text-red-300 font-bold">{dynasty.postSafCount}</span>
                      </div>
                      {dynasty.heritageCount > 0 && (
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 shrink-0" />
                          <span className="text-neutral-400">HIST:</span>
                          <span className="text-neutral-300 font-bold">{dynasty.heritageCount}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
