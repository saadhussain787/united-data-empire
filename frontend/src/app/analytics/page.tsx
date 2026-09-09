'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

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

export interface UnsungHero {
  player_name: string;
  position: string;
  games: number;
  minutes: number;
  goals: number;
  assists: number;
  xG: number;
  xA: number;
  xGChain: number;
  xGBuildup: number;
  buildupPer90: number;
  chainPer90: number;
  photo: string;
}

export interface Finisher {
  player_name: string;
  team_title: string;
  isUnited: boolean;
  shots: number;
  goals: number;
  npGoals: number;
  npXG: number;
  finishingDelta: number;
  finishingRatio: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as Finisher;
    return (
      <div className="bg-[#0d0e14]/95 border border-white/20 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[200px]">
        <div className="mb-3 border-b border-white/10 pb-2">
          <div className="font-bold text-white flex items-center justify-between">
            {data.player_name}
            {data.isUnited && (
              <span className="ml-2 text-[8px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-sm tracking-widest">
                MAN UTD
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">{data.team_title}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
          <div className="text-gray-400">Actual Goals: <span className="font-bold text-white block">{data.npGoals}</span></div>
          <div className="text-gray-400">Expected (npXG): <span className="font-bold text-white block">{data.npXG.toFixed(2)}</span></div>
          <div className="text-gray-400">Total Shots: <span className="font-bold text-white block">{data.shots}</span></div>
          <div className="text-gray-400">Conversion: <span className="font-bold text-white block">{data.finishingRatio}x</span></div>
        </div>
        
        <div className={`px-2 py-1 rounded text-center text-xs font-bold border ${
          data.finishingDelta > 0 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : data.finishingDelta < 0 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
              : 'bg-white/5 text-gray-400 border-white/10'
        }`}>
          {data.finishingDelta > 0 ? `+${data.finishingDelta.toFixed(2)} (Clinical)` : data.finishingDelta < 0 ? `${data.finishingDelta.toFixed(2)} (Wasteful)` : '0.00 (On Par)'}
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [heroes, setHeroes] = useState<UnsungHero[]>([]);
  const [finishers, setFinishers] = useState<Finisher[]>([]);
  const [activeTab, setActiveTab] = useState<'standings' | 'heroes' | 'finishing'>('standings');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/analytics');
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const json = await response.json();
        
        if (json.status === 'SUCCESS') {
          if (json.data?.expectedTable) setTeams(json.data.expectedTable);
          if (json.data?.unsungHeroes) setHeroes(json.data.unsungHeroes);
          if (json.data?.finishingEfficiency) setFinishers(json.data.finishingEfficiency);
        }
      } catch (error) {
        console.error('Error fetching expected table:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  const unitedStats = teams.find((t) => t.team === 'Manchester United');

  // Audit calculations
  let mostClinical: Finisher | null = null;
  let mostWasteful: Finisher | null = null;
  let unitedMostClinical: Finisher | null = null;
  let unitedGoals = 0;
  let unitedXG = 0;
  
  if (finishers.length > 0) {
    mostClinical = [...finishers].sort((a, b) => b.finishingDelta - a.finishingDelta)[0];
    mostWasteful = [...finishers].sort((a, b) => a.finishingDelta - b.finishingDelta)[0];
    
    const unitedFinishers = finishers.filter((f) => f.isUnited);
    if (unitedFinishers.length > 0) {
      unitedMostClinical = [...unitedFinishers].sort((a, b) => b.finishingDelta - a.finishingDelta)[0];
    }
    unitedGoals = unitedFinishers.reduce((acc, f) => acc + f.npGoals, 0);
    unitedXG = unitedFinishers.reduce((acc, f) => acc + f.npXG, 0);
  }
  const unitedDelta = unitedGoals - unitedXG;

  return (
    <div className="min-h-screen bg-transparent text-white p-8">
      <div className="mb-8">
        <span className="text-[#D4AF37] text-xs font-bold tracking-widest border border-[#D4AF37]/30 px-3 py-1 rounded-full">
          PILLAR 4 • MONEYBALL INTELLIGENCE
        </span>
        <h1 className="text-4xl font-extrabold mt-4 mb-2">THE BOARDROOM MATRIX</h1>
        <p className="text-gray-400">Expected League Standings (xPTS) & Understat Telemetry</p>
      </div>

      <div className="inline-flex p-1.5 bg-white/[0.04] border border-white/10 rounded-2xl backdrop-blur-md gap-2 mb-8 relative">
        {['standings', 'heroes', 'finishing'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'standings' | 'heroes' | 'finishing')}
              className={`relative px-6 py-2.5 text-sm font-bold tracking-wider rounded-xl transition-colors z-10 ${
                isActive ? 'text-white drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-gradient-to-r from-red-600/30 to-amber-500/20 border border-[#D4AF37]/40 rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {tab === 'standings' ? '📈 EXPECTED STANDINGS' : tab === 'heroes' ? '✨ UNSUNG HEROES' : '🎯 FINISHING MATRIX'}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="animate-pulse text-gray-400 text-lg">
          Loading Moneyball Engine...
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'standings' && (
            <motion.div 
              key="standings" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }} 
              transition={{ duration: 0.25 }}
            >
          {unitedStats && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-8">
              <div className="flex items-center space-x-4 mb-6">
                {unitedStats.logo && (
                  <img src={unitedStats.logo} alt="Manchester United Logo" className="w-12 h-12 object-contain" />
                )}
                <h2 className="text-2xl font-bold">Manchester United Executive Summary</h2>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                  <div className="text-sm text-gray-400 mb-1 uppercase tracking-wider">Expected Points (xPTS)</div>
                  <div className="text-4xl font-black text-[#D4AF37]">{unitedStats.xPts.toFixed(2)}</div>
                </div>
                <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                  <div className="text-sm text-gray-400 mb-1 uppercase tracking-wider">Actual Points</div>
                  <div className="text-4xl font-black text-white">{unitedStats.actualPoints}</div>
                </div>
                <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                  <div className="text-sm text-gray-400 mb-1 uppercase tracking-wider">xPts Delta</div>
                  <div className={`text-4xl font-black ${unitedStats.xPtsDelta > 0 ? 'text-green-400' : unitedStats.xPtsDelta < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {unitedStats.xPtsDelta > 0 ? '+' : ''}{unitedStats.xPtsDelta.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {unitedStats.xPtsDelta > 0 ? 'Underperforming underlying metrics' : 'Overperforming underlying metrics'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 bg-[#0d0e14] border border-white/10 rounded-xl p-6 overflow-x-auto">
            <div className="mb-6">
              <h3 className="text-xl font-bold uppercase tracking-wider text-white">EXPECTED PREMIER LEAGUE STANDINGS</h3>
              <p className="text-gray-400 text-sm mt-1">Ranked by Expected Points (xPTS) generated from shot quality</p>
            </div>
            
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-gray-400 border-b border-white/10">
                  <th className="pb-3 font-semibold text-center w-12">POS</th>
                  <th className="pb-3 font-semibold">CLUB</th>
                  <th className="pb-3 font-semibold">PL</th>
                  <th className="pb-3 font-semibold">W-D-L</th>
                  <th className="pb-3 font-semibold">xG</th>
                  <th className="pb-3 font-semibold">xGA</th>
                  <th className="pb-3 font-semibold">xGD</th>
                  <th className="pb-3 font-semibold">PTS</th>
                  <th className="pb-3 font-semibold text-[#D4AF37]">xPTS</th>
                  <th className="pb-3 font-semibold text-right pr-4">VARIANCE</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => {
                  const xGD = team.xgFor - team.xgAgainst;
                  const isUnited = team.team === 'Manchester United';
                  
                  return (
                    <tr 
                      key={team.team} 
                      className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors border-l-4 ${
                        isUnited ? 'border-l-red-600 bg-red-500/[0.07]' : 'border-l-transparent'
                      }`}
                    >
                      <td className="py-4 text-center font-medium text-gray-400">{index + 1}</td>
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          {team.logo && <img src={team.logo} alt={team.team} className="w-6 h-6 object-contain" />}
                          <span className="font-medium text-white">{team.team}</span>
                        </div>
                      </td>
                      <td className="py-4">{team.played}</td>
                      <td className="py-4 text-gray-400">
                        {team.wins}-{team.draws}-{team.losses}
                      </td>
                      <td className="py-4">{team.xgFor.toFixed(2)}</td>
                      <td className="py-4">{team.xgAgainst.toFixed(2)}</td>
                      <td className={`py-4 ${xGD > 0 ? 'text-emerald-400 font-medium' : xGD < 0 ? 'text-rose-400 font-medium' : 'text-gray-400'}`}>
                        {xGD > 0 ? '+' : ''}{xGD.toFixed(2)}
                      </td>
                      <td className="py-4">{team.actualPoints}</td>
                      <td className="py-4 font-extrabold text-[#D4AF37] text-base">{team.xPts.toFixed(2)}</td>
                      <td className="py-4 text-right pr-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          team.xPtsDelta > 0 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : team.xPtsDelta < 0 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : 'bg-white/5 text-gray-400 border-white/10'
                        }`}>
                          {team.xPtsDelta > 0 ? `+${team.xPtsDelta.toFixed(2)}` : team.xPtsDelta.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="border-t border-white/10 pt-4 mt-2 px-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-gray-400">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">+</span>
                  <span>Under-rewarded — Shot quality indicates higher point expectancy.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">-</span>
                  <span>Over-rewarded — Result exceeded underlying shot metrics.</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-gray-500 text-[11px] uppercase tracking-wider">
                  DATA SOURCE: UNDERSTAT 2D SHOT TELEMETRY • MONEYBALL ENGINE v6.2
                </span>
              </div>
            </div>
          </div>
            </motion.div>
          )}

          {activeTab === 'heroes' && (
            <motion.div 
              key="heroes" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }} 
              transition={{ duration: 0.25 }}
            >
              <div className="mt-2">
            <span className="text-[#D4AF37] text-xs font-bold tracking-widest border border-[#D4AF37]/30 px-3 py-1 rounded-full">PILLAR 4 • POSSESSION ARCHITECTS</span>
            <h2 className="text-3xl font-extrabold mt-3 text-white">THE UNSUNG HEROES INDEX</h2>
            <p className="text-gray-400 text-sm mt-1 max-w-2xl">Quantifying deep attacking progression (xG Buildup & xG Chain). Isolating the players who orchestrate goal-scoring sequences without registering the final shot or assist.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {heroes.slice(0, 3).map((hero, index) => {
                const roleBadge = index === 0 ? "PRIMARY ARCHITECT" : index === 1 ? "DEEP PROGRESSION PIVOT" : "ATTACKING CATALYST";
                const roleColor = index === 0 ? "text-[#D4AF37]" : index === 1 ? "text-emerald-400" : "text-sky-400";
                
                return (
                  <div key={hero.player_name} className={`bg-[#0d0e14] border border-white/10 rounded-xl p-6 relative overflow-hidden ${index === 0 ? 'border-t-2 border-t-[#D4AF37]' : ''}`}>
                    <div className={`text-[10px] font-bold tracking-widest uppercase mb-4 ${roleColor}`}>{roleBadge}</div>
                    
                    <div className="flex items-center space-x-4 mb-4">
                      <img src={hero.photo} alt={hero.player_name} className="w-12 h-12 rounded-full border border-white/20" />
                      <div>
                        <div className="font-bold text-lg text-white">{hero.player_name}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">{hero.position}</div>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-3xl font-extrabold text-[#D4AF37] mt-4">{hero.xGBuildup}</div>
                      <div className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Total xG Buildup</div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10 text-xs text-gray-400 font-medium">
                      <div>Buildup / 90: {hero.buildupPer90}</div>
                      <div>xG Chain: {hero.xGChain}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-[#0d0e14] border border-white/10 rounded-xl p-6 mt-8 overflow-x-auto">
              <div className="mb-6">
                <h3 className="text-xl font-bold uppercase tracking-wider text-white">SQUAD POSSESSION ORCHESTRATION LEDGER</h3>
                <p className="text-gray-400 text-sm mt-1">Ranked by xG Buildup — identifying who initiates scoring sequences before the final pass.</p>
              </div>

              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-gray-400 border-b border-white/10">
                    <th className="pb-3 font-semibold text-center w-12">RANK</th>
                    <th className="pb-3 font-semibold">PLAYER</th>
                    <th className="pb-3 font-semibold">POS</th>
                    <th className="pb-3 font-semibold">MINS</th>
                    <th className="pb-3 font-semibold">G / A</th>
                    <th className="pb-3 font-semibold text-[#D4AF37]">xG BUILDUP</th>
                    <th className="pb-3 font-semibold">BUILDUP / 90</th>
                    <th className="pb-3 font-semibold">xG CHAIN</th>
                    <th className="pb-3 font-semibold">DEEP INVOLVEMENT %</th>
                  </tr>
                </thead>
                <tbody>
                  {heroes.map((player, idx) => {
                    const ratio = player.xGChain > 0 ? Math.min(100, Math.round((player.xGBuildup / player.xGChain) * 100)) : 0;
                    const isTop3 = idx < 3;
                    
                    return (
                      <tr 
                        key={player.player_name}
                        className="border-b border-white/5 hover:bg-white/[0.04] transition-colors"
                      >
                        <td className={`py-3 text-center font-medium ${isTop3 ? 'text-[#D4AF37]' : 'text-gray-500'}`}>{idx + 1}</td>
                        <td className="py-3">
                          <div className="flex items-center space-x-3">
                            <img src={player.photo} alt={player.player_name} className="w-7 h-7 rounded-full border border-white/20" />
                            <span className="font-medium text-white">{player.player_name}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="bg-white/5 border border-white/10 text-gray-300 text-xs px-2 py-0.5 rounded">
                            {player.position}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400">{player.minutes}'</td>
                        <td className="py-3 text-gray-400">{player.goals}G / {player.assists}A</td>
                        <td className="py-3 font-extrabold text-[#D4AF37] text-base">{player.xGBuildup}</td>
                        <td className="py-3 font-medium text-white">{player.buildupPer90}</td>
                        <td className="py-3 text-gray-400">{player.xGChain}</td>
                        <td className="py-3 text-gray-300">
                          <div className="flex items-center">
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden inline-block mr-2">
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-[#D4AF37]" style={{ width: `${ratio}%` }}></div>
                            </div>
                            <span className="text-xs font-semibold">{ratio}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500 italic">
                Tactical Note: A high Deep Involvement % (&gt;70%) indicates a pure deep architect whose attacking value comes entirely from build-up play rather than finishing or crossing.
              </div>
            </div>
          </div>
            </motion.div>
          )}

          {activeTab === 'finishing' && (
            <motion.div 
              key="finishing" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }} 
              transition={{ duration: 0.25 }}
            >
              <div className="mt-2">
                <span className="text-[#D4AF37] text-xs font-bold tracking-widest border border-[#D4AF37]/30 px-3 py-1 rounded-full">PILLAR 4 • CLINICAL EFFICIENCY</span>
                <h2 className="text-3xl font-extrabold mt-3 text-white">THE FINISHING EFFICIENCY MATRIX</h2>
                <p className="text-gray-400 text-sm mt-1 max-w-2xl">Non-Penalty Expected Goals (npXG) vs Actual Non-Penalty Goals. Players above the diagonal baseline are elite overperformers; players below are wasteful.</p>

                <div className="bg-[#0d0e14] border border-white/10 rounded-xl p-6 mt-6">
                  {/* Visual Legend Bar */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 mb-4 pb-4 border-b border-white/10">
                    <div className="flex flex-wrap items-center gap-6">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#D4AF37] border border-white shadow-[0_0_8px_#D4AF37]"></span> Manchester United</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Premier League Competitors</span>
                      <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 border-t border-dashed border-[#D4AF37]"></span> Expected Baseline (Goals = npXG)</span>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center">
                      <span className="text-emerald-400">▲ Above Line: Clinical</span>
                      <span className="text-rose-400 ml-3">▼ Below Line: Wasteful</span>
                    </div>
                  </div>

                  <div className="h-[420px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis type="number" dataKey="npXG" name="Expected Goals (npXG)" stroke="#94a3b8" unit=" xG" domain={[0, 'dataMax + 0.5']} />
                        <YAxis type="number" dataKey="npGoals" name="Actual Goals" stroke="#94a3b8" domain={[0, 'dataMax + 1']} />
                        <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 3, y: 3 }]} stroke="#D4AF37" strokeDasharray="4 4" strokeWidth={2} label={{ value: "Expected Benchmark (1.0 Ratio)", fill: "#D4AF37", fontSize: 11, position: "insideTopLeft" }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Scatter name="Finishers" data={finishers}>
                          {finishers.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.isUnited ? "#D4AF37" : "#475569"} 
                              r={entry.isUnited ? 6 : 4}
                              fillOpacity={entry.isUnited ? 1 : 0.6}
                              stroke={entry.isUnited ? "#ffffff" : "none"}
                              strokeWidth={entry.isUnited ? 1.5 : 0}
                            />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                  {/* Card 1: Clinical */}
                  <div className="bg-[#0d0e14] border border-white/10 rounded-xl p-6 relative overflow-hidden border-t-2 border-t-emerald-500">
                    <div className="text-[10px] font-bold tracking-widest uppercase mb-4 text-emerald-400">LEAGUE MOST CLINICAL</div>
                    <div className="font-bold text-xl text-white">{mostClinical?.player_name}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">{mostClinical?.team_title}</div>
                    
                    <div className="text-3xl font-extrabold text-white">{mostClinical?.npGoals} <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">npGoals</span></div>
                    
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Expected: {mostClinical?.npXG.toFixed(2)} npXG</span>
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">+{mostClinical?.finishingDelta.toFixed(2)} Goals</span>
                    </div>
                  </div>

                  {/* Card 2: United Most Clinical */}
                  <div className="bg-[#0d0e14] border border-white/10 rounded-xl p-6 relative overflow-hidden border-t-2 border-t-[#D4AF37]">
                    <div className="text-[10px] font-bold tracking-widest uppercase mb-4 text-[#D4AF37]">UNITED MOST CLINICAL</div>
                    <div className="font-bold text-xl text-white">{unitedMostClinical?.player_name || 'N/A'}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">{unitedMostClinical?.team_title || 'Manchester United'}</div>
                    
                    <div className="text-3xl font-extrabold text-white">{unitedMostClinical?.npGoals || 0} <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">npGoals</span></div>
                    
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Expected: {unitedMostClinical?.npXG.toFixed(2) || '0.00'} npXG</span>
                      <span className={`font-bold px-2 py-0.5 rounded border ${
                        (unitedMostClinical?.finishingDelta || 0) > 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                        (unitedMostClinical?.finishingDelta || 0) < 0 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 
                        'text-gray-400 bg-white/5 border-white/10'
                      }`}>
                        {(unitedMostClinical?.finishingDelta || 0) > 0 ? '+' : ''}{unitedMostClinical?.finishingDelta.toFixed(2) || '0.00'} Goals
                      </span>
                    </div>
                  </div>
                  
                  {/* Card 3: United Pulse */}
                  <div className="bg-[#0d0e14] border border-white/10 rounded-xl p-6 relative overflow-hidden border-t-2 border-t-sky-500">
                    <div className="text-[10px] font-bold tracking-widest uppercase mb-4 text-sky-400">UNITED SQUAD OVERALL</div>
                    <div className="font-bold text-xl text-white">Manchester United</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">Total Non-Penalty Output</div>
                    
                    <div className="text-3xl font-extrabold text-white">{unitedGoals} <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">npGoals</span></div>
                    
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Expected: {unitedXG.toFixed(2)} npXG</span>
                      <span className={`font-bold px-2 py-0.5 rounded border ${
                        unitedDelta > 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                        unitedDelta < 0 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 
                        'text-gray-400 bg-white/5 border-white/10'
                      }`}>
                        {unitedDelta > 0 ? '+' : ''}{unitedDelta.toFixed(2)} Delta
                      </span>
                    </div>
                  </div>
                  
                  {/* Card 3: Wasteful */}
                  <div className="bg-[#0d0e14] border border-white/10 rounded-xl p-6 relative overflow-hidden border-t-2 border-t-rose-500">
                    <div className="text-[10px] font-bold tracking-widest uppercase mb-4 text-rose-400">CHANCE CONVERSION CRISIS</div>
                    <div className="font-bold text-xl text-white">{mostWasteful?.player_name}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">{mostWasteful?.team_title}</div>
                    
                    <div className="text-3xl font-extrabold text-white">{mostWasteful?.npGoals} <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">npGoals</span></div>
                    
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Expected: {mostWasteful?.npXG.toFixed(2)} npXG</span>
                      <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">{mostWasteful?.finishingDelta.toFixed(2)} Goals</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-xs text-gray-500 italic">
                  Boardroom Intelligence: Players above the diagonal baseline generate positive finishing alpha (elite technique / unsustainable hot streak). Players below the line represent recruitment buy-low opportunities if their xG volume remains high.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
