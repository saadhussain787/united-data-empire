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
                            {player.nationality || player.metadata?.nationality || "Portugal/Denmark"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                            Preferred Foot
                          </div>
                          <div className="text-sm font-bold text-white tracking-wide">
                            {player.preferredFoot || player.metadata?.preferredFoot || "Right / Left"}
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