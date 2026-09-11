'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Define the Manager interface matching our /api/manager route
interface Manager {
  name: string;
  photo: string | null;
  appointedDate: string;
  leftDate: string | null;
  isCurrent: boolean;
  totalMatches: number;
  winPercentage: number;
  preferredShape: string | null;
  ppg: number;
}

export default function ManagerDossierPage() {
  const [currentManager, setCurrentManager] = useState<Manager | null>(null);
  const [historicalManagers, setHistoricalManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Tactical Duel State
  const [selectedManagerA, setSelectedManagerA] = useState<string>('');
  const [selectedManagerB, setSelectedManagerB] = useState<string>('');
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'DUEL'>('LEDGER');

  useEffect(() => {
    async function fetchManagers() {
      try {
        const res = await fetch('/api/manager');
        const json = await res.json();

        if (json.status === 'SUCCESS' && json.data) {
          const curr = json.data.currentManager || null;
          const hist = json.data.historicalManagers || [];
          
          setCurrentManager(curr);
          setHistoricalManagers(hist);
          
          // Initialize Tactical Duel selections
          const all = curr ? [curr, ...hist.filter((m: Manager) => m.name !== curr.name)] : hist;
          if (all.length > 0) {
            const saf = all.find((m: Manager) => m.name.includes('Ferguson'));
            setSelectedManagerA(saf ? saf.name : (all[1]?.name || all[0].name));
            setSelectedManagerB(curr ? curr.name : all[0].name);
          }
        }
      } catch (error) {
        console.error("Error fetching manager data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchManagers();
  }, []);

  const allManagers = currentManager 
    ? [currentManager, ...historicalManagers.filter(m => m.name !== currentManager.name)]
    : historicalManagers;
  
  const managerA = allManagers.find(m => m.name === selectedManagerA);
  const managerB = allManagers.find(m => m.name === selectedManagerB);

  // Helper to format date safely
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-transparent min-h-screen text-white p-6 md:p-8">
      
      {/* Executive Boardroom Header */}
      <div className="mb-8">
        <span className="text-[#D4AF37] text-xs font-bold tracking-widest border border-[#D4AF37]/30 px-3 py-1 rounded-full">
          PILLAR 5B • DUGOUT COMMAND
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-4 mb-2 tracking-tight">
          THE MANAGER DOSSIER
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          Tactical Identity, Performance Telemetry & The 34-Manager Dugout Dynasty
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
        </div>
      ) : (
        <>
          {/* The Active Head Coach Spotlight Dossier Card */}
          {currentManager && (
            <motion.div 
              whileHover={{ scale: 1.01, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[#0d0e14]/90 border border-white/10 rounded-2xl p-6 md:p-8 mt-8 relative overflow-hidden backdrop-blur-md border-t-2 border-t-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.05)] hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] hover:border-t-[#D4AF37]/80 transition-shadow duration-300"
            >
              
              {/* Top Status Bar */}
              <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <span className="text-[#D4AF37] text-sm font-bold tracking-widest uppercase">
                  ACTIVE HEAD COACH
                </span>
              </div>

              {/* Hero Identity Flex Container */}
              <div className="flex items-center gap-6 mb-8">
                {/* Luxury Monogram Insignia Badge */}
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 via-white/[0.03] to-transparent border border-[#D4AF37]/35 flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.12)] backdrop-blur-xl relative overflow-hidden flex-shrink-0">
                  {/* Subtle gold glow orb watermark */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#D4AF37]/10 to-transparent rounded-2xl"></div>
                  <span className="text-2xl md:text-3xl font-extrabold tracking-wider text-[#D4AF37] drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] relative z-10">
                    {currentManager.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
                    {currentManager.name}
                  </h2>
                  <div className="flex flex-wrap items-center text-sm md:text-base text-gray-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block mr-2" />
                    First Team Gaffer • Inaugurated: {formatDate(currentManager.appointedDate)}
                    
                    {currentManager.preferredShape && (
                      <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-amber-400 mt-2 sm:mt-0">
                        {currentManager.preferredShape} SYSTEM
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Core Tactical KPI Metrics (4-Column Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-white/[0.02] p-6 rounded-xl border border-white/5">
                
                <div className="flex flex-col space-y-1">
                  <span className="text-gray-500 text-xs font-semibold tracking-wider uppercase">Matches Managed</span>
                  <span className="text-2xl font-bold text-white">{currentManager.totalMatches}</span>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-gray-500 text-xs font-semibold tracking-wider uppercase">Points Per Game (PPG)</span>
                  <span className="text-[#D4AF37] text-3xl font-extrabold">{currentManager.ppg?.toFixed(2) || '0.00'}</span>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-gray-500 text-xs font-semibold tracking-wider uppercase">Win Percentage</span>
                  <span className="text-2xl font-bold text-white">{currentManager.winPercentage?.toFixed(1) || '0.0'}%</span>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-gray-500 text-xs font-semibold tracking-wider uppercase">Tenure Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-emerald-400">Contract Active • First Team Gaffer</span>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-8 mt-12 mb-6 border-b border-white/10 pb-4">
            <button 
              onClick={() => setActiveTab('LEDGER')}
              className={`text-sm font-bold tracking-widest uppercase transition-colors relative pb-4 -mb-4 ${activeTab === 'LEDGER' ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-white'}`}
            >
              HISTORICAL DUGOUT DYNASTY
              {activeTab === 'LEDGER' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]"></span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('DUEL')}
              className={`text-sm font-bold tracking-widest uppercase transition-colors relative pb-4 -mb-4 ${activeTab === 'DUEL' ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-white'}`}
            >
              TACTICAL DUEL: HEAD-TO-HEAD
              {activeTab === 'DUEL' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]"></span>
              )}
            </button>
          </div>

          {/* The Historical Dugout Dynasty Ledger */}
          {activeTab === 'LEDGER' && (
            <div className="bg-[#0d0e14] border border-white/10 rounded-2xl overflow-x-auto p-6 md:p-8 animate-in fade-in duration-500">
              <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-white">THE DUGOUT DYNASTY</h2>
              <p className="text-gray-500 text-sm mt-1">Historical managerial records ranked chronologically.</p>
            </div>
            
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-500 uppercase tracking-widest bg-white/[0.02]">
                  <th className="py-4 px-4 font-semibold">ERA</th>
                  <th className="py-4 px-4 font-semibold">MANAGER</th>
                  <th className="py-4 px-4 font-semibold">TENURE</th>
                  <th className="py-4 px-4 font-semibold text-right">MATCHES</th>
                  <th className="py-4 px-4 font-semibold text-right">WIN %</th>
                  <th className="py-4 px-4 font-semibold text-right">PPG</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {historicalManagers.map((manager, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 px-4 text-gray-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={manager.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(manager.name)}&background=0D0E14&color=D4AF37&size=256`} 
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(manager.name)}&background=0D0E14&color=D4AF37&size=256`;
                          }}
                          alt={manager.name} 
                          className="w-8 h-8 rounded-full object-cover object-top flex-shrink-0 border border-white/10"
                        />
                        <span className="font-bold text-white whitespace-nowrap">{manager.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-400 whitespace-nowrap">
                      {formatDate(manager.appointedDate)} – {manager.leftDate ? formatDate(manager.leftDate) : 'Present'}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-500 font-medium">
                      {manager.totalMatches}
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      <span className={manager.winPercentage > 50 ? 'text-emerald-400/90' : 'text-gray-500'}>
                        {manager.winPercentage?.toFixed(1) || '0.0'}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-[#D4AF37] font-bold">
                      {manager.ppg?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {/* TACTICAL DUEL: HEAD-TO-HEAD */}
          {activeTab === 'DUEL' && managerA && managerB && (
            <div className="mb-12 animate-in fade-in duration-500">
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-white">TACTICAL DUEL: HEAD-TO-HEAD</h2>
                <p className="text-gray-500 text-sm mt-1">Compare managerial records, win rates, and points-per-game.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                
                {/* Card A */}
                <div className="bg-[#0d0e14] border border-white/10 rounded-2xl p-6 relative">
                  <select 
                    value={selectedManagerA}
                    onChange={(e) => setSelectedManagerA(e.target.value)}
                    className="w-full bg-[#161821] text-white border border-white/10 rounded-lg p-3 outline-none focus:border-[#D4AF37]/50 appearance-none mb-6 cursor-pointer font-medium"
                  >
                    {allManagers.map(m => (
                      <option key={`a-${m.name}`} value={m.name}>{m.name}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-5 mb-8">
                    {/* Luxury Monogram Insignia Badge */}
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 via-white/[0.03] to-transparent border border-[#D4AF37]/35 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.15)] backdrop-blur-xl relative overflow-hidden flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#D4AF37]/10 to-transparent rounded-2xl"></div>
                      <span className="text-2xl font-extrabold tracking-wider text-[#D4AF37] drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] relative z-10">
                        {managerA.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl md:text-2xl font-bold text-white tracking-tight">{managerA.name}</span>
                      <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">{managerA.isCurrent ? 'Active Manager' : 'Historical'}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                      <span className="text-gray-500 font-medium">Matches Managed</span>
                      <span className="text-white font-bold">{managerA.totalMatches}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                      <span className="text-gray-500 font-medium">Win Percentage</span>
                      <span className={`font-bold ${managerA.winPercentage > managerB.winPercentage ? 'text-emerald-400' : managerA.winPercentage < managerB.winPercentage ? 'text-rose-400' : 'text-white'}`}>
                        {managerA.winPercentage?.toFixed(1) || '0.0'}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-gray-500 font-medium">Points Per Game (PPG)</span>
                      <span className={`font-bold text-lg ${managerA.ppg > managerB.ppg ? 'text-[#D4AF37]' : managerA.ppg < managerB.ppg ? 'text-gray-500' : 'text-white'}`}>
                        {managerA.ppg?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card B */}
                <div className="bg-[#0d0e14] border border-white/10 rounded-2xl p-6 relative">
                  <select 
                    value={selectedManagerB}
                    onChange={(e) => setSelectedManagerB(e.target.value)}
                    className="w-full bg-[#161821] text-white border border-white/10 rounded-lg p-3 outline-none focus:border-[#D4AF37]/50 appearance-none mb-6 cursor-pointer font-medium"
                  >
                    {allManagers.map(m => (
                      <option key={`b-${m.name}`} value={m.name}>{m.name}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-5 mb-8">
                    {/* Luxury Monogram Insignia Badge */}
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 via-white/[0.03] to-transparent border border-[#D4AF37]/35 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.15)] backdrop-blur-xl relative overflow-hidden flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#D4AF37]/10 to-transparent rounded-2xl"></div>
                      <span className="text-2xl font-extrabold tracking-wider text-[#D4AF37] drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] relative z-10">
                        {managerB.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl md:text-2xl font-bold text-white tracking-tight">{managerB.name}</span>
                      <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">{managerB.isCurrent ? 'Active Manager' : 'Historical'}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                      <span className="text-gray-500 font-medium">Matches Managed</span>
                      <span className="text-white font-bold">{managerB.totalMatches}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                      <span className="text-gray-500 font-medium">Win Percentage</span>
                      <span className={`font-bold ${managerB.winPercentage > managerA.winPercentage ? 'text-emerald-400' : managerB.winPercentage < managerA.winPercentage ? 'text-rose-400' : 'text-white'}`}>
                        {managerB.winPercentage?.toFixed(1) || '0.0'}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-gray-500 font-medium">Points Per Game (PPG)</span>
                      <span className={`font-bold text-lg ${managerB.ppg > managerA.ppg ? 'text-[#D4AF37]' : managerB.ppg < managerA.ppg ? 'text-gray-500' : 'text-white'}`}>
                        {managerB.ppg?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
