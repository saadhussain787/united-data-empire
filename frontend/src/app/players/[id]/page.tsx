"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
  const [selectedSeason, setSelectedSeason] = useState("All");
  const [selectedSituation, setSelectedSituation] = useState("All");
  const [selectedResult, setSelectedResult] = useState("All");
  const [selectedShot, setSelectedShot] = useState<any | null>(null);

  useEffect(() => {
    if (!selectedShot && careerShots.length > 0) {
      const goals = careerShots.filter(s => s.result === "Goal").sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (goals.length > 0) setSelectedShot(goals[0]);
    }
  }, [careerShots, selectedShot]);

  const uniqueSeasons = Array.from(new Set(careerShots.map(s => s.season))).sort((a, b) => Number(b) - Number(a));

  const filteredShots = careerShots.filter(s => {
    if (selectedSeason !== "All" && s.season !== selectedSeason) return false;
    if (selectedSituation !== "All" && s.situation !== selectedSituation) return false;
    if (selectedResult !== "All" && s.result !== selectedResult) return false;
    return true;
  });

  const totalShots = filteredShots.length;
  const totalXG = filteredShots.reduce((acc, s) => acc + (Number(s.xG) || 0), 0).toFixed(2);
  const totalGoals = filteredShots.filter(s => s.result === "Goal").length;

  const getShotColor = (result: string) => {
    switch(result) {
      case "Goal": return "#22c55e"; // Emerald Green
      case "SavedShot": return "#38bdf8"; // Cyan Blue
      case "BlockedShot": return "#a855f7"; // Purple
      case "MissedShots": return "#f97316"; // Orange/Red
      case "ShotOnPost": return "#facc15"; // Yellow
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
      className="flex flex-col space-y-8"
    >
      {/* Top Bar: Filters & Metrics */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-[#151A22] p-6 rounded-xl border border-gray-800/50 shadow-lg space-y-4 lg:space-y-0">
        <div className="flex flex-wrap gap-4">
          <select 
            value={selectedSeason} 
            onChange={e => setSelectedSeason(e.target.value)}
            className="bg-[#0B0E14] text-white border border-gray-700 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="All">All Seasons</option>
            {uniqueSeasons.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
          </select>
          <select 
            value={selectedSituation} 
            onChange={e => setSelectedSituation(e.target.value)}
            className="bg-[#0B0E14] text-white border border-gray-700 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="All">All Situations</option>
            <option value="OpenPlay">Open Play</option>
            <option value="DirectFreekick">Direct Freekick</option>
            <option value="Penalty">Penalty</option>
            <option value="SetPiece">Set Piece</option>
            <option value="FromCorner">From Corner</option>
          </select>
          <select 
            value={selectedResult} 
            onChange={e => setSelectedResult(e.target.value)}
            className="bg-[#0B0E14] text-white border border-gray-700 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="All">All Results</option>
            <option value="Goal">Goal</option>
            <option value="SavedShot">Saved Shot</option>
            <option value="BlockedShot">Blocked Shot</option>
            <option value="MissedShots">Missed Shot</option>
            <option value="ShotOnPost">Shot on Post</option>
          </select>
        </div>
        <div className="flex gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Goals</span>
            <span className="text-2xl font-black text-[#22c55e]">{totalGoals}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total xG</span>
            <span className="text-2xl font-black text-[#D4AF37]">{totalXG}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Shots</span>
            <span className="text-2xl font-black text-white">{totalShots}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* The 2D Pitch Canvas Layout */}
        <div className="lg:col-span-2 bg-[#151A22] rounded-xl p-8 border border-gray-800/50 shadow-2xl flex flex-col items-center justify-center">
          <div className="relative w-full max-w-2xl aspect-[4/3] bg-[#0B0E14] border-2 border-gray-600 overflow-hidden rounded-sm">
            {/* Pitch Markings */}
            {/* Penalty Box */}
            <div className="absolute top-0 left-[21%] w-[58%] h-[36%] border-b-2 border-l-2 border-r-2 border-gray-600"></div>
            {/* 6-Yard Box */}
            <div className="absolute top-0 left-[36%] w-[28%] h-[12%] border-b-2 border-l-2 border-r-2 border-gray-600"></div>
            {/* Penalty Spot */}
            <div className="absolute top-[24%] left-[50%] w-2 h-2 bg-gray-600 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            {/* Center Circle Arch */}
            <div className="absolute top-[100%] left-[50%] w-[30%] aspect-square border-2 border-gray-600 rounded-full -translate-x-1/2 -translate-y-1/2"></div>

            {/* Render Shot Dots */}
            {filteredShots.map((shot, idx) => {
              // shot.x is 0-100 (100 is goal line)
              // shot.y is 0-100 (0 left, 100 right)
              // Map to attacking half: top = (100 - X)*2
              const topPos = (100 - shot.x) * 2;
              const leftPos = shot.y;
              
              // Only render if in attacking half (topPos between 0 and 100)
              if (topPos < 0 || topPos > 100) return null;

              const radius = Math.max(5, Math.min(22, shot.xG * 24));
              const color = getShotColor(shot.result);
              const isGoal = shot.result === "Goal";
              const isSelected = selectedShot?.id === shot.id;

              return (
                <div
                  key={shot.id || idx}
                  onClick={() => setSelectedShot(shot)}
                  className={`absolute rounded-full cursor-pointer transition-all duration-200 transform -translate-x-1/2 -translate-y-1/2 hover:scale-150 hover:z-50 ${isSelected ? 'z-40 scale-125 ring-2 ring-white' : 'z-10'}`}
                  style={{
                    top: `${topPos}%`,
                    left: `${leftPos}%`,
                    width: `${radius}px`,
                    height: `${radius}px`,
                    backgroundColor: color,
                    boxShadow: isGoal ? `0 0 10px ${color}` : 'none',
                    opacity: isSelected ? 1 : 0.85
                  }}
                  title={`xG: ${shot.xG}`}
                />
              );
            })}
          </div>
        </div>

        {/* The Shot Inspector Panel */}
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
                  <div className="text-xl font-bold text-[#D4AF37]">{selectedShot.xG}</div>
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
              Select a shot to view intelligence
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}