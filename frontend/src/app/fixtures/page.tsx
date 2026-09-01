"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Goalscorer {
  player: string;
  minute: string;
  text: string;
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
  homeGoalscorers: Goalscorer[] | null;
  awayGoalscorers: Goalscorer[] | null;
  teamStats: Record<string, Record<string, string>> | null;
}

const StatBar = ({
  label,
  homeVal,
  awayVal,
  homeColorClass,
  awayColorClass,
  isPercentage = false,
}: {
  label: string;
  homeVal: number | string;
  awayVal: number | string;
  homeColorClass: string;
  awayColorClass: string;
  isPercentage?: boolean;
}) => {
  const numHome = typeof homeVal === "string" ? parseFloat(homeVal) : homeVal;
  const numAway = typeof awayVal === "string" ? parseFloat(awayVal) : awayVal;
  const absHome = Math.abs(numHome) || 0;
  const absAway = Math.abs(numAway) || 0;
  const total = absHome + absAway || 1;
  const homePct = (absHome / total) * 100;
  const awayPct = (absAway / total) * 100;

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
      <div className="w-full h-2.5 bg-black/40 rounded-full flex overflow-hidden border border-white/5">
        <div className={`${homeColorClass} h-full transition-all duration-700`} style={{ width: `${homePct}%` }} />
        <div className={`${awayColorClass} h-full transition-all duration-700 flex-1`} />
      </div>
    </div>
  );
};

export default function FixturesPage() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<"ALL" | "FT" | "SCHEDULED">("ALL");
  const [hoveredMatchId, setHoveredMatchId] = useState<number | null>(null);

  useEffect(() => {
    async function loadFixtures() {
      try {
        const res = await fetch("/api/fixtures");
        const json = await res.json();
        if (json.status === "SUCCESS") {
          setMatches(json.data);
        }
      } catch (err) {
        console.error("Failed to load matchday fixtures:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFixtures();
  }, []);

  // THE FIX: Dynamic Sorting + Filtering
  const filteredMatches = matches
    .filter((m) => {
      if (filter === "FT") return m.status === "FT";
      if (filter === "SCHEDULED") return m.status === "NS" || m.status === "SCHEDULED";
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      
      // If "Results" tab is active, sort DESCENDING (Newest first)
      if (filter === "FT") {
        return timeB - timeA;
      }
      
      // Otherwise (Upcoming or All), sort ASCENDING (Chronological)
      return timeA - timeB;
    });

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-[#DA291C] selection:text-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#DA291C] animate-pulse" />
              <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
                Matchday Command Center
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight uppercase text-white font-mono">
              Fixtures & <span className="text-[#DA291C]">Tactical Results</span>
            </h1>
          </div>

          <div className="flex items-center bg-[#151A22] p-1.5 rounded-xl border border-white/5 shadow-inner">
            {(["ALL", "FT", "SCHEDULED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  filter === tab
                    ? "bg-[#DA291C] text-white shadow-lg shadow-[#DA291C]/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab === "ALL" ? "All Fixtures" : tab === "FT" ? "Results" : "Upcoming"}
              </button>
            ))}
          </div>
        </div>

        {/* Matches Feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-[#DA291C] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm tracking-widest uppercase text-gray-400">Loading Tactical Vault...</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="bg-[#151A22] border border-white/5 rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-sm">No matches found in this category.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {filteredMatches.map((match) => {
                const homeStats = match.teamStats?.[String(match.homeTeamId)] || {};
                const awayStats = match.teamStats?.[String(match.awayTeamId)] || {};

                const isManUtdHome = match.homeTeamId === 360 || match.homeTeamName.includes("United");
                const homeColorClass = isManUtdHome ? "bg-[#DA291C]" : "bg-white/30";
                const awayColorClass = !isManUtdHome ? "bg-[#DA291C]" : "bg-white/30";

                const homePoss = parseFloat(homeStats["possessionPct"] || "0");
                const awayPoss = parseFloat(awayStats["possessionPct"] || "0");
                const homeShots = parseInt(homeStats["totalShots"] || homeStats["shotsTotal"] || homeStats["shots"] || "0", 10);
                const awayShots = parseInt(awayStats["totalShots"] || awayStats["shotsTotal"] || awayStats["shots"] || "0", 10);
                const homePasses = parseInt(homeStats["totalPasses"] || "0", 10);
                const awayPasses = parseInt(awayStats["totalPasses"] || "0", 10);
                const homexG = parseFloat(parseFloat(homeStats["expectedGoals"] || "0.00").toFixed(2));
                const awayxG = parseFloat(parseFloat(awayStats["expectedGoals"] || "0.00").toFixed(2));

                const isHovered = hoveredMatchId === (match.id || match.apiFixtureId);
                const hasStats = match.status === "FT" && Object.keys(homeStats).length > 0;

                return (
                  <Link
                    key={match.id || match.apiFixtureId}
                    href={`/match/${match.id || match.apiFixtureId}`}
                    className="block group"
                    onMouseEnter={() => setHoveredMatchId(match.id || match.apiFixtureId)}
                    onMouseLeave={() => setHoveredMatchId(null)}
                  >
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="bg-[#151A22] border border-white/10 rounded-2xl overflow-hidden shadow-2xl group-hover:border-[#DA291C]/50 group-hover:shadow-[#DA291C]/10 transition-all cursor-pointer relative"
                    >
                      <div className="bg-[#0e1218] px-6 py-3 border-b border-white/5 flex flex-wrap items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-white tracking-wide">{match.competition}</span>
                          <span>•</span>
                          <span>{match.venue || "TBD"}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 sm:mt-0">
                          <span>{new Date(match.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wider ${match.status === "FT" ? "bg-white/10 text-gray-300" : match.status === "LIVE" ? "bg-[#DA291C] text-white animate-pulse" : "bg-[#D4AF37]/20 text-[#D4AF37]"}`}>
                            {match.status === "FT" ? "Full Time" : match.status === "LIVE" ? "LIVE" : "Upcoming"}
                          </span>
                          <span className="text-[#D4AF37] font-bold opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                            Explore Dossier →
                          </span>
                        </div>
                      </div>

                      <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                        <div className="flex items-center justify-start md:justify-end gap-4">
                          <span className="text-xl sm:text-2xl font-bold tracking-tight text-white text-left md:text-right group-hover:text-[#DA291C] transition-colors">
                            {match.homeTeamName}
                          </span>
                          {match.homeTeamLogo && <img src={match.homeTeamLogo} alt={match.homeTeamName} className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />}
                        </div>

                        <div className="flex flex-col items-center justify-center bg-[#0B0E14] py-3 px-6 rounded-xl border border-white/5">
                          <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-wider text-white">
                            {match.status === "FT" || match.status === "LIVE" ? (
                              <span>{match.homeScore} <span className="text-gray-500 font-light">-</span> {match.awayScore}</span>
                            ) : (
                              <span className="text-sm uppercase tracking-widest text-[#D4AF37] font-sans">VS</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-start gap-4">
                          {match.awayTeamLogo && <img src={match.awayTeamLogo} alt={match.awayTeamName} className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />}
                          <span className="text-xl sm:text-2xl font-bold tracking-tight text-white text-left group-hover:text-[#DA291C] transition-colors">
                            {match.awayTeamName}
                          </span>
                        </div>
                      </div>

                      {/* Expandable Tactical Matrix (Only shows on Hover) */}
                      <AnimatePresence>
                        {isHovered && hasStats && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 bg-[#0e1218]/30 border-t border-white/5">
                              {/* Goalscorers Block */}
                              {(match.homeGoalscorers?.length || match.awayGoalscorers?.length) ? (
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                  <div className="text-right pr-4">
                                    {match.homeGoalscorers?.map((g, i) => (
                                      <div key={i} className="text-xs text-gray-400 py-0.5">
                                        <span className="text-white font-medium">{g.player}</span> <span className="text-[#D4AF37] ml-1">{g.minute}'</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="text-left pl-4 border-l border-white/5">
                                    {match.awayGoalscorers?.map((g, i) => (
                                      <div key={i} className="text-xs text-gray-400 py-0.5">
                                        <span className="text-[#D4AF37] mr-1">{g.minute}'</span> <span className="text-white font-medium">{g.player}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">Detailed Match Matrix</h4>
                                <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-white transition-colors">Click for 2D Shot Map & xG Flow →</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                <div className="space-y-4">
                                  <StatBar label="Expected Goals (xG)" homeVal={homexG.toFixed(2)} awayVal={awayxG.toFixed(2)} homeColorClass={homeColorClass} awayColorClass={awayColorClass} />
                                  <StatBar label="Possession" homeVal={homePoss} awayVal={awayPoss} homeColorClass={homeColorClass} awayColorClass={awayColorClass} isPercentage />
                                </div>
                                <div className="space-y-4">
                                  <StatBar label="Total Shots" homeVal={homeShots} awayVal={awayShots} homeColorClass={homeColorClass} awayColorClass={awayColorClass} />
                                  <StatBar label="Total Passes" homeVal={homePasses} awayVal={awayPasses} homeColorClass={homeColorClass} awayColorClass={awayColorClass} />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </motion.div>
                  </Link>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}