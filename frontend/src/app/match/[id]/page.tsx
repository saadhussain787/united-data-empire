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
}

// Reusable Comparative Stat Bar
const StatBar = ({
  label,
  homeVal,
  awayVal,
  homeColorClass,
  awayColorClass,
  isPercentage = false,
  reverse = false, // If true, smaller number gets larger bar (e.g., PPDA)
}: {
  label: string;
  homeVal: number | string;
  awayVal: number | string;
  homeColorClass: string;
  awayColorClass: string;
  isPercentage?: boolean;
  reverse?: boolean;
}) => {
  const numHome = typeof homeVal === "string" ? parseFloat(homeVal) : homeVal;
  const numAway = typeof awayVal === "string" ? parseFloat(awayVal) : awayVal;
  const absHome = Math.abs(numHome) || 0;
  const absAway = Math.abs(numAway) || 0;
  const total = absHome + absAway || 1;
  let homePct = (absHome / total) * 100;
  let awayPct = (absAway / total) * 100;

  if (reverse) {
    // Invert percentages for metrics like PPDA where lower is better
    const temp = homePct;
    homePct = awayPct;
    awayPct = temp;
  }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-gray-300">
          {homeVal}
          {isPercentage && "%"}
        </span>
        <span className="text-gray-400 uppercase text-[10px] tracking-wider text-center flex-1">{label}</span>
        <span className="text-gray-300">
          {awayVal}
          {isPercentage && "%"}
        </span>
      </div>
      <div className="w-full h-2 bg-black/40 rounded-full flex overflow-hidden border border-white/5">
        <div className={`${homeColorClass} h-full transition-all duration-700`} style={{ width: `${homePct}%` }} />
        <div className={`${awayColorClass} h-full transition-all duration-700 flex-1`} />
      </div>
    </div>
  );
};

export default function MatchDossierPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params?.id as string;

  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "MATRIX" | "SHOTMAP" | "TIMING">("OVERVIEW");
  const [selectedShot, setSelectedShot] = useState<ShotItem | null>(null);

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
            { id: "SHOTMAP", label: "2D Shot Map", icon: "🎯" },
            { id: "TIMING", label: "xG Momentum Chart", icon: "📈" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "OVERVIEW" | "MATRIX" | "SHOTMAP" | "TIMING")}
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
                  <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-white/10">
                    {timeline.map((evt, idx) => (
                      <div key={idx} className="relative flex items-start gap-4 pl-8">
                        <div className={`absolute left-1.5 top-1 h-3.5 w-3.5 rounded-full border-2 border-[#151A22] ${evt.type === 'Goal' ? 'bg-[#DA291C]' : 'bg-yellow-400'}`} />
                        <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-4 flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className={`font-bold flex items-center gap-1.5 ${evt.type === 'Goal' ? 'text-white' : 'text-yellow-400'}`}>
                              <span>{evt.type === 'Goal' ? '⚽' : '🟨'}</span> {evt.type} — {evt.team === 'home' ? match.homeTeamName : match.awayTeamName}
                            </span>
                            <span className="text-[#D4AF37] font-mono font-bold">{evt.minute}</span>
                          </div>
                          <p className="text-sm text-gray-300 font-medium">{evt.player}</p>
                          {evt.text && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{evt.text}</p>}
                        </div>
                      </div>
                    ))}
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
                <div className="bg-[#151A22] border border-white/10 rounded-2xl p-6 space-y-4 text-xs text-gray-300">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Venue Intelligence</h4>
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-500">Stadium:</span><span className="text-white font-medium">{match.venue || "TBD"}</span></div>
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-500">Competition:</span><span className="text-white font-medium">{match.competition}</span></div>
                  <div className="flex justify-between py-2"><span className="text-gray-500">Season:</span><span className="text-white font-medium">2026/2027</span></div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: TACTICAL MATRIX */}
          {activeTab === "MATRIX" && (
            <motion.div key="matrix" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-[#151A22] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                <div className="space-y-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] border-b border-white/10 pb-2">Attacking & Expected Goals</h4>
                  <StatBar label="Expected Goals (xG)" homeVal={homexG.toFixed(2)} awayVal={awayxG.toFixed(2)} homeColorClass={homeColorClass} awayColorClass={awayColorClass} />
                  <StatBar label="Finishing Variance (Goals vs xG)" homeVal={homeFinishingVariance} awayVal={awayFinishingVariance} homeColorClass={homeColorClass} awayColorClass={awayColorClass} />
                  <StatBar label="Possession" homeVal={homePoss} awayVal={awayPoss} homeColorClass={homeColorClass} awayColorClass={awayColorClass} isPercentage />
                  <StatBar label="Total Shots" homeVal={homeShots} awayVal={awayShots} homeColorClass={homeColorClass} awayColorClass={awayColorClass} />
                  <StatBar label="Shots on Target" homeVal={homeShotsOnTarget} awayVal={awayShotsOnTarget} homeColorClass={homeColorClass} awayColorClass={awayColorClass} />
                  <StatBar label="Shot Quality (xG per Shot)" homeVal={homeShotQuality.toFixed(2)} awayVal={awayShotQuality.toFixed(2)} homeColorClass={homeColorClass} awayColorClass={awayColorClass} />
                </div>
                <div className="space-y-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] border-b border-white/10 pb-2">Pressing & Distribution</h4>
                  <StatBar label="PPDA (Pressing Intensity)" homeVal={homePPDA.toFixed(2)} awayVal={awayPPDA.toFixed(2)} homeColorClass={homeColorClass} awayColorClass={awayColorClass} reverse />
                  <StatBar label="Deep Completions (<20y)" homeVal={homeDeep} awayVal={awayDeep} homeColorClass={homeColorClass} awayColorClass={awayColorClass} />
                  <StatBar label="Total Passes" homeVal={homePasses} awayVal={awayPasses} homeColorClass={homeColorClass} awayColorClass={awayColorClass} />
                  <StatBar label="Pass Accuracy" homeVal={homePassPct} awayVal={awayPassPct} homeColorClass={homeColorClass} awayColorClass={awayColorClass} isPercentage />
                  <StatBar label="Corners Won" homeVal={homeCorners} awayVal={awayCorners} homeColorClass={homeColorClass} awayColorClass={awayColorClass} />
                  <StatBar label="Fouls Committed" homeVal={homeFouls} awayVal={awayFouls} homeColorClass={homeColorClass} awayColorClass={awayColorClass} />
                </div>
              </div>
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

          {/* TAB 4: TIMING CHART */}
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
    </div>
  );
}