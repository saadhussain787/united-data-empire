'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FinancialSummary {
  grossSpend: number;
  salesRevenue: number;
  netSpend: number;
  annualAmortization: number;
}

interface EraData {
  eraName: string;
  summary: FinancialSummary;
  incoming: TransferItem[];
  outgoing: TransferItem[];
}

interface TransferItem {
  playerName: string;
  isIncoming: boolean;
  fee: string;
  feeNumeric: number;
  currency: string;
  contractYears: number | null;
  season: string;
  transferType: string;
  otherClubLogo?: string;
  isAcademyPromotion?: boolean;
  isLoanReturn?: boolean;
}

const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) return "0.00M";
  if (value >= 1000000000) {
    return (value / 1000000000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + "B";
  }
  if (value >= 1000000) {
    return (value / 1000000).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + "M";
  }
  return value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + "M";
};

export default function TransfersPage() {
  const [eras, setEras] = useState<EraData[]>([]);
  const [selectedEraIndex, setSelectedEraIndex] = useState<number>(0);
  
  const activeEra = eras[selectedEraIndex];
  const summary = activeEra?.summary;
  const incoming = activeEra?.incoming || [];
  const outgoing = activeEra?.outgoing || [];
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'amortization'>('incoming');
  const [txFilter, setTxFilter] = useState<'all' | 'cash' | 'academy'>('all');

  const filteredIncoming = useMemo(() => {
    if (txFilter === 'cash') {
      return incoming.filter(t => t.transferType !== 'Academy Promotion' && t.transferType !== 'Loan Return');
    }
    if (txFilter === 'academy') {
      return incoming.filter(t => ['Academy Promotion', 'Loan Return', 'Loan'].includes(t.transferType));
    }
    return incoming;
  }, [incoming, txFilter]);

  const filteredOutgoing = useMemo(() => {
    if (txFilter === 'cash') {
      return outgoing.filter(t => t.transferType !== 'Academy Promotion' && t.transferType !== 'Loan Return');
    }
    if (txFilter === 'academy') {
      return outgoing.filter(t => ['Academy Promotion', 'Loan Return', 'Loan'].includes(t.transferType));
    }
    return outgoing;
  }, [outgoing, txFilter]);

  useEffect(() => {
    fetch('/api/transfers')
      .then(res => res.json())
      .then(result => {
        if (result.status === 'SUCCESS' && result.data?.eras) {
          setEras(result.data.eras);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching transfers:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-white font-mono animate-pulse min-h-[50vh]">
        LOADING INEOS VAULT...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      {/* Executive Header */}
      <div className="mb-12 border-b border-white/10 pb-6 mt-8">
        <span className="text-[#D4AF37] text-xs font-bold tracking-widest border border-[#D4AF37]/30 px-3 py-1 rounded-full">
          PILLAR 5 • INEOS FINANCIAL VAULT
        </span>
        <h1 className="text-4xl lg:text-5xl font-extrabold text-white mt-4 uppercase tracking-tighter">
          TRANSFER BALANCE SHEET
        </h1>
        {eras.length > 0 && (
          <div className="relative inline-block mt-2 mb-6">
            <select 
              className="bg-[#08090d] border border-[#D4AF37]/40 text-[#D4AF37] text-lg md:text-xl font-extrabold py-3 pl-4 pr-12 rounded-xl cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all"
              value={selectedEraIndex}
              onChange={(e) => setSelectedEraIndex(Number(e.target.value))}
            >
              {eras.map((era, index) => <option key={index} value={index}>{era.eraName}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
        <p className="text-gray-400 mt-2 text-sm tracking-wide">
          Financial Ledger • PSR & FFP Amortization Accounting
        </p>
      </div>

      {/* 4 INEOS Macro Balance Sheet Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        
        {/* Card 1: GROSS EXPENDITURE (SIGNINGS) */}
        <div className="bg-[#111]/80 backdrop-blur-md border border-white/10 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">ERA GROSS SPEND</p>
            <h2 className="text-3xl font-extrabold text-rose-500">
              €{formatCurrency(summary?.grossSpend)}
            </h2>
          </div>
          <div className="mt-4">
            <span className="bg-rose-500/10 text-rose-400 text-xs font-bold px-2 py-1 rounded-md">
              {incoming.length} ARRIVALS
            </span>
          </div>
        </div>

        {/* Card 2: SALES REVENUE (DEPARTURES) */}
        <div className="bg-[#111]/80 backdrop-blur-md border border-white/10 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">ERA SALES REVENUE</p>
            <h2 className="text-3xl font-extrabold text-emerald-400">
              €{formatCurrency(summary?.salesRevenue)}
            </h2>
          </div>
          <div className="mt-4">
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-1 rounded-md">
              {outgoing.length} DEPARTURES
            </span>
          </div>
        </div>

        {/* Card 3: NET TRANSFER SPEND */}
        <div className="bg-[#111]/80 backdrop-blur-md border border-[#D4AF37]/30 p-6 rounded-xl flex flex-col justify-between shadow-[0_0_15px_rgba(212,175,55,0.05)]">
          <div>
            <p className="text-xs text-[#D4AF37]/70 font-bold uppercase tracking-wider mb-1">ERA NET EXPENDITURE</p>
            <h2 className="text-3xl font-extrabold text-[#D4AF37]">
              €{formatCurrency(summary?.netSpend)}
            </h2>
          </div>
          <div className="mt-4">
            <span className="text-gray-400 text-xs font-medium">
              Net cash commitment
            </span>
          </div>
        </div>

        {/* Card 4: ANNUAL PSR AMORTIZATION */}
        <div className="bg-[#111]/80 backdrop-blur-md border border-white/10 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">ERA ANNUAL BOOK VALUE BURDEN</p>
            <h2 className="text-3xl font-extrabold text-sky-400">
              €{formatCurrency(summary?.annualAmortization)} / yr
            </h2>
          </div>
          <div className="mt-4">
            <span className="text-gray-400 text-xs font-medium">
              5-Year Straight-Line Depreciation
            </span>
          </div>
        </div>

      </div>

      {/* Executive Segmented Control (Tab Bar) */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-white/[0.04] border border-white/10 rounded-2xl backdrop-blur-md gap-2 mt-8 mb-6">
          {(['incoming', 'outgoing', 'amortization'] as const).map((tab) => {
            const isActive = activeTab === tab;
            let label = '';
            let count = '';
            if (tab === 'incoming') {
              label = 'ARRIVALS';
              count = incoming.length.toString();
            } else if (tab === 'outgoing') {
              label = 'DEPARTURES';
              count = outgoing.length.toString();
            } else {
              label = 'PSR AMORTIZATION';
            }

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-2.5 rounded-xl text-sm font-bold tracking-wider transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="transferTabGlow"
                    className="absolute inset-0 bg-gradient-to-r from-red-600/30 to-amber-500/20 border border-[#D4AF37]/40 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-2 ${isActive ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]' : ''}`}>
                  {tab === 'amortization' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  {label}
                  {count && (
                    <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-md ${isActive ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/10 text-gray-400'}`}>
                      {count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Animated Container Branches */}
      <AnimatePresence mode="wait">
        {activeTab === 'incoming' && (
          <motion.div
            key="incoming"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-4 bg-[#111]/80 backdrop-blur-md border border-white/10 p-8 rounded-xl"
          >
            <h3 className="text-xl font-bold text-white mb-8 uppercase tracking-widest border-b border-white/10 pb-4">
              {activeEra?.eraName.toUpperCase()} SIGNINGS
            </h3>

            {/* Executive Filter Toggle */}
            <div className="flex gap-2 mb-4">
              {(['all', 'cash', 'academy'] as const).map(filterType => (
                <button
                  key={filterType}
                  onClick={() => setTxFilter(filterType)}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${
                    txFilter === filterType 
                      ? 'bg-white/10 text-white' 
                      : 'border border-white/10 text-gray-500 hover:text-white'
                  }`}
                >
                  {filterType === 'all' ? 'ALL MOVEMENTS' : filterType === 'cash' ? 'FIRST TEAM CASH DEALS' : 'ACADEMY & LOANS'}
                </button>
              ))}
            </div>

            <div className="bg-[#0d0e14]/90 border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-gray-500 uppercase tracking-widest bg-white/[0.02]">
                    <th className="py-4 px-6 font-semibold">PLAYER</th>
                    <th className="py-4 px-6 font-semibold">TYPE</th>
                    <th className="py-4 px-6 font-semibold">TERM</th>
                    <th className="py-4 px-6 font-semibold">ORIGIN CLUB</th>
                    <th className="py-4 px-6 font-semibold text-right">TRANSFER FEE</th>
                    <th className="py-4 px-6 font-semibold text-right">ANNUAL PSR COST</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredIncoming.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                      <td className="py-4 px-6 font-medium text-white">{item.playerName}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                          item.transferType === 'Academy Promotion' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                          item.transferType === 'Loan Return' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                          item.transferType === 'Loan' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {item.transferType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        {item.contractYears ? `${item.contractYears} Years` : 'Existing'}
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        <div className="flex items-center gap-2">
                          {item.otherClubLogo && (
                            <img 
                              src={item.otherClubLogo} 
                              alt="Club Logo" 
                              className="w-5 h-5 object-contain rounded-sm"
                            />
                          )}
                          <span>{(item as any).otherClub || 'External Club'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-[#D4AF37]">
                        {['Loan Return', 'Academy Promotion'].includes(item.transferType) ? '—' : `€${formatCurrency(item.feeNumeric)}`}
                      </td>
                      <td className="py-4 px-6 text-right text-cyan-400/80">
                        {['Loan Return', 'Academy Promotion'].includes(item.transferType) ? '—' : `€${formatCurrency(item.feeNumeric / (item.contractYears || 5))} / yr`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-white/[0.01] flex justify-between items-center text-xs text-gray-400 uppercase tracking-widest">
                <span>Total Signings: <strong className="text-white ml-1">{incoming.length}</strong></span>
                <span>Total Expenditure: <strong className="text-rose-400 ml-1">€{formatCurrency(summary?.grossSpend)}</strong></span>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'outgoing' && (
          <motion.div
            key="outgoing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-4 bg-[#111]/80 backdrop-blur-md border border-white/10 p-8 rounded-xl"
          >
            <h3 className="text-xl font-bold text-white mb-8 uppercase tracking-widest border-b border-white/10 pb-4">
              {activeEra?.eraName.toUpperCase()} DEPARTURES
            </h3>

            {/* Executive Filter Toggle */}
            <div className="flex gap-2 mb-4">
              {(['all', 'cash', 'academy'] as const).map(filterType => (
                <button
                  key={filterType}
                  onClick={() => setTxFilter(filterType)}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${
                    txFilter === filterType 
                      ? 'bg-white/10 text-white' 
                      : 'border border-white/10 text-gray-500 hover:text-white'
                  }`}
                >
                  {filterType === 'all' ? 'ALL MOVEMENTS' : filterType === 'cash' ? 'FIRST TEAM CASH DEALS' : 'ACADEMY & LOANS'}
                </button>
              ))}
            </div>

            <div className="bg-[#0d0e14]/90 border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-gray-500 uppercase tracking-widest bg-white/[0.02]">
                    <th className="py-4 px-6 font-semibold">PLAYER</th>
                    <th className="py-4 px-6 font-semibold">TYPE</th>
                    <th className="py-4 px-6 font-semibold">DESTINATION CLUB</th>
                    <th className="py-4 px-6 font-semibold text-right">FEE RECEIVED</th>
                    <th className="py-4 px-6 font-semibold text-right">ACCOUNTING STATUS</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredOutgoing.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                      <td className="py-4 px-6 font-medium text-white">{item.playerName}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                          item.transferType === 'Academy Promotion' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                          item.transferType === 'Loan Return' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                          item.transferType === 'Loan' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {item.transferType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        <div className="flex items-center gap-2">
                          {item.otherClubLogo && (
                            <img 
                              src={item.otherClubLogo} 
                              alt="Club Logo" 
                              className="w-5 h-5 object-contain rounded-sm"
                            />
                          )}
                          <span>{(item as any).otherClub || 'External Club'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-emerald-400">
                        {['Loan Return', 'Academy Promotion'].includes(item.transferType) ? '—' : `€${formatCurrency(item.feeNumeric)}`}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                          item.transferType.toLowerCase().includes('loan')
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {item.transferType.toLowerCase().includes('loan') ? 'Wage Relief' : '100% Cash Realized'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-white/[0.01] flex justify-between items-center text-xs text-gray-400 uppercase tracking-widest">
                <span>Total Departures: <strong className="text-white ml-1">{outgoing.length}</strong></span>
                <span>Total Sales Revenue: <strong className="text-emerald-400 ml-1">€{formatCurrency(summary?.salesRevenue)}</strong></span>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'amortization' && (
          <motion.div
            key="amortization"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-4 bg-[#111]/80 backdrop-blur-md border border-white/10 p-8 rounded-xl"
          >
            <h3 className="text-xl font-bold text-white mb-8 uppercase tracking-widest border-b border-white/10 pb-4">
              PSR / FFP AMORTIZATION ACCOUNTING
            </h3>
            {/* Executive Explainer Callout */}
            <div className="mb-6 p-4 border border-sky-500/30 bg-sky-500/5 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-sky-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-sky-200/80 leading-relaxed">
                <strong className="text-sky-400">Premier League PSR Rule:</strong> Under financial fair play regulations, transfer fees are not expensed immediately; they are amortized evenly over a maximum 5-year contract term.
              </p>
            </div>

            <div className="bg-[#0d0e14]/90 border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-gray-500 uppercase tracking-widest bg-white/[0.02]">
                    <th className="py-4 px-6 font-semibold">PLAYER</th>
                    <th className="py-4 px-6 font-semibold text-right">ACQUISITION COST</th>
                    <th className="py-4 px-6 font-semibold text-center">CONTRACT LENGTH</th>
                    <th className="py-4 px-6 font-semibold text-right">ANNUAL BOOK AMORTIZATION</th>
                    <th className="py-4 px-6 font-semibold text-right">YEAR 1 RESIDUAL BOOK VALUE</th>
                    <th className="py-4 px-6 font-semibold w-48">DEPRECIATION RATIO</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {incoming.map((item, idx) => {
                    const term = item.contractYears || 5;
                    const annualAmortization = item.feeNumeric / term;
                    const residual = item.feeNumeric - annualAmortization;
                    const ratio = item.feeNumeric > 0 && term > 0 ? (residual / item.feeNumeric) * 100 : 0;
                    
                    return (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                        <td className="py-4 px-6 font-medium text-white">{item.playerName}</td>
                        <td className="py-4 px-6 text-right text-gray-300">
                          {['Loan Return', 'Academy Promotion'].includes(item.transferType) ? '—' : `€${formatCurrency(item.feeNumeric)}`}
                        </td>
                        <td className="py-4 px-6 text-center text-gray-400">
                          {item.contractYears ? `${item.contractYears} Years` : 'Existing'}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-[#D4AF37]">
                          {['Loan Return', 'Academy Promotion'].includes(item.transferType) ? '—' : (
                            <>€{formatCurrency(annualAmortization)} <span className="text-[10px] text-gray-500 font-normal">/ season</span></>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right text-gray-300">
                          {['Loan Return', 'Academy Promotion'].includes(item.transferType) ? '—' : (
                            <>€{formatCurrency(residual)} <span className="text-[10px] text-gray-500 font-normal">remaining</span></>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {['Loan Return', 'Academy Promotion'].includes(item.transferType) ? (
                            <span className="text-gray-500">—</span>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                                <span>YR 1</span>
                                <span>{ratio > 0 ? Math.round(ratio) : 0}% REMAINING</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                {ratio > 0 && (
                                  <div 
                                    className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 rounded-full" 
                                    style={{ width: `${ratio}%` }} 
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="p-4 border-t border-white/10 bg-white/[0.01] flex justify-between items-center text-xs uppercase tracking-widest">
                <span className="text-gray-400">Total Annual PSR Commitment: <strong className="text-sky-400 ml-1">€{formatCurrency(summary?.annualAmortization)} / yr</strong></span>
                <span className="flex items-center gap-2 text-emerald-400 font-bold">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Status: PSR Compliant
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
