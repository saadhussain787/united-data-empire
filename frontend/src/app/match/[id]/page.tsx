"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import TacticalAssistant from "@/components/Chat/TacticalAssistant";
import { ComparativeStatBar } from "@/components/Match/ComparativeStatBar";
import AttackingZones from "@/components/Match/AttackingZones";

interface EventItem {
  type: "Goal" | "Card" | "Sub";
  player: string;
  minute: string;
  minuteNum: number;
  text?: string;
  team: "home" | "away";
  cardType?: string;
}

interface ShotItem {
  id: string;
  minute: number;
  result: string;
  x: number;
  y: number;
  xG: number;
  player: string;
  team: "home" | "away";
  situation: string;
  shotType: string;
}

interface MatchRecord {
  id: number;
  apiFixtureId: number;
  date: string;
  competition: string;
  venue: string;
  status: string;
  homeTeamId: number;
  homeTeamName: string;
  homeTeamLogo: string;
  homeScore: number;
  awayTeamId: number;
  awayTeamName: string;
  awayTeamLogo: string;
  awayScore: number;
  homeGoalscorers: { player: string; minute: string; text: string }[] | null;
  awayGoalscorers: { player: string; minute: string; text: string }[] | null;
  cards: { player: string; minute: string; type: string; teamId: string }[] | null;
  teamStats: Record<string, Record<string, string>> | null;
  shotData: ShotItem[] | null;
  stats?: {
    playerId: number;
    player?: { name: string; position: string; number: number };
    rating: number;
    minutes: number;
    goals: number;
    assists: number;
    shotsTotal: number;
    passesTotal: number;
    passesKey: number;
    passAccuracy: number;
    tackles: number;
    interceptions: number;
    passesAccurate?: number;
    longBalls?: number;
    crosses?: number;
    clearances?: number;
    xG?: number;
    xA?: number;
    dribbles?: number;
    blocks?: number;
  }[];
  matchContext?: any;
}


export default function MatchDossierPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params?.id as string;

  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "MATRIX" | "PLAYERS" | "SHOTMAP" | "TIMING">("OVERVIEW");
  const [selectedShot, setSelectedShot] = useState<ShotItem | null>(null);
  const [playerTab, setPlayerTab] = useState<"Top Stats" | "Attack" | "Passes" | "Defense" | "Physical">("Top Stats");

  useEffect(() => {
    async function fetchMatchData() {
      try {
        const res = await fetch("/api/fixtures");
        const json = await res.json();
        if (json.status === "SUCCESS") {
          const target = json.data.find(
            (m: MatchRecord) => String(m.id) === matchId || String(m.apiFixtureId) === matchId
          );
          setMatch(target || null);
        }
      } catch (err) {
        console.error("Error loading match dossier:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatchData();
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center space-y-4 text-white font-sans">
        <div className="w-12 h-12 border-4 border-[#DA291C] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">Decrypting Match Vault...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <h2 className="text-2xl font-bold mb-4 font-mono uppercase">Match Dossier Not Found</h2>
        <button onClick={() => router.push("/fixtures")} className="px-6 py-2.5 bg-[#DA291C] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#DA291C]/80 transition-all">
          Return to Command Center
        </button>
      </div>
    );
  }

  const isManUtdHome = match.homeTeamId === 360 || match.homeTeamName.includes("United");
  const homeColorClass = isManUtdHome ? "bg-[#DA291C]" : "bg-white/30";
  const awayColorClass = !isManUtdHome ? "bg-[#DA291C]" : "bg-white/30";

  // Build the Unified Chronological Timeline
  const parseMinute = (minStr: string) => parseInt(minStr.replace(/[^0-9]/g, ""), 10) || 0;
  const timeline: EventItem[] = [];
  
  match.homeGoalscorers?.forEach(g => timeline.push({ type: "Goal", player: g.player, minute: g.minute, minuteNum: parseMinute(g.minute), text: g.text, team: "home" }));
  match.awayGoalscorers?.forEach(g => timeline.push({ type: "Goal", player: g.player, minute: g.minute, minuteNum: parseMinute(g.minute), text: g.text, team: "away" }));
  
  match.cards?.forEach(c => {
    const isHome = String(c.teamId) === String(match.homeTeamId);
    timeline.push({ type: "Card", player: c.player, minute: c.minute, minuteNum: parseMinute(c.minute), cardType: c.type, team: isHome ? "home" : "away" });
  });

  timeline.sort((a, b) => a.minuteNum - b.minuteNum);

  // Parse Stats Safely
  const homeStats = match.teamStats?.[String(match.homeTeamId)] || {};
  const awayStats = match.teamStats?.[String(match.awayTeamId)] || {};

  const homePoss = parseFloat(homeStats["possessionPct"] || "0");
  const awayPoss = parseFloat(awayStats["possessionPct"] || "0");
  const homeShots = parseInt(homeStats["totalShots"] || homeStats["shotsTotal"] || homeStats["shots"] || "0", 10);
  const awayShots = parseInt(awayStats["totalShots"] || awayStats["shotsTotal"] || awayStats["shots"] || "0", 10);
  const homexG = parseFloat(parseFloat(homeStats["expectedGoals"] || "0.00").toFixed(2));
  const awayxG = parseFloat(parseFloat(awayStats["expectedGoals"] || "0.00").toFixed(2));
  const homePPDA = parseFloat(homeStats["ppda"] || "0.00");
  const awayPPDA = parseFloat(awayStats["ppda"] || "0.00");
  const homeDeep = parseInt(homeStats["deepCompletions"] || "0", 10);
  const awayDeep = parseInt(awayStats["deepCompletions"] || "0", 10);
  const homePasses = parseInt(homeStats["totalPasses"] || "0", 10);
  const awayPasses = parseInt(awayStats["totalPasses"] || "0", 10);

  // Extracted ESPN Metrics
  const homeShotsOnTarget = parseInt(homeStats["shotsOnTarget"] || "0", 10);
  const awayShotsOnTarget = parseInt(awayStats["shotsOnTarget"] || "0", 10);
  const homeCorners = parseInt(homeStats["wonCorners"] || "0", 10);
  const awayCorners = parseInt(awayStats["wonCorners"] || "0", 10);
  const homeFouls = parseInt(homeStats["foulsCommitted"] || "0", 10);
  const awayFouls = parseInt(awayStats["foulsCommitted"] || "0", 10);
  
  const hPassRaw = parseFloat(homeStats["passPct"] || "0");
  const aPassRaw = parseFloat(awayStats["passPct"] || "0");
  const homePassPct = Math.round(hPassRaw <= 1 ? hPassRaw * 100 : hPassRaw);
  const awayPassPct = Math.round(aPassRaw <= 1 ? aPassRaw * 100 : aPassRaw);

  // Derived Metrics (Nerd Math)
  const homeShotQuality = homeShots > 0 ? parseFloat((homexG / homeShots).toFixed(2)) : 0.00;
  const awayShotQuality = awayShots > 0 ? parseFloat((awayxG / awayShots).toFixed(2)) : 0.00;

  const hVarNum = match.homeScore - homexG;
  const aVarNum = match.awayScore - awayxG;
  const homeFinishingVariance = hVarNum > 0 ? `+${hVarNum.toFixed(2)}` : hVarNum.toFixed(2);
  const awayFinishingVariance = aVarNum > 0 ? `+${aVarNum.toFixed(2)}` : aVarNum.toFixed(2);

  const displayShots = match.shotData || [];
  const hasUnderstatData = displayShots.length > 0;

  // Build Dynamic xG Chart if data exists
  const timingChartData = [{ minute: "0'", homeXG: 0.0, awayXG: 0.0 }];
  if (hasUnderstatData) {
    let curHxG = 0, curAxG = 0;
    const sortedShots = [...displayShots].sort((a, b) => a.minute - b.minute);
    sortedShots.forEach(s => {
      if (s.team === "home") curHxG += s.xG;
      else curAxG += s.xG;
      timingChartData.push({ minute: `${s.minute}'`, homeXG: parseFloat(curHxG.toFixed(2)), awayXG: parseFloat(curAxG.toFixed(2)) });
    });
    timingChartData.push({ minute: "90'", homeXG: parseFloat(curHxG.toFixed(2)), awayXG: parseFloat(curAxG.toFixed(2)) });
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#DA291C] selection:text-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push("/fixtures")} className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
            <span>←</span> Return to Fixtures
          </button>
        </div>

        {/* Master Scoreboard Hero */}
        <div className="bg-[#151A22] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden mb-8">
          <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 border-b border-white/5 pb-4 mb-6">
            <span className="font-semibold text-white tracking-wide uppercase">{match.competition} • {match.venue || "Stadium TBD"}</span>
            <span className="text-gray-400">{new Date(match.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8">
            <div className="flex items-center justify-start md:justify-end gap-5">
              <div className="text-left md:text-right">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{match.homeTeamName}</h2>
                <span className="text-xs text-gray-400 uppercase tracking-widest">Home</span>
              </div>
              {match.homeTeamLogo && <img src={match.homeTeamLogo} alt={match.homeTeamName} className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />}
            </div>

            <div className="flex flex-col items-center justify-center bg-[#0B0E14] py-4 px-8 rounded-2xl border border-white/5 shadow-inner">
              <div className="text-4xl sm:text-5xl font-mono font-extrabold text-white tracking-widest">
                {match.status === "FT" || match.status === "LIVE" ? (
                  <span>{match.homeScore} <span className="text-gray-600 font-light">-</span> {match.awayScore}</span>
                ) : (
                  <span className="text-lg text-[#D4AF37]">VS</span>
                )}
              </div>
              <span className={`px-3 py-0.5 mt-2 rounded-full font-bold uppercase text-[10px] tracking-wider ${match.status === "NS" || match.status === "SCHEDULED" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-white/10 text-gray-300"}`}>
                {match.status === "FT" ? "Full Time" : match.status === "LIVE" ? "LIVE" : "Upcoming"}
              </span>
            </div>

            <div className="flex items-center justify-start gap-5">
              {match.awayTeamLogo && <img src={match.awayTeamLogo} alt={match.awayTeamName} className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />}
              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{match.awayTeamName}</h2>
                <span className="text-xs text-gray-400 uppercase tracking-widest">Away</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 mb-8 gap-2 border-b border-white/10">
          {[
            { id: "OVERVIEW", label: "Overview & Events", icon: "📌" },
            { id: "MATRIX", label: "Tactical Matrix", icon: "📊" },
            { id: "PLAYERS", label: "Player Matrix", icon: "👥" },
            { id: "SHOTMAP", label: "2D Shot Map", icon: "🎯" },
            { id: "TIMING", label: "xG Momentum Chart", icon: "📈" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "OVERVIEW" | "MATRIX" | "PLAYERS" | "SHOTMAP" | "TIMING")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-[#DA291C] text-white shadow-lg" : "bg-[#151A22] text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* TAB 1: OVERVIEW & TIMELINE */}
          {activeTab === "OVERVIEW" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-[#151A22] border border-white/10 rounded-2xl p-6 sm:p-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] mb-6 flex items-center gap-2"><span>⏱️</span> Match Timeline & Key Highlights</h3>
                
                {timeline.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No major events recorded yet.</p>
                ) : (
                  <div className="grid grid-cols-12 relative gap-y-6 py-4">
                    {/* Step 2.2: Central dividing line */}
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/10 -translate-x-1/2 hidden md:block" />
                    {timeline.map((evt, idx) => {
                      const isHome = evt.team === 'home';
                      const isGoal = evt.type === 'Goal';
                      
                      return (
                        <React.Fragment key={idx}>
                          {/* Left Side (Home) */}
                          <div className={`col-span-5 flex ${isHome ? 'justify-end' : 'justify-end invisible'}`}>
                            {isHome && (
                              <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-4 text-right w-full sm:w-11/12 transition-transform hover:-translate-y-1 hover:shadow-lg">
                                <div className="flex items-center justify-end gap-2 text-xs mb-1">
                                  <span className={`font-bold ${isGoal ? 'text-white' : 'text-yellow-400'}`}>
                                    {evt.type} — {match.homeTeamName}
                                  </span>
                                </div>
                                <p className="text-sm text-white font-semibold">{evt.player}</p>
                                {evt.text && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{evt.text}</p>}
                              </div>
                            )}
                          </div>
                          
                          {/* Center Spine */}
                          <div className="col-span-2 col-start-6 flex flex-col items-center justify-center relative z-10">
                            <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full border-4 border-[#151A22] flex items-center justify-center text-xs sm:text-sm shadow-xl ${isGoal ? 'bg-[#DA291C]' : 'bg-[#D4AF37]'}`}>
                              {isGoal ? '⚽' : '🟨'}
                            </div>
                            <span className="mt-1.5 text-[10px] sm:text-xs font-mono font-bold text-[#D4AF37] bg-[#151A22] px-2 py-0.5 rounded-full border border-white/10 shadow-sm">{evt.minute}</span>
                          </div>
                          
                          {/* Right Side (Away) */}
                          <div className={`col-span-5 col-start-8 flex ${!isHome ? 'justify-start' : 'justify-start invisible'}`}>
                            {!isHome && (
                              <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-4 text-left w-full sm:w-11/12 transition-transform hover:-translate-y-1 hover:shadow-lg">
                                <div className="flex items-center justify-start gap-2 text-xs mb-1">
                                  <span className={`font-bold ${isGoal ? 'text-white' : 'text-yellow-400'}`}>
                                    {evt.type} — {match.awayTeamName}
                                  </span>
                                </div>
                                <p className="text-sm text-white font-semibold">{evt.player}</p>
                                {evt.text && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{evt.text}</p>}
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {hasUnderstatData && (
                  <div className="bg-[#151A22] border border-white/10 rounded-2xl p-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-4">Moneyball Expected Points</h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-[#0B0E14] p-4 rounded-xl border border-white/5">
                        <span className="text-[10px] text-gray-400 uppercase">{match.homeTeamName}</span>
                        <p className="text-2xl font-mono font-extrabold text-white mt-1">{homeStats["xpts"] || "0.00"}</p>
                      </div>
                      <div className="bg-[#0B0E14] p-4 rounded-xl border border-white/5">
                        <span className="text-[10px] text-gray-400 uppercase">{match.awayTeamName}</span>
                        <p className="text-2xl font-mono font-extrabold text-white mt-1">{awayStats["xpts"] || "0.00"}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-[#151A22] border border-white/10 rounded-2xl p-6 space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] border-b border-white/10 pb-3">Match Context</h4>
                  


                  {/* Venue & Conditions */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>🏟️</span> <span className="text-xs uppercase tracking-wider">Stadium</span>
                      </div>
                      <span className="text-sm text-white font-medium text-right">{match.venue || match.matchContext?.infoBox?.Stadium?.text || "TBD"}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>🏆</span> <span className="text-xs uppercase tracking-wider">Tournament</span>
                      </div>
                      <span className="text-sm text-white font-medium text-right">{match.competition}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: TACTICAL MATRIX */}
          {activeTab === "MATRIX" && (
            <motion.div key="matrix" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-[#151A22] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl">
              <div id="tactical-matrix-container" className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                {match?.teamStats?.fotmob?.Periods?.All?.stats?.length > 0 ? (
                  match.teamStats.fotmob.Periods.All.stats.map((category: any, catIdx: number) => (
                    <div key={catIdx} className="space-y-6">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] border-b border-white/10 pb-2">
                        {category.title}
                      </h4>
                      {category.stats?.filter((stat: any) => stat.type !== 'title' && stat.stats && (stat.stats[0] !== null || stat.stats[1] !== null)).map((stat: any, statIdx: number) => {
                        let homeVal = stat.stats?.[0] ?? 0;
                        let awayVal = stat.stats?.[1] ?? 0;
                        
                        if (stat.title?.toLowerCase().includes('distance') && typeof homeVal === 'number' && homeVal > 1000) {
                          homeVal = (homeVal / 1000).toFixed(1) + " km";
                          awayVal = (typeof awayVal === 'number' ? (awayVal / 1000).toFixed(1) : awayVal) + " km";
                        }
                        
                        const reverse = stat.title?.toLowerCase().includes('fouls') || 
                                        stat.title?.toLowerCase().includes('cards') ||
                                        stat.title?.toLowerCase().includes('ppda');

                        const isPercentage = typeof homeVal === 'string' && homeVal.includes('%');
                        
                        return (
                          <ComparativeStatBar 
                            key={statIdx} 
                            label={stat.title} 
                            homeVal={homeVal} 
                            awayVal={awayVal} 
                            homeColorClass={homeColorClass} 
                            awayColorClass={awayColorClass} 
                            reverse={reverse}
                            isPercentage={isPercentage}
                          />
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-12 text-gray-500 space-y-3">
                    <span className="text-4xl">📊</span>
                    <p className="text-xs uppercase tracking-widest">Tactical statistics currently unavailable.</p>
                  </div>
                )}
              </div>

              {/* Attacking Zones Section */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-8 text-center">
                  Attacking Zones
                </h4>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-16">
                  {/* Home Team Zones */}
                  <AttackingZones 
                    teamName={match?.homeTeamName || "Home"} 
                    color="#DA291C" 
                    zones={{ left: 35, center: 45, right: 20 }} 
                  />
                  
                  {/* Away Team Zones */}
                  <AttackingZones 
                    teamName={match?.awayTeamName || "Away"} 
                    color="#1E40AF" 
                    zones={{ left: 25, center: 40, right: 35 }} 
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2.5: PLAYER MATRIX */}
          {activeTab === "PLAYERS" && (
            <motion.div key="players" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-[#151A22] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-x-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-4 mb-4 gap-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Individual Player Ratings & Stats</h4>
                <div className="flex items-center gap-2 bg-[#0B0E14] p-1 rounded-lg border border-white/5">
                  {["Top Stats", "Attack", "Passes", "Defense", "Physical"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setPlayerTab(tab as any)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                        playerTab === tab ? "bg-[#DA291C] text-white" : "text-gray-500 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              {match.stats && match.stats.length > 0 ? (() => {
                const manUtdId = match.homeTeamName.includes("United") ? match.homeTeamId : match.awayTeamId;
                const unitedStats = match.stats.filter((s: any) => s.rawStatsJson?.teamId === manUtdId);
                const maxRating = Math.max(...unitedStats.map((s: any) => s.rating || 0));
                
                return (
                  <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-gray-500 uppercase tracking-widest text-[10px] border-b border-white/5">
                      <th className="pb-3 pr-4 font-semibold">Player</th>
                      <th className="pb-3 px-3 font-semibold text-center">Pos</th>
                      <th className="pb-3 px-3 font-semibold text-center">Mins</th>
                      <th className="pb-3 px-3 font-semibold text-center text-[#D4AF37]">Rating</th>
                      
                      {playerTab === "Top Stats" && (
                        <>
                          <th className="pb-3 px-3 font-semibold text-center">G/A</th>
                          <th className="pb-3 px-3 font-semibold text-center">Shots</th>
                          <th className="pb-3 px-3 font-semibold text-center">Passes</th>
                          <th className="pb-3 px-3 font-semibold text-center">Key</th>
                          <th className="pb-3 px-3 font-semibold text-center">Pass %</th>
                          <th className="pb-3 pl-3 font-semibold text-center">Def (T/I)</th>
                        </>
                      )}
                      
                      {playerTab === "Attack" && (
                        <>
                          <th className="pb-3 px-3 font-semibold text-center">Goals</th>
                          <th className="pb-3 px-3 font-semibold text-center">Assists</th>
                          <th className="pb-3 px-3 font-semibold text-center">Shots</th>
                          <th className="pb-3 px-3 font-semibold text-center">xG</th>
                          <th className="pb-3 pl-3 font-semibold text-center">xA</th>
                        </>
                      )}

                      {playerTab === "Passes" && (
                        <>
                          <th className="pb-3 px-3 font-semibold text-center">Total</th>
                          <th className="pb-3 px-3 font-semibold text-center">Accurate</th>
                          <th className="pb-3 px-3 font-semibold text-center">Key</th>
                          <th className="pb-3 px-3 font-semibold text-center">Pass %</th>
                          <th className="pb-3 px-3 font-semibold text-center">Long Balls</th>
                          <th className="pb-3 pl-3 font-semibold text-center">Crosses</th>
                        </>
                      )}

                      {playerTab === "Defense" && (
                        <>
                          <th className="pb-3 px-3 font-semibold text-center">Tackles</th>
                          <th className="pb-3 px-3 font-semibold text-center">Interceptions</th>
                          <th className="pb-3 px-3 font-semibold text-center">Clearances</th>
                          <th className="pb-3 pl-3 font-semibold text-center">Blocks</th>
                        </>
                      )}

                      {playerTab === "Physical" && (
                        <>
                          <th className="pb-3 px-3 font-semibold text-center">Distance (km)</th>
                          <th className="pb-3 pl-3 font-semibold text-center">Top Speed (km/h)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[...unitedStats].sort((a, b) => (b.rating || 0) - (a.rating || 0)).map((stat, idx) => {
                      const isMotM = stat.rating === maxRating && maxRating > 0;
                      let ratingColor = "text-gray-400";
                      if (!isMotM) {
                        if (stat.rating >= 8.0) ratingColor = "text-green-400";
                        else if (stat.rating >= 7.0) ratingColor = "text-green-500";
                        else if (stat.rating >= 6.0) ratingColor = "text-yellow-500";
                        else ratingColor = "text-red-500";
                      }
                      return (
                      <tr key={idx} className={`transition-colors ${isMotM ? 'bg-[#1E40AF]/20 border-l-2 border-[#3B82F6]' : 'hover:bg-white/[0.02]'}`}>
                        <td className="py-3 pr-4 font-medium text-white flex items-center gap-3">
                          <span className="text-gray-600 text-xs w-4">{stat.player?.number || '-'}</span>
                          {(stat.player?.name && stat.player?.name !== "Unknown") ? stat.player.name : ((stat as any).rawStatsJson?.fotmob_player_name || 'Unknown')}
                        </td>
                        <td className="py-3 px-3 text-center text-gray-400 text-xs">{(stat.player?.position && stat.player?.position !== "Unknown") ? stat.player.position : ((stat as any).rawStatsJson?.positionStringShort || (stat as any).rawStatsJson?.role || '-')}</td>
                        <td className="py-3 px-3 text-center text-gray-400">{stat.minutes}'</td>
                        <td className="py-3 px-3 text-center">
                          {isMotM ? (
                            <span className="bg-[#3B82F6] text-white font-black px-2 py-0.5 rounded flex items-center justify-center gap-1 w-fit mx-auto">
                              {(stat.rating || 0).toFixed(1)} <span className="text-[10px]">⭐</span>
                            </span>
                          ) : (
                            <span className={`font-bold ${ratingColor}`}>{(stat.rating || 0).toFixed(1)}</span>
                          )}
                        </td>
                        
                        {playerTab === "Top Stats" && (() => {
                          const raw = (stat as any).rawStatsJson || {};
                          return (
                          <>
                            <td className="py-3 px-3 text-center text-gray-300">{stat.goals} / {stat.assists}</td>
                            <td className="py-3 px-3 text-center text-gray-400">{stat.shotsTotal}</td>
                            <td className="py-3 px-3 text-center text-gray-400">{stat.passesTotal}</td>
                            <td className="py-3 px-3 text-center text-gray-300 font-semibold">{stat.passesKey}</td>
                            <td className="py-3 px-3 text-center text-gray-400">{Math.round(stat.passAccuracy || 0)}%</td>
                            <td className="py-3 pl-3 text-center text-gray-400">{stat.tackles} / {stat.interceptions}</td>
                          </>
                          );
                        })()}
                        
                        {playerTab === "Attack" && (
                          <>
                            <td className="py-3 px-3 text-center text-gray-300">{stat.goals}</td>
                            <td className="py-3 px-3 text-center text-gray-300">{stat.assists}</td>
                            <td className="py-3 px-3 text-center text-gray-400">{stat.shotsTotal}</td>
                            <td className="py-3 px-3 text-center text-gray-400">{stat.xG !== undefined ? stat.xG.toFixed(2) : '-'}</td>
                            <td className="py-3 pl-3 text-center text-gray-400">{stat.xA !== undefined ? stat.xA.toFixed(2) : '-'}</td>
                          </>
                        )}

                        {playerTab === "Passes" && (() => {
                          const raw = (stat as any).rawStatsJson || {};
                          return (
                          <>
                            <td className="py-3 px-3 text-center text-gray-400">{stat.passesTotal}</td>
                            <td className="py-3 px-3 text-center text-gray-400">{raw.passesAccurate ?? '-'}</td>
                            <td className="py-3 px-3 text-center text-gray-300 font-semibold">{stat.passesKey}</td>
                            <td className="py-3 px-3 text-center text-gray-400">{Math.round(stat.passAccuracy || 0)}%</td>
                            <td className="py-3 px-3 text-center text-gray-400">{raw.longBalls ?? '-'}</td>
                            <td className="py-3 pl-3 text-center text-gray-400">{raw.crosses ?? '-'}</td>
                          </>
                          );
                        })()}

                        {playerTab === "Defense" && (() => {
                          const raw = (stat as any).rawStatsJson || {};
                          return (
                          <>
                            <td className="py-3 px-3 text-center text-gray-400">{stat.tackles}</td>
                            <td className="py-3 px-3 text-center text-gray-400">{stat.interceptions}</td>
                            <td className="py-3 px-3 text-center text-gray-400">{raw.clearances ?? '-'}</td>
                            <td className="py-3 pl-3 text-center text-gray-400">{stat.blocks ?? '-'}</td>
                          </>
                          );
                        })()}

                        {playerTab === "Physical" && (() => {
                          const raw = (stat as any).rawStatsJson || {};
                          let rawDist = raw.totalDistance;
                          let rawSpeed = raw.topSpeed;
                          if (raw.detailed_stats && Array.isArray(raw.detailed_stats)) {
                            const physical = raw.detailed_stats.find((c: any) => c.key === "physical_metrics");
                            if (physical && physical.stats) {
                               const dStat = physical.stats["Distance covered"] || physical.stats["Distance Covered"];
                               if (dStat && dStat.stat && dStat.stat.value !== undefined) rawDist = dStat.stat.value;
                               const sStat = physical.stats["Top speed"] || physical.stats["Top Speed"];
                               if (sStat && sStat.stat && sStat.stat.value !== undefined) rawSpeed = sStat.stat.value;
                            }
                          }
                          const dist = typeof rawDist === 'number' ? (rawDist / 1000).toFixed(2) : '-';
                          const speed = typeof rawSpeed === 'number' ? rawSpeed.toFixed(2) : '-';
                          return (
                          <>
                            <td className="py-3 px-3 text-center text-gray-400">{dist}</td>
                            <td className="py-3 pl-3 text-center text-gray-400">{speed}</td>
                          </>
                          );
                        })()}
                      </tr>
                    )})}
                  </tbody>
                </table>
                );
              })() : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-3">
                  <span className="text-4xl">👥</span>
                  <p className="text-xs uppercase tracking-widest">Player stats currently unavailable for this match.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: SHOT MAP */}
          {activeTab === "SHOTMAP" && (
            <motion.div key="shotmap" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-[#151A22] border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">2D Spatial Pitch Map</h3>
                </div>
                <div className="relative w-full aspect-[16/10] bg-[#1a3826] rounded-xl border-2 border-white/20 overflow-hidden shadow-inner flex items-center justify-center">
                  <div className="absolute inset-4 border border-white/30 rounded-lg pointer-events-none" />
                  <div className="absolute inset-y-4 left-1/2 w-0.5 bg-white/30 pointer-events-none" />
                  <div className="absolute h-32 w-32 rounded-full border border-white/30 pointer-events-none" />
                  <div className="absolute inset-y-16 left-4 w-28 border-r border-t border-b border-white/30 pointer-events-none" />
                  <div className="absolute inset-y-16 right-4 w-28 border-l border-t border-b border-white/30 pointer-events-none" />

                  {displayShots.map((shot, idx) => {
                    const isHome = shot.team === "home";
                    const isUnited = (isHome && match.homeTeamId === 360) || (!isHome && match.awayTeamId === 360);
                    const dotColor = isUnited ? "#DA291C" : "#D4AF37";
                    const isGoal = shot.result === "Goal";
                    
                    // The 2D Pitch Fix: Home team attacks Right (X), Away team attacks Left (100 - X)
                    const xPos = isHome ? shot.x : 100 - shot.x;
                    // Y axis flip for away team keeps it aligned correctly
                    const yPos = isHome ? shot.y : 100 - shot.y;

                    return (
                      <button key={idx} onClick={() => setSelectedShot(shot)} style={{ left: `${xPos}%`, top: `${yPos}%` }} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-150 cursor-pointer shadow-lg z-10 flex items-center justify-center ${isGoal ? "ring-2 ring-white animate-bounce" : ""}`}>
                        <span className="rounded-full" style={{ backgroundColor: dotColor, width: `${Math.max(8, shot.xG * 35)}px`, height: `${Math.max(8, shot.xG * 35)}px` }} />
                      </button>
                    );
                  })}
                  {!hasUnderstatData && <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"><p className="text-white font-mono text-sm tracking-widest uppercase">Awaiting Post-Match Spatial Analysis...</p></div>}
                </div>
              </div>
              <div className="bg-[#151A22] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-4">Shot Inspector</h4>
                  {selectedShot ? (
                    <div className="space-y-4 bg-[#0B0E14] p-5 rounded-xl border border-white/5">
                      <div><span className="text-[10px] text-gray-500 uppercase tracking-wider">Shooter</span><h3 className="text-lg font-bold text-white">{selectedShot.player}</h3></div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div><span className="text-gray-500 block">xG Value</span><span className="text-[#D4AF37] font-mono font-bold text-base">{selectedShot.xG}</span></div>
                        <div><span className="text-gray-500 block">Result</span><span className={`font-bold ${selectedShot.result === "Goal" ? "text-green-400" : "text-gray-300"}`}>{selectedShot.result}</span></div>
                      </div>
                    </div>
                  ) : <div className="text-gray-500 text-xs">Click any dot on the pitch to inspect xG probability.</div>}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: TIMING CHART */}
          {activeTab === "TIMING" && (
            <motion.div key="timing" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-[#151A22] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl">
              <div className="h-80 w-full">
                {hasUnderstatData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="minute" stroke="#6b7280" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                      <YAxis stroke="#6b7280" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: "#0B0E14", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }} itemStyle={{ color: "#fff" }} />
                      <Area type="stepAfter" dataKey="awayXG" name={match.awayTeamName} stroke="#DA291C" strokeWidth={2.5} fillOpacity={0.1} fill="#DA291C" />
                      <Area type="stepAfter" dataKey="homeXG" name={match.homeTeamName} stroke="#ffffff" strokeWidth={2} fillOpacity={0.1} fill="#ffffff" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="w-full h-full flex items-center justify-center"><p className="text-gray-500 font-mono tracking-widest text-sm uppercase">xG Curve Processing...</p></div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <TacticalAssistant matchContext={match} />
    </div>
  );
}