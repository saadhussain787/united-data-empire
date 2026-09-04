"use client";

import { useState } from 'react';
import Link from 'next/link';
import PlayerAvatar from './PlayerAvatar';

type Player = {
  id: number;
  espnId: string;
  name: string;
  photo: string | null;
  squadRole: string;
  age: number | null;
  metadata: {
    jersey?: string;
    position?: string;
    age?: number;
    [key: string]: unknown;
  };
};

const normalizePosition = (rawPos: string = '') => {
  const lower = rawPos.toLowerCase();
  if (lower.includes('goal')) return 'Goalkeepers';
  if (lower.includes('defend') || lower.includes('back')) return 'Defenders';
  if (lower.includes('midfield')) return 'Midfielders';
  if (lower.includes('forward') || lower.includes('strik') || lower.includes('wing') || lower.includes('attack')) return 'Forwards';
  return 'Reserves';
};

const getPosAbbr = (rawPos: string = '') => {
  const lower = rawPos.toLowerCase();
  if (lower.includes('goal')) return 'GK';
  if (lower.includes('defend') || lower.includes('back')) return 'DEF';
  if (lower.includes('midfield')) return 'MID';
  if (lower.includes('forward') || lower.includes('strik') || lower.includes('wing') || lower.includes('attack')) return 'FWD';
  return 'RES';
};

type SortKey = 'jersey' | 'name' | 'age' | 'apps' | 'mins' | 'goals' | 'assists' | 'xG' | 'xA' | 'xGxA90' | 'yc' | 'rc';
type SortDirection = 'asc' | 'desc' | null;

export default function SquadMatrix({ initialPlayers }: { initialPlayers: Player[] }) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'jersey', direction: null });

  const handleSort = (key: SortKey) => {
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'desc') setSortConfig({ key, direction: 'asc' });
      else if (sortConfig.direction === 'asc') setSortConfig({ key: 'jersey', direction: null });
      else setSortConfig({ key, direction: 'desc' });
    } else {
      setSortConfig({ key, direction: 'desc' });
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key || sortConfig.direction === null) {
      return <span className="opacity-0 group-hover:opacity-50 transition-opacity ml-1">↕</span>;
    }
    return <span className="text-[#D4AF37] ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const parseVal = (player: Player, key: SortKey) => {
    const seasonStats = player.metadata?.seasonStats || {};
    if (key === 'jersey') return parseInt(player.metadata?.jersey || '999', 10);
    if (key === 'name') return player.name;
    if (key === 'age') return player.metadata?.age || player.age || 0;
    if (key === 'apps') return seasonStats.apps !== undefined ? seasonStats.apps : -1;
    if (key === 'mins') return seasonStats.minutes !== undefined ? seasonStats.minutes : -1;
    if (key === 'goals') return seasonStats.goals !== undefined ? seasonStats.goals : -1;
    if (key === 'assists') return seasonStats.assists !== undefined ? seasonStats.assists : -1;
    if (key === 'xG') return seasonStats.xG !== undefined ? Number(seasonStats.xG) : -1;
    if (key === 'xA') return seasonStats.xA !== undefined ? Number(seasonStats.xA) : -1;
    if (key === 'yc') return seasonStats.yc !== undefined ? seasonStats.yc : -1;
    if (key === 'rc') return seasonStats.rc !== undefined ? seasonStats.rc : -1;
    if (key === 'xGxA90') {
      const mins = seasonStats.minutes;
      const xG = Number(seasonStats.xG) || 0;
      const xA = Number(seasonStats.xA) || 0;
      if (typeof mins === 'number' && mins > 0) return ((xG + xA) / mins) * 90;
      return -1;
    }
    return 0;
  };

  // Calculate maxMinutes for the Minutes Share progress bar
  let maxMinutes = 1;
  initialPlayers.forEach((p: Player) => {
    const m = p.metadata?.seasonStats?.minutes;
    if (typeof m === 'number' && m > maxMinutes) {
      maxMinutes = m;
    }
  });

  const groupedPlayers: Record<string, Player[]> = {
    Goalkeepers: [],
    Defenders: [],
    Midfielders: [],
    Forwards: [],
  };

  initialPlayers.forEach(player => {
    const bucket = normalizePosition(player.metadata?.position);
    if (groupedPlayers[bucket]) {
      groupedPlayers[bucket].push(player);
    } else {
      groupedPlayers.Forwards.push(player); // Fallback
    }
  });

  const positionOrder = ['Goalkeepers', 'Defenders', 'Midfielders', 'Forwards'];

  const SortableHeader = ({ label, sortKey, align = 'center', width = 'w-20', colorClass = '', title = '' }: { label: string, sortKey: SortKey, align?: string, width?: string, colorClass?: string, title?: string }) => (
    <th 
      className={`py-4 px-4 font-semibold ${width} text-${align} cursor-pointer group hover:bg-[#DA291C]/10 transition-colors select-none ${colorClass}`}
      onClick={() => handleSort(sortKey)}
      title={title || undefined}
    >
      <div className={`flex items-center justify-${align === 'left' ? 'start' : align === 'right' ? 'end' : 'center'}`}>
        {label}
        {getSortIcon(sortKey)}
      </div>
    </th>
  );

  return (
    <div className="space-y-16">
      {positionOrder.map((positionGroup) => {
        const groupPlayers = groupedPlayers[positionGroup];
        if (!groupPlayers || groupPlayers.length === 0) return null;

        const sortedGroup = [...groupPlayers].sort((a, b) => {
          if (!sortConfig.direction || sortConfig.key === 'jersey') {
            return (parseVal(a, 'jersey') as number) - (parseVal(b, 'jersey') as number);
          }
          const aVal = parseVal(a, sortConfig.key);
          const bVal = parseVal(b, sortConfig.key);
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        });

        return (
          <section key={positionGroup} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-white border-l-4 border-[#DA291C] pl-4 uppercase tracking-wider">
              {positionGroup}
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[1050px]">
                <thead className="sticky top-0 z-20 shadow-sm">
                  <tr className="text-xs uppercase tracking-wider text-gray-400 border-b border-[#DA291C]/30 bg-[#0B0E14] shadow-md">
                    <SortableHeader label="#" sortKey="jersey" width="w-16" />
                    <SortableHeader label="Player" sortKey="name" align="left" width="w-64" />
                    <SortableHeader label="Age" sortKey="age" width="w-12" />
                    <th className="py-4 px-4 font-semibold text-center w-16">Pos</th>
                    <SortableHeader label="Apps" sortKey="apps" />
                    <SortableHeader label="Min" sortKey="mins" />
                    <SortableHeader label="G" sortKey="goals" />
                    <SortableHeader label="A" sortKey="assists" />
                    <SortableHeader label="xG" sortKey="xG" title="Expected Goals" />
                    <SortableHeader label="xA" sortKey="xA" title="Expected Assists" />
                    <SortableHeader label="xG+xA/90" sortKey="xGxA90" width="w-24" title="Expected Goals + Expected Assists per 90 Minutes. Measures underlying attacking contribution." />
                    <SortableHeader label="YC" sortKey="yc" width="w-16" colorClass="text-yellow-500" />
                    <SortableHeader label="RC" sortKey="rc" width="w-16" colorClass="text-[#DA291C]" />
                    <th className="py-4 px-4 font-semibold text-right w-32">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 relative z-0">
                  {sortedGroup.map((player) => {
                    const jersey = player.metadata?.jersey || '-';
                    const positionName = player.metadata?.position || positionGroup.slice(0, -1);
                    const posAbbr = getPosAbbr(positionName);
                    const age = player.metadata?.age || player.age || '-';
                    const seasonStats = player.metadata?.seasonStats || {};
                    const apps = seasonStats.apps !== undefined ? seasonStats.apps : '-';
                    const mins = seasonStats.minutes !== undefined ? seasonStats.minutes : '-';
                    const goals = seasonStats.goals !== undefined ? seasonStats.goals : 0;
                    const assists = seasonStats.assists !== undefined ? seasonStats.assists : 0;
                    const yc = seasonStats.yc !== undefined ? seasonStats.yc : 0;
                    const rc = seasonStats.rc !== undefined ? seasonStats.rc : 0;
                    
                    const xG = seasonStats.xG !== undefined ? Number(seasonStats.xG) : 0;
                    const xA = seasonStats.xA !== undefined ? Number(seasonStats.xA) : 0;
                    
                    const xGxA90Val = (typeof mins === 'number' && mins > 0) ? ((xG + xA) / mins) * 90 : 0;
                    const xGxA90 = (typeof mins === 'number' && mins > 0) 
                      ? xGxA90Val.toFixed(2) 
                      : '-';

                    let xGxA90Class = "py-4 px-4 text-center font-mono w-24 ";
                    if (typeof mins === 'number' && mins > 0) {
                      if (xGxA90Val >= 0.50) {
                        xGxA90Class += "text-[#D4AF37] font-bold";
                      } else if (xGxA90Val > 0.00 && xGxA90Val < 0.15) {
                        xGxA90Class += "text-gray-600";
                      } else {
                        xGxA90Class += "text-gray-300";
                      }
                    } else {
                      xGxA90Class += "text-gray-400";
                    }
                    
                    return (
                      <tr key={player.espnId} className="hover:bg-gray-900/50 transition-colors group">
                        <td className="py-4 px-4 text-center font-mono text-[#D4AF37] font-bold text-lg w-16">
                          {jersey}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-4">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#151A22] border border-gray-700 flex-shrink-0 flex items-center justify-center">
                              <PlayerAvatar name={player.name} />
                            </div>
                            <div className="font-bold text-white group-hover:text-[#D4AF37] transition-colors whitespace-nowrap">
                              {player.name}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center text-gray-300 font-mono w-12">{age}</td>
                        <td className="py-4 px-4 text-center text-xs text-gray-400 font-bold uppercase tracking-wider w-16 truncate">{posAbbr}</td>
                        
                        <td className="py-4 px-4 text-center font-mono text-gray-300 w-20">{apps}</td>
                        <td className="py-4 px-4 align-middle w-20">
                          <div className="flex flex-col items-center justify-center space-y-1.5 w-full">
                            <span className="font-mono text-gray-300 leading-none">{mins}</span>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#DA291C]" 
                                style={{ width: `${typeof mins === 'number' && mins > 0 ? (mins / maxMinutes) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-bold text-white w-20">{goals}</td>
                        <td className="py-4 px-4 text-center font-mono font-bold text-white w-20">{assists}</td>
                        <td className="py-4 px-4 text-center font-mono text-[#D4AF37] w-20">{xG.toFixed(2)}</td>
                        <td className="py-4 px-4 text-center font-mono text-[#D4AF37] w-20">{xA.toFixed(2)}</td>
                        <td className={xGxA90Class}>{xGxA90}</td>
                        <td className="py-4 px-4 text-center font-mono text-gray-400 w-16">{yc}</td>
                        <td className="py-4 px-4 text-center font-mono text-gray-400 w-16">{rc}</td>
                        
                        <td className="py-4 px-4 text-right w-32">
                          <Link 
                            href={`/players/${player.espnId}`}
                            className="inline-block px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0B0E14] bg-[#D4AF37] hover:bg-white transition-colors rounded-sm"
                          >
                            Dossier
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
