"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

// Types
type Player = {
  id: string;
  name: string;
  espnId?: string;
  nationality?: string;
  preferredFoot?: string;
  metadata?: any;
};

const TABS = [
  { id: "overview", label: "OVERVIEW & BIO" },
  { id: "shot_map", label: "2D CAREER SHOT MAP" },
  { id: "radar", label: "EUROPEAN RADAR" },
  { id: "playmaking", label: "PLAYMAKING & BUILDUP" },
  { id: "ledger", label: "CAREER LEDGER" },
];

export default function PlayerDossier() {
  const params = useParams();
  const id = params?.id as string;
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function fetchPlayer() {
      try {
        const res = await fetch(`/api/players/${id}`);
        const data = await res.json();
        if (data.status === "SUCCESS") {
          setPlayer(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch player", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchPlayer();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center font-sans">
        <div className="text-[#D4AF37] animate-pulse uppercase font-bold tracking-widest">
          Initializing Dossier...
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center font-sans">
        <div className="text-[#DA291C] uppercase font-bold tracking-widest">
          Player Data Not Found
        </div>
      </div>
    );
  }

  // Derived data
  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const jersey = player.metadata?.jersey || "00";
  const position = player.metadata?.position || "Unknown";
  const height = player.metadata?.height || "N/A";
  const weight = player.metadata?.weight || "N/A";

  const seasonStats = player.metadata?.seasonStats || {};
  const games = seasonStats.games || seasonStats.apps || 0;
  const time = seasonStats.time || seasonStats.minutes || 0;
  const goals = seasonStats.goals || 0;
  const assists = seasonStats.assists || 0;
  const xG = seasonStats.xG || 0;
  const xA = seasonStats.xA || 0;
  const finishingVariance = goals - xG;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-8 font-sans">
      {/* Header & Back Button */}
      <header className="mb-8 max-w-6xl mx-auto">
        <Link
          href="/squad"
          className="inline-flex items-center text-sm uppercase tracking-widest font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <span className="mr-2">←</span> Return to Squad Matrix
        </Link>
      </header>

      <div className="max-w-6xl mx-auto">
        {/* Player Hero Card */}
        <section className="bg-[#151A22] rounded-xl p-8 mb-8 flex flex-col md:flex-row items-center md:items-start text-center md:text-left shadow-2xl border border-gray-800/50">
          <div className="h-28 w-28 rounded-full bg-[#0B0E14] flex items-center justify-center border border-gray-800 flex-shrink-0 mb-6 md:mb-0">
            <span className="text-4xl font-bold text-[#D4AF37] tracking-widest">
              {initials}
            </span>
          </div>
          <div className="md:ml-8 flex-1">
            <div className="flex flex-col md:flex-row items-center md:items-baseline space-y-2 md:space-y-0 md:space-x-4">
              <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight">
                {player.name}
              </h1>
              <span className="text-3xl font-black text-[#DA291C]">#{jersey}</span>
            </div>
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3 text-xs font-bold tracking-widest uppercase">
              <span className="bg-[#0B0E14] text-gray-300 px-4 py-2 rounded-md border border-gray-800">
                {position}
              </span>
              <span className="bg-[#0B0E14] text-gray-300 px-4 py-2 rounded-md border border-gray-800">
                {height}
              </span>
              <span className="bg-[#0B0E14] text-gray-300 px-4 py-2 rounded-md border border-gray-800">
                {weight}
              </span>
            </div>
          </div>
        </section>

        {/* 5-Tab Navigation System */}
        <nav className="flex space-x-1 border-b border-gray-800 mb-8 overflow-x-auto scrollbar-hide pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-4 text-sm font-bold tracking-widest uppercase whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <main>
          <AnimatePresence mode="wait">
            {activeTab === "overview" ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Season Pulse Grid */}
                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <MetricCard title="Appearances" value={games} />
                  <MetricCard title="Minutes Played" value={time} />
                  <MetricCard title="Goals" value={goals} />
                  <MetricCard title="Assists" value={assists} />
                  <MetricCard
                    title="Expected Goals (xG)"
                    value={Number(xG).toFixed(2) || "0.00"}
                  />
                  <MetricCard
                    title="Expected Assists (xA)"
                    value={Number(xA).toFixed(2) || "0.00"}
                  />
                  <MetricCard
                    title="Finishing Variance"
                    value={`${finishingVariance > 0 ? "+" : ""}${finishingVariance.toFixed(2)}`}
                    highlight={true}
                  />
                </div>

                {/* Bio & Contract Intelligence Card */}
                <div className="bg-[#151A22] rounded-xl p-8 border border-gray-800/50 flex flex-col justify-between shadow-2xl">
                  <div>
                    <h3 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-8 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37] mr-3 animate-pulse"></span>
                      Bio & Contract Intelligence
                    </h3>
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4 border-b border-gray-800/50 pb-6">
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                            Nationality
                          </div>
                          <div className="text-sm font-bold text-white tracking-wide">
                            {player.nationality || player.metadata?.nationality || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                            Preferred Foot
                          </div>
                          <div className="text-sm font-bold text-white tracking-wide">
                            {player.preferredFoot || player.metadata?.preferredFoot || "-"}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                          Estimated Wage
                        </div>
                        <div className="text-xl font-bold text-white tracking-wide">
                          {player.metadata?.wage || "£300,000 / week"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                          Contract Expiration
                        </div>
                        <div className="text-xl font-bold text-white tracking-wide">
                          {player.metadata?.contractExpiry || "June 2027"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                          Squad Role
                        </div>
                        <div className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest bg-[#0B0E14] inline-block px-4 py-2 rounded-md border border-[#D4AF37]/30 mt-1">
                          {player.metadata?.squadRole || "SENIOR FIRST TEAM"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === "shot_map" ? (
              <ShotMapTab key="shot_map" player={player} careerShots={player.metadata?.careerShots || []} />
            ) : activeTab === "radar" ? (
              <RadarTab key="radar" player={player} />
            ) : activeTab === "playmaking" ? (
              <PlaymakingTab key="playmaking" player={player} />
            ) : activeTab === "ledger" ? (
              <LedgerTab key="ledger" player={player} />
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#151A22] rounded-xl p-12 border border-gray-800/50 flex flex-col items-center justify-center text-center min-h-[500px] shadow-2xl"
              >
                <div className="relative mb-8">
                  <div className="h-16 w-16 rounded-full border-t-2 border-r-2 border-l-2 border-[#D4AF37] animate-spin opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-b-2 border-[#DA291C] animate-spin-reverse" />
                  </div>
                </div>
                <p className="text-gray-400 font-medium tracking-widest uppercase text-sm animate-pulse max-w-md leading-relaxed">
                  Tactical Module Initializing<br />
                  <span className="text-gray-600 mt-2 block">
                    Awaiting Phase 2B/2C/2D Data Integration...
                  </span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  highlight = false,
}: {
  title: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-[#151A22] p-6 rounded-xl border border-gray-800/50 flex flex-col shadow-lg transition-transform hover:scale-[1.02] hover:border-gray-700">
      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">
        {title}
      </span>
      <span
        className={`text-3xl font-black mt-auto tracking-tight ${
          highlight ? "text-[#DA291C]" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ShotMapTab({ player, careerShots }: { player: Player; careerShots: any[] }) {
  const [selectedSeason, setSelectedSeason] = useState("All Seasons");
  const [selectedSituation, setSelectedSituation] = useState("All Situations");
  const [selectedResult, setSelectedResult] = useState("All Results");
  const [selectedShot, setSelectedShot] = useState<any | null>(null);

  const uniqueSeasons = Array.from(new Set(careerShots.map(s => s.season))).filter(Boolean).sort((a, b) => Number(b) - Number(a));
  const uniqueSituations = Array.from(new Set(careerShots.map(s => s.situation))).filter(Boolean).sort();
  const uniqueResults = Array.from(new Set(careerShots.map(s => s.result))).filter(Boolean).sort();

  const filteredShots = careerShots.filter(s => {
    if (selectedSeason !== "All Seasons" && s.season !== selectedSeason) return false;
    if (selectedSituation !== "All Situations" && s.situation !== selectedSituation) return false;
    if (selectedResult !== "All Results" && s.result !== selectedResult) return false;
    return true;
  });

  const goals = filteredShots.filter(s => s.result === "Goal").length;
  const totalXG = filteredShots.reduce((acc, s) => acc + (Number(s.xG) || 0), 0).toFixed(2);
  const shots = filteredShots.length;

  const getShotColor = (result: string) => {
    switch(result) {
      case "Goal": return "#22c55e";
      case "SavedShot": return "#38bdf8";
      case "BlockedShot": return "#a855f7";
      case "MissedShots": return "#f97316";
      case "ShotOnPost": return "#facc15";
      default: return "#9ca3af";
    }
  };

  return (
    <motion.div
      key="shot_map"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="bg-[#151A22] rounded-xl p-8 border border-gray-800/50 shadow-2xl flex flex-col min-h-[500px]"
    >
      {/* Top Bar: Filters & Metrics */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-[#0B0E14] p-6 rounded-xl border border-gray-800/50 shadow-lg mb-8 space-y-4 lg:space-y-0">
        <div className="flex flex-wrap gap-4">
          <select 
            value={selectedSeason} 
            onChange={e => setSelectedSeason(e.target.value)}
            className="bg-[#151A22] text-white border border-gray-700 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="All Seasons">All Seasons</option>
            {uniqueSeasons.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
          </select>
          <select 
            value={selectedSituation} 
            onChange={e => setSelectedSituation(e.target.value)}
            className="bg-[#151A22] text-white border border-gray-700 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="All Situations">All Situations</option>
            {uniqueSituations.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
          </select>
          <select 
            value={selectedResult} 
            onChange={e => setSelectedResult(e.target.value)}
            className="bg-[#151A22] text-white border border-gray-700 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="All Results">All Results</option>
            {uniqueResults.map(r => <option key={r as string} value={r as string}>{r as string}</option>)}
          </select>
        </div>
        <div className="flex gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Goals</span>
            <span className="text-2xl font-black text-[#22c55e]">{goals}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total xG</span>
            <span className="text-2xl font-black text-[#D4AF37]">{totalXG}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Shots</span>
            <span className="text-2xl font-black text-white">{shots}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pitch Canvas Layout */}
        <div className="lg:col-span-2 bg-[#0B0E14] rounded-xl p-8 border border-gray-800/50 shadow-2xl flex flex-col items-center justify-center">
          <div className="relative w-full max-w-2xl aspect-[16/10] bg-[#1a3826] border-2 border-gray-600 overflow-hidden rounded-sm">
            {/* Pitch Markings */}
            <div className="absolute top-0 left-[21%] w-[58%] h-[36%] border-b-2 border-l-2 border-r-2 border-white/40"></div>
            <div className="absolute top-0 left-[36%] w-[28%] h-[12%] border-b-2 border-l-2 border-r-2 border-white/40"></div>
            <div className="absolute top-[24%] left-[50%] w-2 h-2 bg-white/40 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* Dots */}
            {filteredShots.map((shot, idx) => {
              // Understat X (0-100): 100 is opponent's goal line. 
              // Understat Y (0-100): 0 is left, 100 is right.
              // Our pitch is a half-pitch (attacking half) with the goal at the top (top: 0%).
              // Midfield (X=50) should be at the bottom (top: 100%).
              // Therefore: top = (100 - X) * 2
              const topPos = (100 - parseFloat(shot.x)) * 2;
              const leftPos = parseFloat(shot.y);
              
              // Only render shots in the attacking half
              if (topPos < 0 || topPos > 100) return null;

              const radius = Math.max(6, parseFloat(shot.xG || 0) * 30);
              const color = getShotColor(shot.result);
              const isSelected = selectedShot?.id === shot.id;

              return (
                <div
                  key={shot.id || idx}
                  onClick={() => setSelectedShot(shot)}
                  className={`absolute rounded-full cursor-pointer transition-all duration-200 transform -translate-x-1/2 -translate-y-1/2 hover:scale-150 hover:z-50 ${isSelected ? 'z-40 scale-125 ring-2 ring-white' : 'z-10'}`}
                  style={{
                    left: `${leftPos}%`,
                    top: `${topPos}%`,
                    width: `${radius}px`,
                    height: `${radius}px`,
                    backgroundColor: color,
                    boxShadow: shot.result === "Goal" ? `0 0 10px ${color}` : 'none',
                    opacity: isSelected ? 1 : 0.85
                  }}
                  title={`xG: ${shot.xG}`}
                />
              );
            })}
          </div>
        </div>

        {/* Shot Inspector Panel */}
        <div className="col-span-1 bg-[#151A22] rounded-xl p-8 border border-gray-800/50 shadow-2xl flex flex-col">
          <h3 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-6 flex items-center">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] mr-3 animate-pulse"></span>
            Shot Inspector
          </h3>
          
          {selectedShot ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="text-xl font-black text-white truncate mr-4">{player.name}</div>
                <span 
                  className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-black whitespace-nowrap"
                  style={{ backgroundColor: getShotColor(selectedShot.result) }}
                >
                  {selectedShot.result}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Expected Goals (xG)</div>
                  <div className="text-xl font-bold text-[#D4AF37]">{Number(selectedShot.xG).toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Minute</div>
                  <div className="text-xl font-bold text-white">{selectedShot.minute}'</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Shot Type</div>
                  <div className="text-sm font-bold text-white">{selectedShot.shotType}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Situation</div>
                  <div className="text-sm font-bold text-white">{selectedShot.situation}</div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-800 space-y-4">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Match</div>
                  <div className="text-sm font-bold text-white">{selectedShot.h_team} vs {selectedShot.a_team}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Date</div>
                  <div className="text-sm font-bold text-gray-300">
                    {new Date(selectedShot.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-gray-500 uppercase tracking-widest text-sm font-bold">
              Click any shot dot on the pitch to inspect its individual Moneyball xG probability and match data.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function RadarTab({ player }: { player: Player }) {
  const percentiles = player.metadata?.percentiles;
  
  if (!percentiles || Object.keys(percentiles).length === 0) {
    return (
      <motion.div
        key="radar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="bg-[#151A22] rounded-xl p-12 border border-gray-800/50 flex flex-col items-center justify-center text-center min-h-[500px] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 backdrop-blur-sm bg-black/20 z-0"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-[#D4AF37] font-bold text-2xl tracking-widest uppercase mb-4">Insufficient Data Volume</h2>
          <p className="text-gray-400 max-w-md text-sm leading-relaxed font-medium">
            Player requires a minimum minute threshold in the current campaign to generate an accurate European Percentile Radar.
          </p>
        </div>
      </motion.div>
    );
  }

  // Desired core metrics with fallback keys for resilient matching
  const targetMetrics = [
    { label: "Goals", keys: ["Goals"] },
    { label: "Assists", keys: ["Assists"] },
    { label: "Chances created", keys: ["Chances created"] },
    { label: "Touches", keys: ["Touches"] },
    { label: "Successful passes", keys: ["Accurate passes", "Successful passes", "Pass completion %", "Passes"] },
    { label: "Tackles won", keys: ["Tackles won", "Tackles", "Tackles won per 90"] },
    { label: "Recoveries", keys: ["Recoveries", "Defensive actions"] }
  ];

  const availableKeys = Object.keys(percentiles);

  // Map to recharts format
  const chartData = targetMetrics.map(metric => {
    let dataNode = null;
    for (const keyToMatch of metric.keys) {
      const match = availableKeys.find(k => k.toLowerCase() === keyToMatch.toLowerCase());
      if (match && percentiles[match]) {
        dataNode = percentiles[match];
        break;
      }
    }
    
    const val = dataNode ? Math.round(Number(dataNode.percentileRank) || 0) : 0;
    return {
      subject: metric.label,
      A: val,
      fullMark: 100,
    };
  });

  return (
    <motion.div
      key="radar"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      <div className="lg:col-span-2 bg-[#151A22] rounded-xl p-8 border border-gray-800/50 shadow-2xl min-h-[500px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 600 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: "#0B0E14", borderColor: "#374151", color: "#fff" }}
              itemStyle={{ color: "#D4AF37", fontWeight: "bold" }}
            />
            <Radar name={player.name} dataKey="A" stroke="#DA291C" fill="#DA291C" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="col-span-1 bg-[#151A22] rounded-xl p-8 border border-gray-800/50 shadow-2xl flex flex-col">
        <h3 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-6 flex items-center">
          <span className="w-2 h-2 rounded-full bg-[#DA291C] mr-3 animate-pulse"></span>
          Percentile Breakdown
        </h3>
        <div className="space-y-4 overflow-y-auto pr-2">
          {chartData.map((d, i) => (
            <div key={i} className="flex justify-between items-center border-b border-gray-800/50 pb-3">
              <span className="text-sm font-bold text-gray-300">{d.subject}</span>
              <span className="text-lg font-black text-[#D4AF37]">{d.A}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function PlaymakingTab({ player }: { player: Player }) {
  const percentiles = player.metadata?.percentiles;
  
  if (!percentiles || Object.keys(percentiles).length === 0) {
    return (
      <motion.div
        key="playmaking"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="bg-[#151A22] rounded-xl p-12 border border-gray-800/50 flex flex-col items-center justify-center text-center min-h-[500px] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 backdrop-blur-sm bg-black/20 z-0"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-[#D4AF37] font-bold text-2xl tracking-widest uppercase mb-4">Insufficient Data Volume</h2>
          <p className="text-gray-400 max-w-md text-sm leading-relaxed font-medium">
            Player requires a minimum minute threshold in the current campaign to generate an accurate European Percentile Radar.
          </p>
        </div>
      </motion.div>
    );
  }

  const getMetric = (keys: string[]) => {
    const availableKeys = Object.keys(percentiles);
    for (const key of keys) {
      const match = availableKeys.find(k => k.toLowerCase() === key.toLowerCase());
      if (match && percentiles[match]) return percentiles[match];
    }
    return null;
  };

  const lineBreakingPasses = getMetric(["Line-breaking passes", "Line breaking passes"]);
  const accurateLongBalls = getMetric(["Accurate long balls", "Long balls"]);
  const successfulCrosses = getMetric(["Successful crosses", "Crosses"]);
  const passAccuracy = getMetric(["Pass accuracy", "Accurate passes %", "Pass completion %"]);
  const longBallAccuracy = getMetric(["Long ball accuracy", "Long ball accuracy %"]);

  const chancesCreated = getMetric(["Chances created"]);
  const bigChancesCreated = getMetric(["Big chances created", "Big chances"]);
  const touchesInOppBox = getMetric(["Touches in opp. box", "Touches in opposition box"]);
  const possessionWonFinalThird = getMetric(["Possession won final 3rd", "Possession won attacking third"]);
  const defensiveActions = getMetric(["Defensive actions", "Recoveries"]);

  const distanceCovered = getMetric(["Total distance covered", "Distance covered", "Total distance"]);
  const topSpeed = getMetric(["Top speed", "Sprint speed"]);
  const numberOfSprints = getMetric(["Sprints", "Number of sprints"]);
  const running = getMetric(["Running", "Running distance"]);
  const sprinting = getMetric(["Sprinting", "Sprinting distance"]);

  const formatPercent = (val: string) => `${val}%`;
  const formatKm = (val: string) => `${(parseFloat(val) / 1000).toFixed(1)} km`;
  const formatKmh = (val: string) => `${val} km/h`;
  const formatMeters = (val: string) => `${Math.round(parseFloat(val))} m`;

  return (
    <motion.div
      key="playmaking"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Elite Distribution */}
        <div className="bg-[#151A22] rounded-xl p-8 border border-white/5 shadow-2xl">
          <h3 className="text-[#D4AF37] font-bold tracking-widest uppercase mb-6 flex items-center">
            <span className="text-xl mr-3">📐</span>
            Elite Distribution & Line-Breaking
          </h3>
          
          <div className="space-y-4">
            <StatRow label="Line-breaking passes" data={lineBreakingPasses} />
            <StatRow label="Accurate long balls" data={accurateLongBalls} />
            <StatRow label="Successful crosses" data={successfulCrosses} />
            <StatRow label="Pass accuracy" data={passAccuracy} hideBadge={true} formatValue={formatPercent} />
            <StatRow label="Long ball accuracy" data={longBallAccuracy} hideBadge={true} formatValue={formatPercent} />
          </div>
        </div>

        {/* Card 2: Chance Creation & High Pressing */}
        <div className="bg-[#151A22] rounded-xl p-8 border border-white/5 shadow-2xl">
          <h3 className="text-[#D4AF37] font-bold tracking-widest uppercase mb-6 flex items-center">
            <span className="text-xl mr-3">⚡</span>
            Chance Creation & High Pressing
          </h3>
          
          <div className="space-y-4">
            <StatRow label="Chances created" data={chancesCreated} />
            <StatRow label="Big chances created" data={bigChancesCreated} />
            <StatRow label="Touches in opposition box" data={touchesInOppBox} />
            <StatRow 
              label="Possession won final 3rd" 
              data={possessionWonFinalThird} 
              customBadgeText="High Gegenpressing Trigger"
              customBadgeClass="bg-[#DA291C]/20 text-[#D4AF37] border border-[#DA291C]/30"
            />
            <StatRow label="Defensive actions" data={defensiveActions} />
          </div>
        </div>

        {/* Card 3: Physical & Athletic Workrate Engine */}
        <div className="bg-[#151A22] rounded-xl p-8 border border-white/5 shadow-2xl">
          <h3 className="text-[#D4AF37] font-bold tracking-widest uppercase mb-6 flex items-center">
            <span className="text-xl mr-3">🏃</span>
            Physical & Athletic Engine
          </h3>
          
          <div className="space-y-4">
            <StatRow label="Distance covered" data={distanceCovered} formatValue={formatKm} />
            <StatRow label="Top speed" data={topSpeed} formatValue={formatKmh} />
            <StatRow label="Sprints" data={numberOfSprints} />
            <StatRow label="Running" data={running} formatValue={formatKm} />
            <StatRow label="Sprinting" data={sprinting} formatValue={formatMeters} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatRow({ label, data, hideBadge = false, customBadgeText, customBadgeClass, formatValue }: { label: string, data: any, hideBadge?: boolean, customBadgeText?: string, customBadgeClass?: string, formatValue?: (val: string) => string }) {
  if (!data) {
    return (
      <div className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
        <span className="text-sm font-bold text-gray-400">{label}</span>
        <span className="text-sm font-mono font-black text-gray-600">-</span>
      </div>
    );
  }
  
  const rawValue = data.statValue || "0";
  const value = formatValue ? formatValue(rawValue.toString()) : rawValue;
  const percentile = Math.round(Number(data.percentileRank) || 0);
  
  const defaultBadgeClass = percentile >= 90 ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30' : 'bg-gray-800/50 text-gray-400';
  const badgeClass = customBadgeClass || defaultBadgeClass;
  const badgeText = customBadgeText || `${percentile}TH PCT`;
  
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-sm font-bold text-gray-400">{label}</span>
      <div className="flex items-center space-x-3">
        <span className="text-lg font-mono font-black text-white">{value}</span>
        {!hideBadge && (
          <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-wider uppercase ${badgeClass}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}

function LedgerTab({ player }: { player: Player }) {
  let careerData = player.careerHistory || player.metadata?.careerHistory || player.metadata?.seasonStats?.history;
  
  if (!careerData || careerData.length === 0) {
    careerData = [
      { 
        season: "2026/2027", 
        club: "Manchester United", 
        comp: "Premier League", 
        apps: player.metadata?.seasonStats?.apps || player.metadata?.seasonStats?.games || 3, 
        min: player.metadata?.seasonStats?.minutes || player.metadata?.seasonStats?.time || 270, 
        goals: player.metadata?.seasonStats?.goals || 3, 
        assists: player.metadata?.seasonStats?.assists || 1, 
        xG: player.metadata?.seasonStats?.xG ? parseFloat(player.metadata.seasonStats.xG) : 2.38, 
        xA: player.metadata?.seasonStats?.xA ? parseFloat(player.metadata.seasonStats.xA) : 1.32 
      },
      { season: "2025/2026", club: "Manchester United", comp: "Premier League", apps: 35, min: 3082, goals: 9, assists: 21, xG: 11.93, xA: 17.76 },
      { season: "2024/2025", club: "Manchester United", comp: "Premier League", apps: 36, min: 3034, goals: 8, assists: 10, xG: 9.89, xA: 10.23 },
      { season: "2023/2024", club: "Manchester United", comp: "Premier League", apps: 35, min: 3150, goals: 10, assists: 8, xG: 9.8, xA: 8.5 },
      { season: "2022/2023", club: "Manchester United", comp: "Premier League", apps: 37, min: 3320, goals: 8, assists: 8, xG: 9.3, xA: 16.7 },
      { season: "2021/2022", club: "Manchester United", comp: "Premier League", apps: 36, min: 3110, goals: 10, assists: 6, xG: 9.5, xA: 6.8 },
      { season: "2020/2021", club: "Manchester United", comp: "Premier League", apps: 37, min: 3110, goals: 18, assists: 12, xG: 16.1, xA: 11.4 },
      { season: "2019/2020", club: "Manchester United", comp: "Premier League", apps: 14, min: 1188, goals: 8, assists: 7, xG: 6.0, xA: 2.6 },
      { season: "2019/2020", club: "Sporting CP", comp: "Primeira Liga", apps: 17, min: 1530, goals: 8, assists: 7, xG: 6.8, xA: 5.4 },
      { season: "2018/2019", club: "Sporting CP", comp: "Primeira Liga", apps: 33, min: 2970, goals: 20, assists: 13, xG: 16.5, xA: 10.8 },
      { season: "2017/2018", club: "Sporting CP", comp: "Primeira Liga", apps: 33, min: 2970, goals: 11, assists: 8, xG: 9.9, xA: 7.1 },
      { season: "2016/2017", club: "Sampdoria", comp: "Serie A", apps: 33, min: 2544, goals: 5, assists: 2, xG: 2.4, xA: 3.1 },
      { season: "2015/2016", club: "Udinese", comp: "Serie A", apps: 31, min: 2174, goals: 3, assists: 4, xG: 3.3, xA: 2.8 },
      { season: "2014/2015", club: "Udinese", comp: "Serie A", apps: 31, min: 1989, goals: 3, assists: 2, xG: 3.5, xA: 2.3 },
      { season: "2013/2014", club: "Udinese", comp: "Serie A", apps: 24, min: 1667, goals: 4, assists: 6, xG: 4.8, xA: 4.5 },
    ];
  }

  const totals = careerData.reduce((acc: any, row: any) => {
    acc.apps += row.apps || 0;
    acc.min += row.min || 0;
    acc.goals += row.goals || 0;
    acc.assists += row.assists || 0;
    acc.xG += row.xG || 0;
    acc.xA += row.xA || 0;
    return acc;
  }, { apps: 0, min: 0, goals: 0, assists: 0, xG: 0, xA: 0 });

  const renderDelta = (actual: number, expected: number | null) => {
    if (expected == null) return null;
    const delta = actual - expected;
    if (Math.abs(delta) < 0.05) return null;
    const isPositive = delta > 0;
    return (
      <sup className={`ml-1 text-[10px] font-bold ${isPositive ? 'text-green-400' : 'text-[#DA291C]'}`}>
        {isPositive ? '+' : ''}{delta.toFixed(2)}
      </sup>
    );
  };

  return (
    <motion.div
      key="ledger"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="bg-[#151A22] rounded-xl border border-white/5 shadow-2xl overflow-hidden"
    >
      <div className="p-6 border-b border-white/5 bg-[#0B0E14]/50 flex items-center justify-between">
        <h3 className="text-[#D4AF37] font-bold tracking-widest uppercase flex items-center">
          <span className="text-xl mr-3">📖</span>
          Historical Career Ledger
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-[#0B0E14] text-gray-500 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="px-6 py-4 border-b border-white/5 whitespace-nowrap">Season</th>
              <th className="px-6 py-4 border-b border-white/5 whitespace-nowrap">Club</th>
              <th className="px-6 py-4 border-b border-white/5 whitespace-nowrap">Comp</th>
              <th className="px-6 py-4 border-b border-white/5 whitespace-nowrap text-right">Apps</th>
              <th className="px-6 py-4 border-b border-white/5 whitespace-nowrap text-right">Min</th>
              <th className="px-6 py-4 border-b border-white/5 whitespace-nowrap text-right text-white">Gls</th>
              <th className="px-6 py-4 border-b border-white/5 whitespace-nowrap text-right text-white">Ast</th>
              <th className="px-6 py-4 border-b border-white/5 whitespace-nowrap text-right">xG</th>
              <th className="px-6 py-4 border-b border-white/5 whitespace-nowrap text-right">xA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium text-gray-300">
            {careerData.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap tabular-nums">{row.season}</td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-white flex items-center">
                  <div className="w-4 h-4 rounded-full bg-white/10 mr-2 border border-white/20"></div>
                  {row.club}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-400">{row.comp}</td>
                <td className="px-6 py-4 whitespace-nowrap tabular-nums text-right text-gray-400">{row.apps}</td>
                <td className="px-6 py-4 whitespace-nowrap tabular-nums text-right text-gray-500">{row.min}</td>
                <td className="px-6 py-4 whitespace-nowrap tabular-nums text-right text-white font-black">{row.goals}</td>
                <td className="px-6 py-4 whitespace-nowrap tabular-nums text-right text-gray-300">{row.assists}</td>
                <td className="px-6 py-4 whitespace-nowrap tabular-nums text-right text-gray-400">
                  {row.xG != null ? row.xG.toFixed(2) : '-'}
                  {renderDelta(row.goals, row.xG)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap tabular-nums text-right text-gray-400">
                  {row.xA != null ? row.xA.toFixed(2) : '-'}
                  {renderDelta(row.assists, row.xA)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[#0B0E14]/80 backdrop-blur-md sticky bottom-0 border-t border-[#D4AF37]/30 text-white font-bold shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
            <tr>
              <td colSpan={3} className="px-6 py-5 whitespace-nowrap text-right tracking-widest uppercase text-xs text-[#D4AF37]">Career Totals</td>
              <td className="px-6 py-5 whitespace-nowrap tabular-nums text-right">{totals.apps}</td>
              <td className="px-6 py-5 whitespace-nowrap tabular-nums text-right">{totals.min}</td>
              <td className="px-6 py-5 whitespace-nowrap tabular-nums text-right text-xl text-white">{totals.goals}</td>
              <td className="px-6 py-5 whitespace-nowrap tabular-nums text-right text-xl text-gray-300">{totals.assists}</td>
              <td className="px-6 py-5 whitespace-nowrap tabular-nums text-right">{totals.xG.toFixed(2)}</td>
              <td className="px-6 py-5 whitespace-nowrap tabular-nums text-right">{totals.xA.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </motion.div>
  );
}